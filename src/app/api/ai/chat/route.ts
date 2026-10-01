import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/security";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rl = checkRateLimit(`ai_chat_${ip}`, 30, 60000); // 30 req/min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Limite de requisições excedido. Aguarde alguns instantes." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawMessage = body.message || body.prompt || (Array.isArray(body.messages) ? body.messages[body.messages.length - 1]?.content : "");
    const userProfile = body.userProfile || {};
    const context = body.context || "general";

    if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
      return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
    }

    const cleanMessage = sanitizeInput(rawMessage).trim();
    const lower = cleanMessage.toLowerCase();

    // Motor de inteligência contextual com respostas técnicas em Educação Física e Nutrição Esportiva
    let responseText = "";
    let suggestions: string[] = [];

    if (lower.includes("treino") || lower.includes("divisão") || lower.includes("split") || lower.includes("série") || lower.includes("hipertrofia")) {
      responseText = `Para otimizar seus resultados de hipertrofia e força no GymFlow, recomendamos uma divisão baseada no seu volume semanal recuperável:
- **Divisão Ideal**: ABCD (Push / Pull / Legs / Superior) ou ABC (Peito+Tríceps, Costas+Bíceps, Pernas).
- **Faixa de Repetições**: 6 a 12 repetições com 1 a 2 repetições na reserva (RIR 1-2).
- **Sobrecarga Progressiva**: Aumente carga ou repetições semana a semana mantendo a cadência controlada (2s excêntrica / 1s concêntrica).
- **Descanso Entre Séries**: 90 a 120s para exercícios multiarticulares compostos.

Você pode registrar suas séries e cargas na aba **Ficha de Treino** para acompanhar sua progressão de PRs e volume bruto!`;
      suggestions = ["Como fazer sobrecarga progressiva?", "Qual o tempo ideal de cárdio?", "Calcular meus macros diários"];
    } else if (lower.includes("cardio") || lower.includes("aerobico") || lower.includes("esteira") || lower.includes("hiit") || lower.includes("gordura") || lower.includes("secar")) {
      responseText = `O protocolo cardiovascular mais eficiente para queima de gordura preservando massa magra combina duas abordagens:
1. **LISS / Zona 2 (Cárdio Contínuo Moderado)**: 20 a 40 minutos em 60-70% da FCM (frequência cardíaca máxima) — ideal na Esteira Inclinada ou Bicicleta. Excelente oxidação lipídica sem fadiga do SNC.
2. **HIIT (Tiros de Alta Intensidade)**: 10 a 15 minutos (30s esforço máximo / 45s ativo) 2x por semana para aceleração do metabolismo basal e VO2 máximo.

Use nosso **Cronômetro Interativo de Cárdio** na aba de treinos para registrar suas calorias reais diretamente no seu dashboard de evolução!`;
      suggestions = ["Cárdio antes ou depois da musculação?", "Quantas calorias queimar por dia?", "Dicas para bater a meta da semana"];
    } else if (lower.includes("dieta") || lower.includes("macro") || lower.includes("proteina") || lower.includes("caloria") || lower.includes("creatina")) {
      const weight = userProfile.weight || 75;
      const targetProtein = Math.round(weight * 2.0);
      const targetWater = (weight * 0.04).toFixed(1);

      responseText = `Diretrizes nutricionais calculadas para seu perfil (${weight} kg):
- **Proteína Diária**: ~${targetProtein}g de proteína de alto valor biológico (2.0g/kg) distribuídas em 4-5 refeições de 25-40g.
- **Hidratação de Titã**: Mínimo de ${targetWater} Litros de água/dia.
- **Creatina Monoidratada**: 3g a 5g todos os dias (com ou sem treino), preferencialmente junto a uma fonte de carboidrato para melhor absorção.
- **Balanço Calórico**: Déficit leve (-300 a -450 kcal) para definição ou Superávit limpo (+250 a +400 kcal) para ganho de massa seca.`;
      suggestions = ["Calcular taxa metabólica basal", "Sugestão de pré-treino", "Qual o melhor horário da creatina?"];
    } else if (lower.includes("dor") || lower.includes("lesão") || lower.includes("recuperação") || lower.includes("descanso")) {
      responseText = `A recuperação muscular é onde a hipertrofia realmente acontece:
- **Sono Anabólico**: 7 a 9 horas de sono profundo com ciclo circadiano regular.
- **Dor Tardia (DOMS)**: Normal até 48h pós-treino novo. Caso a dor seja articular aguda ou em tendões, reduza amplitude ou consulte um profissional.
- **Deload**: A cada 6 a 8 semanas de treino intenso, reduza o volume pela metade durante 1 semana para regenerar articulações e o sistema nervoso central.`;
      suggestions = ["Como funciona a semana de Deload?", "Alongamentos recomendados", "Exercícios de mobilidade"];
    } else {
      responseText = `Olá! Sou o **GymBot AI**, assistente biomecânico e nutricional oficial do GymFlow.

Como posso ajudar sua evolução hoje? Posso:
1. Montar ou ajustar sua divisão de treinos (Push/Pull/Legs, ABCD, etc.).
2. Calcular seus macronutrientes e calorias personalizadas.
3. Prescrever estratégias de cárdio em Zona 2 ou HIIT.
4. Tirar dúvidas sobre execução de exercícios, cadência e sobrecarga progressiva.`;
      suggestions = ["Prescrever uma rotina de hipertrofia", "Estratégia de cárdio para secar", "Calcular meus macros diários"];
    }

    return NextResponse.json({
      response: responseText,
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno no processamento da IA.", details: error?.message },
      { status: 500 }
    );
  }
}
