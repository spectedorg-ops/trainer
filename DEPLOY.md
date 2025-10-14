# 🌐 Guia de Deploy (Colocar Online)

Este guia mostra como publicar seu sistema na internet gratuitamente usando a Vercel.

## 📋 Pré-requisitos

- ✅ Projeto funcionando localmente
- ✅ Supabase configurado
- ✅ Conta no GitHub (grátis)
- ✅ Conta na Vercel (grátis)

## 🚀 Opção 1: Deploy via Vercel (Recomendado)

### Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com
2. Clique em **"New repository"**
3. Preencha:
   - **Repository name**: tibia-treinos
   - **Public** ou **Private** (escolha)
4. Clique em **"Create repository"**

### Passo 2: Fazer Upload do Projeto

No terminal, na pasta do projeto:

```bash
# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Sistema de treinos Tibia - versão inicial"

# Conectar ao GitHub (substitua SEU_USUARIO e tibia-treinos pelo nome correto)
git remote add origin https://github.com/SEU_USUARIO/tibia-treinos.git

# Fazer push
git branch -M main
git push -u origin main
```

### Passo 3: Deploy na Vercel

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"** (ou Login se já tiver conta)
3. Faça login com GitHub
4. Clique em **"New Project"**
5. Selecione o repositório **tibia-treinos**
6. Clique em **"Import"**

### Passo 4: Configurar Variáveis de Ambiente

1. Na tela de configuração, clique em **"Environment Variables"**
2. Adicione as duas variáveis:

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: (cole sua URL do Supabase)

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: (cole sua chave anon do Supabase)

3. Clique em **"Deploy"**
4. Aguarde 2-3 minutos

### Passo 5: Pronto! 🎉

Seu site estará no ar em uma URL tipo:
```
https://tibia-treinos.vercel.app
```

Compartilhe esse link com sua guilda!

## 🔄 Como Atualizar o Site

Sempre que fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

A Vercel detecta automaticamente e atualiza o site!

## 🛡️ Segurança

### Configurar Domínio Próprio (Opcional)

1. Na Vercel, vá em **Settings** do projeto
2. Clique em **Domains**
3. Adicione seu domínio personalizado

### Backup do Banco de Dados

O Supabase faz backups automáticos, mas você pode:

1. No Supabase, vá em **Database** → **Backups**
2. Veja todos os backups disponíveis
3. Pode restaurar a qualquer momento

## 💡 Dicas

### Melhorar Performance

1. As imagens já são otimizadas automaticamente pelo Next.js
2. O Supabase tem CDN global
3. A Vercel distribui globalmente

### Monitorar Uso

- **Vercel**: Dashboard mostra acessos e performance
- **Supabase**: Dashboard mostra consultas ao banco

### Limites Gratuitos

**Vercel (Free Plan)**:
- ✅ 100 GB bandwidth/mês
- ✅ Deploys ilimitados
- ✅ SSL automático
- ✅ Domínio personalizado

**Supabase (Free Plan)**:
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth/mês
- ✅ 50,000 usuários ativos/mês

## 🆘 Problemas Comuns

### Site não carrega dados

1. Verifique as variáveis de ambiente na Vercel
2. Clique em **Settings** → **Environment Variables**
3. Confirme que estão corretas
4. Se mudar, clique em **Redeploy**

### Erro de CORS

1. No Supabase, vá em **Settings** → **API**
2. Em **API Settings**, adicione a URL da Vercel em **Site URL**

### Upload de imagens não funciona

1. Verifique se o bucket existe no Supabase
2. Verifique se está marcado como **Public**

## 📊 Opções de Deploy Alternativas

### Netlify
Similar à Vercel, mas com interface diferente

### Railway
Boa opção se quiser ter mais controle do backend

### Cloudflare Pages
Rápido e com bom CDN

---

## ⚡ Comandos Úteis

```bash
# Ver status do Git
git status

# Ver histórico de commits
git log

# Cancelar mudanças não commitadas
git checkout .

# Criar nova branch para testar mudanças
git checkout -b teste-nova-feature

# Voltar para branch principal
git checkout main

# Ver diferenças
git diff
```

---

**🎮 Bom jogo e boa gestão dos treinos!**
