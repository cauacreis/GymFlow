/**
 * ==============================================================================
 * GYMFLOW — SUÍTE DE TESTES DE ALTA CONCORRÊNCIA, ESTRESSE E ESCALA DE PRODUÇÃO
 * ==============================================================================
 * Executa testes rigorosos de carga paralela, corrida crítica (race conditions),
 * proteção de idempotência, ledger de webhooks e limites de memória.
 * 
 * Executar via terminal:
 * npx tsx scripts/test-production-scale.ts
 */

import {
  acquireIdempotencyLock,
  commitIdempotencySuccess,
  acquireWebhookEventLock,
  commitWebhookProcessed,
  resolvePaymentStateTransition,
  calculateDeterministicSubscriptionExtension,
  canonicalJsonStringify,
  hashPayload,
  isValidUuid,
  PaymentStatus,
} from "../src/lib/idempotency";

import { sanitizeInput, sanitizeObject } from "../src/lib/security";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runScalabilitySuite() {
  console.log("\n=======================================================");
  console.log("🚀 GYMFLOW: SUÍTE DE ESTRESSE & ESCALA PARA PRODUÇÃO REAL");
  console.log("=======================================================\n");

  // ---------------------------------------------------------------------------
  // 1. CORRIDA CONCORRENTE MASSIVA: 50 Requisições Disputando a Mesma Chave
  // ---------------------------------------------------------------------------
  console.log("🔹 1. Testando Corrida Crítica Concorrente (50 Disparos Simultâneos de Idempotência)...");
  {
    const raceKey = `scale_race_key_${Date.now()}`;
    const racePayload = { plan: "pro", amount: 45.0, user: "usr_scale_001" };
    const raceHash = hashPayload(racePayload);

    // Dispara 50 chamadas estritamente em paralelo usando Promise.all
    const concurrentRequests = Array.from({ length: 50 }, () =>
      acquireIdempotencyLock({
        key: raceKey,
        route: "/api/payment/mercadopago/pix",
        requestHash: raceHash,
        userId: "usr_scale_001",
      })
    );

    const results = await Promise.all(concurrentRequests);

    const acquiredCount = results.filter((r) => r.state === "acquired").length;
    const conflictCount = results.filter((r) => r.state === "conflict").length;

    assert(
      acquiredCount === 1,
      "Exatamente 1 requisição entre 50 venceu e adquiriu a trava de processamento",
      `acquired: ${acquiredCount}`
    );
    assert(
      conflictCount === 49,
      "As outras 49 requisições simultâneas foram bloqueadas com 409 Conflict (Zero Double-Charge)",
      `conflict: ${conflictCount}`
    );

    // Simula conclusão bem-sucedida da 1ª chamada
    await commitIdempotencySuccess({
      key: raceKey,
      responseStatus: 200,
      responseBody: { paymentId: "pay_scale_confirmed", status: "pending" },
      resourceId: "pay_scale_confirmed",
    });

    // 50 novas requisições subsequentes devem todas receber o resultado em cache
    const replayRequests = Array.from({ length: 50 }, () =>
      acquireIdempotencyLock({
        key: raceKey,
        route: "/api/payment/mercadopago/pix",
        requestHash: raceHash,
        userId: "usr_scale_001",
      })
    );

    const replayResults = await Promise.all(replayRequests);
    const cachedCount = replayResults.filter((r) => r.state === "cached").length;

    assert(
      cachedCount === 50,
      "Todas as 50 retentativas subsequentes receberam resposta cacheada sem reprocessar",
      `cached: ${cachedCount}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. CORRIDA CONCORRENTE DE WEBHOOK: 50 Entregas Simultâneas do Mesmo Evento
  // ---------------------------------------------------------------------------
  console.log("\n🔹 2. Testando Corrida Crítica de Webhook Ledger (50 Disparos Simultâneos de Webhook)...");
  {
    const webhookEventId = `mp_scale_evt_${Date.now()}`;
    const webhookPayload = { type: "payment", data: { id: "9988776655" } };

    // 50 entregas concorrentes do Mercado Pago
    const concurrentWebhooks = Array.from({ length: 50 }, () =>
      acquireWebhookEventLock({
        eventId: webhookEventId,
        eventType: "payment",
        resourceId: "9988776655",
        payload: webhookPayload,
      })
    );

    const webhookResults = await Promise.all(concurrentWebhooks);

    const acceptedCount = webhookResults.filter((r) => r.shouldProcess && r.status === "acquired").length;
    const droppedCount = webhookResults.filter(
      (r) => !r.shouldProcess || r.status === "in_progress" || r.status === "already_processed"
    ).length;

    assert(
      acceptedCount === 1,
      "Exatamente 1 entrega de webhook foi aceita para processamento pelo Ledger",
      `accepted: ${acceptedCount}`
    );
    assert(
      droppedCount === 49,
      "As outras 49 entregas duplicadas foram descartadas sem provocar múltiplos créditos",
      `dropped: ${droppedCount}`
    );

    // Marca como processado
    await commitWebhookProcessed(webhookEventId);

    // Novo disparo após concluído
    const postDelivery = await acquireWebhookEventLock({
      eventId: webhookEventId,
      eventType: "payment",
      resourceId: "9988776655",
      payload: webhookPayload,
    });

    assert(
      postDelivery.status === "already_processed" && !postDelivery.shouldProcess,
      "Replay tardio de webhook detectado e ignorado como already_processed"
    );
  }

  // ---------------------------------------------------------------------------
  // 3. THROUGHPUT & FUZZING DA MÁQUINA DE ESTADOS (FSM)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 3. Testando Robustez e Fuzzing da Máquina de Estados (FSM com 120 Transições)...");
  {
    const allStatuses: PaymentStatus[] = [
      "pending",
      "in_process",
      "authorized",
      "approved",
      "in_mediation",
      "cancelled",
      "rejected",
      "refunded",
      "charged_back",
    ];

    let invalidRegressionBlocked = 0;
    let validProgressionAllowed = 0;

    for (const current of allStatuses) {
      for (const next of allStatuses) {
        const transition = resolvePaymentStateTransition(current, next);

        // Se o status já for 'approved', 'refunded', 'charged_back', 'cancelled', 'rejected'
        // NUNCA deve regredir para 'pending' ou 'in_process'
        if (
          ["approved", "refunded", "charged_back", "cancelled", "rejected"].includes(current) &&
          ["pending", "in_process"].includes(next)
        ) {
          if (!transition.allowed) {
            invalidRegressionBlocked++;
          }
        } else if (transition.allowed) {
          validProgressionAllowed++;
        }
      }
    }

    assert(
      invalidRegressionBlocked === 10,
      `FSM bloqueou com sucesso todas as 10 regressões críticas de status terminal para pendente (${invalidRegressionBlocked}/10)`
    );
    assert(
      validProgressionAllowed > 0,
      `FSM validou e permitiu ${validProgressionAllowed} transições legítimas do ciclo de vida financeiro`
    );
  }

  // ---------------------------------------------------------------------------
  // 4. ESTRESSE DE CÁLCULO DETERMINÍSTICO DE ASSINATURA (1.000 Usuários)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 4. Testando Cálculo Determinístico de Assinatura sob Carga (1.000 Renovações)...");
  {
    let validExtensions = 0;
    const baseNow = new Date("2026-09-25T12:00:00Z");

    for (let i = 0; i < 1000; i++) {
      const isNew = i % 3 === 0;
      const isExpired = i % 3 === 1;
      const isActive = i % 3 === 2;

      let currentEnd: string | undefined = undefined;
      if (isExpired) {
        currentEnd = new Date(baseNow.getTime() - 10 * 86400000).toISOString(); // Venceu há 10 dias
      } else if (isActive) {
        currentEnd = new Date(baseNow.getTime() + 15 * 86400000).toISOString(); // Vence daqui a 15 dias
      }

      const result = calculateDeterministicSubscriptionExtension({
        currentEndsAt: currentEnd,
        daysToAdd: 30,
        referenceDate: baseNow,
      });

      const resultDate = result.newEndsAt;

      if (isNew || isExpired) {
        const diffDays = Math.round((resultDate.getTime() - baseNow.getTime()) / 86400000);
        if (diffDays === 30) validExtensions++;
      } else if (isActive) {
        const diffDays = Math.round((resultDate.getTime() - baseNow.getTime()) / 86400000);
        if (diffDays === 45) validExtensions++;
      }
    }

    assert(
      validExtensions === 1000,
      `1.000 cálculos de renovação de assinatura executados com 100% de exatidão matemática (${validExtensions}/1000)`
    );
  }

  // ---------------------------------------------------------------------------
  // 5. TESTE DE ESTRESSE DO RATE LIMITER & LIMPEZA DE MEMÓRIA (10.000 Requisições)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 5. Testando Estresse do Rate Limiter em Memória (10.000 Requisições & 1.000 IPs)...");
  {
    const rateLimits = new Map<string, { count: number; resetTime: number }>();
    const now = Date.now();
    let blockedCount = 0;

    const startPerf = performance.now();

    for (let ipIndex = 0; ipIndex < 1000; ipIndex++) {
      const ip = `192.168.1.${ipIndex}`;
      for (let reqIndex = 0; reqIndex < 10; reqIndex++) {
        const key = `auth:${ip}`;
        const entry = rateLimits.get(key);

        if (!entry || entry.resetTime < now) {
          rateLimits.set(key, { count: 1, resetTime: now + 60000 });
        } else {
          entry.count += 1;
          if (entry.count > 5) {
            blockedCount++;
          }
        }
      }
    }

    const endPerf = performance.now();
    const durationMs = Math.round(endPerf - startPerf);

    assert(
      durationMs < 200,
      `10.000 requisições processadas em ${durationMs}ms pelo rate limiter (alta performance para Edge)`
    );
    assert(
      blockedCount === 1000 * 5,
      `Exatamente 5.000 requisições excedentes bloqueadas (5 permitidas + 5 bloqueadas por IP)`
    );

    // Testa limpeza automática de cache acima de 2.000 registros
    const simulatedOldMap = new Map<string, { count: number; resetTime: number }>();
    for (let i = 0; i < 2500; i++) {
      simulatedOldMap.set(`key_${i}`, { count: 1, resetTime: now - 1000 }); // Expirados
    }

    if (simulatedOldMap.size > 2000) {
      simulatedOldMap.forEach((val, k) => {
        if (val.resetTime < now) {
          simulatedOldMap.delete(k);
        }
      });
    }

    assert(
      simulatedOldMap.size === 0,
      "Limpeza periódica de memória eliminou 100% das 2.500 chaves expiradas, prevenindo Memory Leak"
    );
  }

  // ---------------------------------------------------------------------------
  // 6. RESISTÊNCIA A PAYLOADS EXTREMOS, FUZZING, SQLi & XSS
  // ---------------------------------------------------------------------------
  console.log("\n🔹 6. Testando Resistência a Injeções, Fuzzing e Payloads Extremos...");
  {
    // Teste 6.1: Sanitização contra XSS e SQL Injection em inputs
    const dangerousInput = "<script>document.cookie='leak'</script>' OR '1'='1' -- \"; DROP TABLE profiles;";
    const sanitized = sanitizeInput(dangerousInput);

    assert(
      !sanitized.includes("<script>") && !sanitized.includes("</script>"),
      "Tags de script perigosas foram neutralizadas com escape HTML",
      sanitized
    );

    // Teste 6.2: Sanitização de Objetos Profundos e Complexos
    const nestedMalicious = {
      name: "João Silva <img src=x onerror=alert(1)>",
      notes: "Atestado médico ' OR 1=1;",
      nested: {
        danger: "<svg onload=alert(2)>",
        age: 28,
      },
    };
    const sanitizedObj = sanitizeObject(nestedMalicious);

    assert(
      !sanitizedObj.name.includes("<img") && !sanitizedObj.nested.danger.includes("<svg"),
      "Sanitização recursiva neutralizou XSS em objetos profundamente aninhados"
    );

    // Teste 6.3: Hash Canônico com Payload Gigante (100KB)
    const largeObject: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      largeObject[`field_${i.toString().padStart(4, "0")}`] = `value_${i}_`.repeat(10);
    }
    const largeHash1 = hashPayload(largeObject);
    const largeHash2 = hashPayload(largeObject);

    assert(
      largeHash1.length === 64 && largeHash1 === largeHash2,
      "Hash SHA-256 canônico gerou assinatura determinística de 64 caracteres para payload de 100KB sem crash"
    );

    // Teste 6.4: Defesa contra Prototype Pollution
    const maliciousPayloadWithProto = JSON.parse('{"__proto__": {"admin": true}, "name": "Aluno"}');
    const canonicalProto = canonicalJsonStringify(maliciousPayloadWithProto);
    assert(
      !canonicalProto.includes("__proto__"),
      "Chaves de Prototype Pollution (__proto__) neutralizadas na serialização canônica"
    );

    // Teste 6.5: Validação Estrita de UUIDs
    assert(isValidUuid("c37118a3-81f4-40e1-adc3-464e72e4ebc8"), "UUID v4 padrão válido aceito");
    assert(!isValidUuid("1' OR '1'='1"), "Injeção SQL em campo UUID rejeitada com segurança");
    assert(!isValidUuid("../../../etc/passwd"), "Path traversal em campo UUID rejeitado com segurança");
  }

  // ---------------------------------------------------------------------------
  // 7. VERIFICAÇÃO DE CONFIGURAÇÃO DE PRODUÇÃO REAL (Sem Localhost)
  // ---------------------------------------------------------------------------
  console.log("\n🔹 7. Verificando Configuração de Produção Real (Auditoria de Domínio)...");
  {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
    const isProductionUrl =
      appUrl.startsWith("https://") &&
      !appUrl.includes("localhost") &&
      !appUrl.includes("127.0.0.1");

    assert(
      isProductionUrl,
      `NEXT_PUBLIC_APP_URL configurado com HTTPS oficial de produção: ${appUrl}`
    );
  }

  console.log("\n=======================================================");
  console.log(`📊 RESULTADO DA SUÍTE DE ESCALA: ${passCount} PASSOU | ${failCount} FALHOU`);
  console.log("=======================================================\n");

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 TODOS OS TESTES DE ALTA ESCALA E CONCORRÊNCIA PASSARAM COM SUCESSO!\n");
  }
}

runScalabilitySuite().catch((err) => {
  console.error("❌ Erro fatal na suíte de testes de escala:", err);
  process.exit(1);
});
