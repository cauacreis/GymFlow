# 🥗 GymFlow — Mobile Nutrition & Performance Platform

![GymFlow Banner](https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80)

> **GymFlow** é uma aplicação web mobile-first de alta performance focada em gastronomia saudável, nutrição esportiva e personalização precisa de refeições fit. Projetada com estética ultra-premium (Awwwards-tier), microinterações fluidas e arquitetura pronta para publicação direta na Google Play Store (PWA / Capacitor).

---

## 📱 Mobile-First por Design

O GymFlow foi construído prioritariamente para a experiência na ponta dos dedos:
- Layout responsivo com comportamento nativo de aplicativo móvel (`viewport-fit=cover`, gestos táteis, touch targets generosos de 44px+).
- Navegação otimizada com menu flutuante em pílula e indicador físico deslizante.
- Preparado para empacotamento com **Capacitor** ou **TWA (Trusted Web Activity)** para publicação rápida na Google Play Store sem reescrita de código.

---

## ✨ Principais Diferenciais e Funcionalidades

### 1. Vitrine Dinâmica & Microinterações
- **Banner Rotativo Interativo**: Transição suave entre pratos-chave com pausa no hover/touch e avanço rápido por clique tátil.
- **Ticker de Destaques (Marquee Ativo)**: Barra de novidades contínua que pausa ao toque e atua como atalho para etapas do montador.
- **Menu Pílula Magnético**: Indicador físico que desliza acompanhando a rolagem e o contexto do usuário.

### 2. Montador Inteligente & Dashboard de Macronutrientes em Tempo Real
- **Arquitetura em Etapas**: Escolha sequencial e limpa (Base, Proteína, Acompanhamentos, Saladas, Molhos e Extras) com fotografia e ativos transparentes.
- **Cálculo Nutricional Instantâneo**: Atualização em tempo real de Calorias (kcal), Proteínas (g), Carboidratos (g) e Gorduras (g), com recálculo automático para porção Individual ou Família.
- **Controles de Porção Padronizados**: Botões táteis consistentes para padrão, extra ou remoção de ingredientes.

### 3. Visual Limpo & Ativos 3D Volumétricos
- Eliminação total de ruídos flutuantes e selos repetitivos sobre as fotos.
- Ativos 3D renderizados com canal alfa (fundo 100% transparente) para estado de sacola vazia e destaques.
- Favicon e logos com recorte nítido e fundo transparente.

### 4. Segurança, Autenticação e Checkout
- **Tela de Login / Cadastro**: Inspirada no design system da Aceternity UI com animação suave e validação Zod.
- **Pagamento Integrado com Mercado Pago**: Fluxo de checkout seguro em Sandbox, com tokenização cliente, idempotência e verificação HMAC em webhooks.
- **Assistente Nutricional com IA Gratuita**: Sugestões inteligentes de pratos baseadas nas metas de treino do usuário, com fallback local sem custo de API.
- **Mapa Noturno com Geolocalização**: Pinos pulsantes para retirada presencial ou cálculo de raio de entrega.

---

## 🔒 Segurança em Primeiro Lugar (Repositório Público)

Este repositório adota uma política estrita de segurança pública:
- Nenhuma chave secreta ou token em código.
- Template `.env.example` versionado com credenciais dummy.
- Headers de segurança rigorosos (CSP, HSTS, X-Frame-Options: DENY).
- Service Worker com exclusão de rotas sensíveis (`/checkout`, `/profile`).

Consulte [SECURITY_RULES.md](./SECURITY_RULES.md) para detalhes completos das políticas de commit e proteção.

---

## 🚀 Como Executar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/cauacreis/GymFlow.git
cd GymFlow

# 2. Instalar as dependências
npm install

# 3. Configurar as variáveis de ambiente
cp .env.example .env.local

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador ou emule o modo móvel no DevTools.

---

## 🗺️ Roadmap de Lançamento

- [x] **Commit 1**: Inicialização do repositório, `.gitignore`, `.env.example`, `SECURITY_RULES.md` e documentação base.
- [ ] **Commit 2**: Setup do Obsidian Vault (`10_Projetos/GymFlow/`) com diário de bordo e decisões arquiteturais.
- [ ] **Commit 3**: Setup do Next.js 14+ com Tailwind CSS, TypeScript e bibliotecas de animação e ícones.
- [ ] **Commit 4**: Headers de segurança, middleware de rate-limiting e sanitização.
- [ ] **Commit 5**: Design Tokens, tipografia e temas escuros de alta fidelidade (Ethereal Glass).
- [ ] **Commit 6**: Sistema de Navegação Mobile (Navbar flutuante em pílula com indicador deslizante).
- [ ] **Commit 7**: Banner Hero Rotativo e Clicável com microinterações e paginação minimalista.
- [ ] **Commit 8**: Marquee Ticker interativo com links de âncora direta.
- [ ] **Commit 9**: Montador de Pratos Fit com seletor de etapas e fotografia limpa.
- [ ] **Commit 10**: Dashboard de Macronutrientes em Tempo Real (Calorias, Proteínas, Carbs, Gorduras).
- [ ] **Commit 11**: Prova Social e Depoimentos com pessoas reais e avaliações autênticas.
- [ ] **Commit 12**: Mapa Interativo Dark Mode com geolocalização e pinos pulsantes.
- [ ] **Commit 13**: Sacola de Pedidos com drawer tátil e tela de confirmação festiva.
- [ ] **Commit 14**: Tela de Autenticação estilo Aceternity UI com formulários validados por Zod.
- [ ] **Commit 15**: Arquitetura de Pagamento Mercado Pago (Sandbox) + Assistente IA gratuito e manifesto PWA.

---

## 📄 Licença
Distribuído sob licença MIT. Consulte `LICENSE` para mais detalhes.
