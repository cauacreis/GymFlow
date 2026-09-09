# 🛡️ Diretrizes de Segurança & Protocolo de Commits - GymFlow

> **ATENÇÃO CRÍTICA**: Este repositório é **PÚBLICO** (`https://github.com/cauacreis/GymFlow.git`). Qualquer segredo, token, chave de API ou credencial commitada será indexada e exposta publicamente para sempre no histórico do Git.

---

## 🔒 1. Regras Inegociáveis de Commits e Push

1. **PROIBIDO Commitar Arquivos de Ambiente (.env)**:
   - Somente o arquivo `.env.example` (com valores fictícios/placeholders) é versionado.
   - Qualquer `.env`, `.env.local`, `.env.production` está estritamente bloqueado no `.gitignore`.
2. **Varredura Obrigatória Pré-Commit**:
   - Antes de qualquer `git commit`, verificar `git status` e inspecionar os arquivos em staging (`git diff --staged`).
   - Nenhuma string contendo chaves como `TEST-`, `APP_USR-`, senhas, tokens JWT ou URLs privadas de banco de dados deve estar hardcoded em arquivos de código.
3. **Padrão Semântico de Commits (Conventional Commits)**:
   - `feat(...)`: Novas funcionalidades.
   - `fix(...)`: Correções de bugs ou segurança.
   - `ui(...)`: Ajustes visuais, microinterações e componentes de interface.
   - `sec(...)`: Implementações de segurança, headers, validações e rate-limiting.
   - `docs(...)`: Documentação técnica e guias.
   - `chore(...)`: Configurações de ambiente, dependências e automações.
4. **Metodologia de 15 Commits Progressivos**:
   - O desenvolvimento deve ser dividido em commits atômicos, focados e bem documentados, permitindo rastreabilidade total de cada evolução do produto.

---

## 🛡️ 2. Arquitetura de Segurança Aplicada

### A. Autenticação e Sessão
- Autocomplete semântico em campos de formulário (`username`, `current-password`, `new-password`).
- Mensagens de erro padronizadas e cegas: *"E-mail ou senha incorretos"* (sem revelar se o usuário existe).
- Rate-limiting em rotas sensíveis (máximo de 5 tentativas de login por IP / hora).
- Proteção contra Clickjacking via `X-Frame-Options: DENY` e `frame-ancestors 'none'`.
- Tokens em cookies `httpOnly`, `Secure`, `SameSite=Strict`.

### B. Integração com Mercado Pago (Zero Risco)
- **Zero Dados de Cartão no Servidor Próprio**: O frontend jamais manipula números de cartão crus; usa SDK oficial com tokenização direta no Mercado Pago.
- **Idempotência**: Cada transação gera uma `X-Idempotency-Key` única (UUID v4) para evitar cobrança duplicada em caso de retry de rede.
- **Validação HMAC em Webhooks**: Todos os webhooks recebidos do Mercado Pago devem validar a assinatura criptográfica (`x-signature` / HMAC-SHA256) antes de alterar o status de qualquer pedido.
- **Verificação Cruzada de Valores**: O backend recalcula o valor real dos itens e compara com o valor da ordem; o usuário nunca define o preço no payload do frontend.
- **Ambiente de Sandbox**: O código padrão opera 100% em modo sandbox até a configuração explícita de produção via variáveis de ambiente seguras.

### C. Proteção do Navegador e PWA
- **Content Security Policy (CSP)** restritiva.
- **Service Worker Seguro**: NUNCA fazer cache de rotas privadas ou transacionais (`/checkout`, `/api/payment`, `/profile`).
- **Sanitização de Inputs**: Schemas estritos com Zod em todas as entradas de dados e requisições de API.

---

## 📋 3. Checklist de Auditoria Contínua

- [x] `.gitignore` configurado cobrindo todas as extensões de segredos, builds e caches.
- [x] `.env.example` criado sem credenciais reais.
- [x] Regras de commit e push documentadas.
- [ ] Headers HTTP de segurança aplicados no servidor (`next.config.mjs`).
- [ ] Middleware com rate-limiting e verificação de rota ativo.
- [ ] Validações Zod em formulários e APIs.
- [ ] Sandbox do Mercado Pago desacoplado e pronto para produção.
- [ ] Integração de IA gratuita com fallback local sem custos.
