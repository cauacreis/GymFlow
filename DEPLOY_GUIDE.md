# 🚀 Guia Oficial de Produção — Supabase & Vercel (GymFlow)

Este guia prático ensina passo a passo como colocar o **GymFlow** no ar em produção com **dados reais**, banco de dados em nuvem no **Supabase** e hospedagem global ultrarrápida na **Vercel** (ambos no plano 100% gratuito).

---

## 📋 Sumário
1. [Passo 1: Criar Banco de Dados no Supabase](#passo-1-criar-banco-de-dados-no-supabase)
2. [Passo 2: Rodar o Script de Criação das Tabelas (`schema.sql`)](#passo-2-rodar-o-script-de-criação-das-tabelas-schemasql)
3. [Passo 3: Coletar as Chaves do Supabase](#passo-3-coletar-as-chaves-do-supabase)
4. [Passo 4: Configurar Localmente (.env.local)](#passo-4-configurar-localmente-envlocal)
5. [Passo 5: Deploy Contínuo na Vercel](#passo-5-deploy-contínuo-na-vercel)
6. [Passo 6: Testar a Aplicação Real](#passo-6-testar-a-aplicação-real)

---

## Passo 1: Criar Banco de Dados no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e clique em **"Start your project"** ou **"Sign in"** (você pode entrar direto com sua conta do GitHub).
2. No painel principal (Dashboard), clique no botão verde **"New Project"**.
3. Preencha as informações:
   - **Name**: `GymFlow` (ou o nome que preferir).
   - **Database Password**: Escolha uma senha forte e anote-a em local seguro.
   - **Region**: Selecione **"São Paulo (sa-east-1)"** (ou a mais próxima do Brasil para menor latência).
   - **Pricing Plan**: Escolha **Free Tier** (gratuito).
4. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos enquanto o Supabase provisiona o banco de dados PostgreSQL.

---

## Passo 2: Rodar o Script de Criação das Tabelas (`schema.sql`)

O GymFlow inclui um script SQL completo e pronto na pasta `supabase/schema.sql` do projeto.

1. No menu lateral esquerdo do Supabase, clique no ícone do **SQL Editor** (ícone `>_`).
2. Clique em **"New query"** (ou `+`).
3. Abra o arquivo [supabase/schema.sql](file:///C:/Users/Cauã Felype/Documents/GymFlow/supabase/schema.sql) do projeto, copie todo o conteúdo e cole no editor do Supabase.
4. Clique no botão verde **"Run"** (canto inferior direito do editor ou atalho `Ctrl + Enter`).
5. Você verá a mensagem **"Success. No rows returned"**.
6. Pronto! As seguintes tabelas e regras foram criadas com segurança:
   - `profiles`: Perfis reais de alunos e professores.
   - `students`: Carteira real de alunos presenciais e online do treinador.
   - `coach_plans`: Planos oficiais (Básico, Pro, VIP e Customizados).
   - `student_workouts`: Fichas e rotinas de treino individualizadas.
   - `bookings`: Agendamentos de treinos presenciais no salão.
   - `notifications`: Central de notificações push/in-app.
   - Triggers automáticos de sincronização de novos usuários.

---

## Passo 3: Coletar as Chaves do Supabase

1. No menu lateral esquerdo do Supabase, clique na engrenagem **"Project Settings"** (no rodapé).
2. Clique na aba **"API"** (sob a seção *Configuration*).
3. Copie os 2 valores necessários:
   - **Project URL**: Algo como `https://abcdefghijklm.supabase.co`
   - **Project API Keys > anon (public)**: Uma chave longa iniciando com `eyJhbGciOi...`

---

## Passo 4: Configurar Localmente (.env.local)

Para testar no seu computador conectando direto ao Supabase:

1. Na raiz do projeto `GymFlow`, crie um arquivo chamado `.env.local` (ou edite se já existir):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-CHAVE-ANON-AQUI
   NEXT_PUBLIC_APP_URL=http://localhost:8000
   ```
2. Salve o arquivo. O GymFlow reconhecerá as credenciais automaticamente!

> 🛡️ **Segurança**: O arquivo `.env.local` já está no `.gitignore` e é monitorado pelo `scripts/check-secrets.js` para que suas chaves secretas nunca vazem no Git público.

---

## Passo 5: Deploy Contínuo na Vercel

A Vercel é a plataforma nativa dos criadores do Next.js e hospeda o aplicativo com SSL (HTTPS), CDN global e atualizações automáticas a cada `git push`.

### 5.1 Conectar o Repositório do GitHub
1. Acesse [https://vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. No painel da Vercel, clique em **"Add New..."** > **"Project"**.
3. Na lista de repositórios do seu GitHub, localize `GymFlow` (repositório `cauacreis/GymFlow`) e clique em **"Import"**.

### 5.2 Adicionar as Variáveis de Ambiente
Na tela de configuração antes de clicar em Deploy:
1. Expanda a seção **"Environment Variables"**.
2. Adicione as variáveis que você copiou do Supabase:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL` | **Value**: `https://SEU-PROJETO.supabase.co`
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Value**: `SUA-CHAVE-ANON-AQUI`
   - **Key**: `NEXT_PUBLIC_APP_URL` | **Value**: `https://gymflow.vercel.app` (ou o domínio gerado)

### 5.3 Publicar
1. Clique no botão azul **"Deploy"**.
2. Aguarde cerca de 1 a 2 minutos enquanto a Vercel compila o Next.js 14.
3. Ao finalizar, você verá a tela de confetes com o link do seu site no ar:
   `https://gymflow-xxxx.vercel.app`! 🎉

---

## Passo 6: Testar a Aplicação Real

Ao abrir a URL da Vercel ou o localhost:
1. **Zero Mocks**: A carteira de alunos iniciará limpa, aguardando o primeiro cadastro.
2. **Cadastrar Aluno**: Clique em `+ Novo Aluno`, cadastre um aluno real da sua academia e veja-o ser persistido no Supabase na tabela `students`!
3. **Frequência & Presença**: Ao clicar em `✓ Presença` ou `⏱ Atraso`, os dados são sincronizados no Supabase.
4. **Criar Conta Real**: Abra o modal de perfil / login, crie uma conta real com e-mail e senha e veja o usuário registrado em `auth.users` do Supabase!
5. **Atualizações Futuras**: Qualquer alteração futura que você fizer no código, basta rodar:
   ```bash
   git add .
   git commit -m "sua melhoria"
   git push origin main
   ```
   A Vercel fará o deploy automático em segundos!
