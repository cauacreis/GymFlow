# 🛡️ Relatório de Auditoria de Segurança, Caça a Falhas & Estudo de Defesa — GymFlow

> **Data da Auditoria:** 11 de Setembro de 2026  
> **Ambiente Avaliado:** Next.js 14 App Router, Supabase Auth & PostgreSQL, Tailwind CSS, Framer Motion  
> **Classificação do Repositório:** Público (`https://github.com/cauacreis/GymFlow.git`)  
> **Deploy de Produção:** Vercel (`https://gymflow-weld.vercel.app`)

---

## 1. 🔍 Resumo Executivo & Caça a Falhas Realizada

Realizamos uma auditoria profunda, varredura de ponta a ponta e correção crítica em todas as camadas do GymFlow:

1. **Autenticação & Cadastro Completo (Modal & View Dedicada `/auth` e `/login`)**:
   - Criação de uma página dedicada `/auth` (e `/login`) com renderização otimizada, eliminando o erro de redirecionamento 404 que ocorria no `middleware.ts` para rotas protegidas.
   - Suporte a 5 modos de autenticação completos: `login` (com senha), `magic-link` (OTP instantâneo sem senha), `signup` (cadastro com perfil Aluno ou Personal Trainer), `forgot` (redefinição por e-mail) e `update-password` (definição de nova senha).
   - Validação Zod estrita, medidor de força de senha interativo (score 1-5 com checklist de 5 critérios), verificação em tempo real de coincidência de senhas, campos específicos por papel (CREF, Especialidade e Bio para Personal Trainers; Objetivo para Alunos), preferência "Lembrar de mim" e modal de Termos de Uso / LGPD.
   - Resolução de conflito de acessibilidade onde um `<button>` dentro do `<label>` de termos disparava clique duplo e alternava inesperadamente o checkbox.
   - Limpeza defensiva do histórico da URL (`window.history.replaceState`) ao concluir a redefinição de senha para impedir que recargas da página ficassem presas no modo de recuperação.

2. **Integridade de Sessão, Persistência e Sincronização**:
   - **Correção Crítica de Perda de Dados no Login:** A implementação anterior buscava o perfil do Supabase mas extraía apenas `name` e `active_role`, descartando silenciosamente `phone`, `cref`, `specialty`, `bio`, `goal`, `matricula` e `pricing`. Corrigido integrando `fetchProfileFromSupabase` para carregar e preservar 100% dos dados cadastrais.
   - **Persistência de Alternância de Papel:** `switchUserRole` atualizava apenas o localStorage. Ao recarregar a página, o `initAuthSession` lia o papel antigo do Supabase e revertia a escolha do usuário. Corrigido sincronizando a mudança imediatamente com `saveProfileToSupabase`.
   - **Preservação de Bio e Sincronização no Cadastro:** O campo de biografia preenchido pelo professor era descartado em `registerNewUser`. Corrigido permitindo `bio` e `hourlyRate`, além de cadastrar automaticamente o novo professor no Marketplace (`updateCoachPublicProfile`) e o novo aluno na lista do treinador (`saveNewStudent`).

3. **Isolamento de Identidade & Eliminação de Hardcoding**:
   - **Isolamento na Agenda do Aluno:** Em `StudentAgendaCalendar.tsx`, se o aluno logado não estivesse no array de mocks, o sistema caía em `allStudents[0]` (Mariana Oliveira), exibindo os dados pessoais e faltas de outro aluno. Corrigido sintetizando o perfil a partir do `currentUser` autenticado e restringindo o filtro de agendamentos.
   - **Desacoplamento de Coach Hardcoded:** No `UserProfileModal.tsx`, a edição de dados do professor chamava `updateCoachPublicProfile("coach_rodrigo")`, sobrescrevendo o perfil de outro professor. Corrigido usando `profile.id`.
   - **Agenda do Coach Dinâmica:** Em `CoachDashboard.tsx`, o `<CoachAgendaManager>` recebia `coach_rodrigo` fixo. Corrigido repassando o ID dinâmico do treinador logado (`currentUser.id`).

4. **Auditoria de Entradas & Proteção contra Injeção / XSS / DoS**:
   - Aplicação de limites numéricos (`Math.min` / `Math.max`) e `maxLength` em todos os campos personalizados (`WorkoutSheet`, gorjetas do `PersonalMarketplaceView`).
   - Validação e sanitização de payloads de webhook Mercado Pago com `crypto.timingSafeEqual`.

---

## 2. 📋 Matriz Detalhada de Vulnerabilidades Auditadas e Corrigidas

| Componente / Rota | Falha Identificada | Impacto | Correção Aplicada | Status |
| :--- | :--- | :--- | :--- | :---: |
| `src/app/auth/page.tsx` & `/login` | Ausência de rota física `/auth` | Middleware redirecionava para 404 | Criada página completa com layout OLED, Suspense e suporte a query params | ✅ Corrigido |
| `src/components/auth/AuthModal.tsx` | Login descartava 90% dos dados do Supabase | Perda de CREF, bio, telefone e especialidade | Integrado `fetchProfileFromSupabase` completo e fallback a `user_metadata` | ✅ Corrigido |
| `src/components/auth/AuthModal.tsx` | URL ficava presa em `#type=recovery` após troca de senha | Recarga da página reabria o modal de senha | Limpeza de URL com `window.history.replaceState` preservando query params | ✅ Corrigido |
| `src/components/auth/AuthModal.tsx` | Ausência de Login Social (OAuth) | Experiência de auth incompleta | Adicionado botão e fluxo Supabase de "Continuar com o Google" | ✅ Corrigido |
| `src/components/auth/AuthModal.tsx` | Login não sincronizava coleções de Coach/Student | Coach ou Aluno logado não apareciam no marketplace ou roster local | Sincronização automática via `updateCoachPublicProfile` e `saveNewStudent` no login | ✅ Corrigido |
| `src/lib/workout-store.ts` | `saveNewStudent` gerava IDs aleatórios e duplicava alunos | Alunos re-cadastrados apareciam como clones na lista do professor | Adicionado suporte a `id` explícito e lógica de upsert por ID/e-mail | ✅ Corrigido |
| `src/components/student/StudentAgendaCalendar.tsx` | Residual `else { st = allStudents[0] }` e `slice` inseguro | Vazamento de dados de Mariana Oliveira e risco de TypeError | Resolução estrita por ID/email do usuário logado sem fallback a terceiros | ✅ Corrigido |
| `src/components/coach/CoachAgendaManager.tsx` | Falta de filtro por `coachId` na agenda | Treinador via agendamentos e notas confidenciais de outros coaches | Filtragem multi-tenant por `b.coachId === coachId` em toda a agenda | ✅ Corrigido |
| `src/app/page.tsx` | Stale closure em `handleAuthChange` sobre `currentTab` | Transições de aba não respondiam ao alternar perfil | Uso de setter funcional `setCurrentTab((prevTab) => ...)` | ✅ Corrigido |
| `src/lib/auth-store.ts` | `switchUserRole` não salvava no Supabase | Troca de papel era revertida no reload | Chamada assíncrona de `saveProfileToSupabase` ao alternar modo | ✅ Corrigido |
| `src/lib/auth-store.ts` | `registerNewUser` descartava campo `bio` | Bio do coach era sobrescrita por texto padrão | Parâmetros `bio` e `hourlyRate` incorporados e persistidos | ✅ Corrigido |
| `src/lib/booking-store.ts` | `updateCoachPublicProfile` não criava novos coaches | Treinadores recém-cadastrados não apareciam | Lógica de Upsert: se não existir, adiciona à lista pública | ✅ Corrigido |
| `src/components/profile/UserProfileModal.tsx` | `coach_rodrigo` hardcoded na edição | Coach editava e sobrescrevia outro profissional | `profile.id || "coach_rodrigo"` dinâmico | ✅ Corrigido |
| `src/components/coach/CoachDashboard.tsx` | `coach_rodrigo` hardcoded na agenda | Treinador logado não via seus agendamentos | Repasse de `currentUser.id` dinâmico para `CoachAgendaManager` | ✅ Corrigido |
| `src/components/workout/WorkoutSheet.tsx` | Entradas numéricas e de texto sem limite | Risco de DoS de renderização e valores negativos | `maxLength` em nomes/reps e clamping com `Math.min`/`Math.max` | ✅ Corrigido |
| `src/middleware.ts` | Extração insegura de IP em proxies encadeados | Risco de bypass em rate limiting | Parsing do primeiro IP de `x-forwarded-for` e rotas estritas | ✅ Corrigido |

---

## 3. 🛡️ Estudo e Diretrizes Defensivas (Base da Skill de Segurança)

### A. Repositórios Públicos & Chaves de API
- **Problema:** Robôs escaneiam commits do GitHub em busca de segredos (`APP_USR-`, service_role, tokens).
- **Diretriz Inegociável:** Nunca colocar chaves de serviço em repositórios públicos. O `scripts/check-secrets.js` atua no ciclo pré-commit bloqueando qualquer tentativa de staging de arquivos sensíveis. Segredos pertencem unicamente ao `.env.local` e Vercel Environment Variables.

### B. Proteção contra Enumeração e Timing Attacks
- **Problema:** Respostas descritivas como "E-mail não encontrado" permitem que atacantes mapeiem a base de clientes.
- **Diretriz:** Mensagens opacas no login ("E-mail ou senha incorretos").
- **Validação de Assinatura:** Em webhooks de pagamento (Mercado Pago), hashes SHA-256 devem ser comparados com `crypto.timingSafeEqual` para prevenir ataques de análise de tempo de resposta.

### C. Higiene de Estado e Multi-Tenancy no Frontend
- **Problema:** Sistemas que usam fallbacks ingênuos (como `array[0]`) podem vazar dados confidenciais de saúde e presença de outros clientes quando um usuário novo entra.
- **Diretriz:** Se o registro não existe no cache, sintetize um estado limpo associado exclusivamente ao UUID autenticado do usuário logado.

### D. Rate Limiting no Edge / Middleware
- **Problema:** Ataques de força bruta contra endpoints de autenticação e negação de serviço em APIs.
- **Diretriz:** Rate limiter no Edge com janela de 15 minutos para rotas `/api/auth` (máx 5 requisições por IP) e proteção geral de 100 req/min nas APIs.

### E. LGPD e Direito ao Esquecimento
- **Diretriz:** Oferecer endpoints auditáveis para portabilidade de dados (`/api/export-data`) e exclusão imediata e permanente de dados (`/api/delete-account`).

---

## 4. 🚀 Comandos de Verificação Executados

- **Varredura de Segredos:** `npm run check-secrets` -> ✅ **0 segredos encontrados**
- **Verificação de Tipos TypeScript:** `npx tsc --noEmit` -> ✅ **0 erros de tipagem**
- **Compilação de Produção Next.js 14:** `npm run build` -> ✅ **9 páginas geradas e otimizadas sem falhas (incluindo `/auth` e `/login`)**
