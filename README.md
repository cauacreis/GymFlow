# 🏋️ GymFlow — Mobile-First Smart Gym & Performance Platform

![GymFlow Preview](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80)

> **GymFlow** é uma plataforma mobile-first completa voltada para academias inteligentes, alunos e centros de treinamento físico. Desenvolvida em Next.js 14, TypeScript e Tailwind CSS, possui estética ultra-moderna (inspirada na Aceternity UI), feedback háptico tátil e arquitetura 100% pronta para publicação nativa na **Google Play Store** via Capacitor ou PWA.

---

## 📱 Experiência 100% Mobile-First (Play Store Ready)

O GymFlow foi arquitetado especificamente para uso em smartphones no ambiente da academia:
- **Viewport Nativo**: Bloqueio de rotação horizontal e de zoom indesejado (`viewport-fit=cover`, `maximum-scale=1.0`).
- **Navegação Háptica**: Barra de navegação inferior com pílula animada e vibração tátil em cada seleção de aba.
- **Ponte Capacitor Android**: Configurado para exportação com `npx cap add android` e geração de APK / AAB para a Google Play Store.

---

## ✨ Os 5 Pilares do GymFlow

### 1. 📋 Ficha de Treino Interativa (Split A/B/C)
- Divisão completa de treinos (Push / Pull / Legs ou ABC Superior/Inferior).
- Checkbox de conclusão de séries por toque.
- Ajuste rápido de carga (+/- 2kg) e repetições sem sair da ficha.
- Cálculo em tempo real do **Volume Total de Carga (kg levantados)** e porcentagem de conclusão do treino.
- **Cronômetro de Descanso**: Drawer com contagem regressiva, alerta sonoro e vibração háptica nos últimos segundos.

### 2. 📲 Catraca Digital Anti-Fraude (GymFlow Pass)
- Geração dinâmica de QR Code em canvas de alta definição.
- Token visual rotativo criptografado com renovação a cada 30 segundos, prevenindo prints e fraudes de acesso.
- Exibição de matrícula do aluno e status de ativação do plano.
- Simulação de leitura ótica e abertura da catraca com feedback de sucesso.

### 3. 👥 Lotação em Tempo Real & Horários de Pico
- Indicador visual do nível de ocupação da academia em tempo real (ex: 64% - Moderado).
- Gráfico dinâmico por faixas de horário para planejar os melhores horários de treino com equipamentos livres.

### 4. 🥊 Grade de Aulas Coletivas
- Agendamento instantâneo para Spinning, Muay Thai, Yoga, FitDance e Treinamento Funcional.
- Visualização de horários, vagas restantes em tempo real, instrutor responsável e gasto calórico estimado.

### 5. 📈 Evolução Física & Gamificação
- **Bioimpedância InBody**: Acompanhamento de peso corporal, percentual de gordura (% BF) e massa muscular magra com comparativo mensal.
- **Contador de Ofensiva (Streaks 🔥)**: Registro de dias consecutivos de treino ativo com metas dinâmicas.
- **Vitrine de Recordes Pessoais (PRs)**: Histórico de 1RM em supino, agachamento, levantamento terra e desenvolvimento.
- **Insígnias & Medalhas**: Desbloqueio de conquistas ("Fogo Sagrado", "Clube das 06h", "Centurião", "Batedor de PR").

---

## 🤖 GymBot IA — Personal Trainer Gratuito

- Assistente de inteligência artificial 24/7 para tirar dúvidas de biomecânica, cargas, aquecimento articular e nutrição esportiva.
- **Custo Zero**:
  - Motor local determinístico com conhecimento clínico e biomecânico refinado.
  - Suporte nativo à API gratuita do Google Gemini (`NEXT_PUBLIC_GEMINI_API_KEY`) para respostas contextuais ricas.

---

## 💳 Planos & Checkout Mercado Pago (Sandbox)

- Planos de adesão: **Smart Pass** (R$ 89,90), **Black VIP** (R$ 139,90) e **Anual Prime** (R$ 99,90).
- Integração com Mercado Pago Sandbox:
  - Geração instantânea de código PIX Copia e Cola.
  - Pagamento com cartão de crédito tokenizado em ambiente de testes.
  - Simulação de aprovação imediata com emissão de comprovante.

---

## 🔒 Segurança de Repositório Público

Este repositório adota uma política rigorosa de segurança:
1. **Zero Chaves no Código**: Nenhuma credencial ou token privado versionado.
2. **Template Sanitizado**: Apenas `.env.example` com placeholders.
3. **Proteção HTTP**: Headers de segurança (CSP, HSTS, X-Frame-Options DENY).

---

## 🚀 Como Executar o Projeto

```bash
# 1. Clonar o repositório
git clone https://github.com/cauacreis/GymFlow.git
cd GymFlow

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente (opcional para IA externa)
cp .env.example .env.local

# 4. Iniciar em modo de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador ou emule como dispositivo móvel no DevTools.

---

## 📦 Gerar APK Android para a Play Store

```bash
# 1. Construir a versão estática otimizada
npm run build

# 2. Sincronizar com o Capacitor Android
npx cap add android
npx cap sync android

# 3. Abrir no Android Studio
npx cap open android
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
