# 🚀 Guia Rápido de Instalação

## Passo a Passo Completo

### 1️⃣ Criar Conta no Supabase (GRÁTIS)

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou Email
4. Clique em **"New project"**
5. Preencha:
   - **Name**: Tibia Treinos
   - **Database Password**: Crie uma senha forte (guarde ela!)
   - **Region**: Escolha a mais próxima (ex: South America)
6. Clique em **"Create new project"**
7. Aguarde 2-3 minutos até o projeto estar pronto

### 2️⃣ Configurar o Banco de Dados

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**
3. Abra o arquivo `supabase-setup.sql` deste projeto
4. Copie TODO o conteúdo
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** (ou pressione Ctrl+Enter)
7. Deve aparecer "Success. No rows returned" ✅

### 3️⃣ Criar Bucket de Storage

1. No menu lateral, clique em **"Storage"**
2. Clique em **"New bucket"**
3. Preencha:
   - **Name**: `payment-screenshots`
   - **Public bucket**: ✅ MARQUE esta opção
4. Clique em **"Create bucket"**
5. Pronto! O bucket foi criado ✅

### 4️⃣ Copiar Credenciais

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Você verá duas informações importantes:

   **Project URL**
   ```
   https://xxxxxxxxx.supabase.co
   ```

   **anon public** (em Project API keys)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Copie esses valores (vamos usar no próximo passo)

### 5️⃣ Configurar o Projeto Local

1. Abra o projeto no seu editor de código
2. Crie um arquivo chamado `.env.local` na pasta raiz
3. Cole o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Substitua os valores pelos que você copiou no passo anterior
5. Salve o arquivo

### 6️⃣ Instalar e Rodar

Abra o terminal na pasta do projeto e execute:

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o projeto
npm run dev
```

Aguarde alguns segundos e acesse: **http://localhost:3000**

## ✅ Pronto! O Sistema Está Funcionando!

Agora você pode:
- ➕ Registrar jogadores
- 💰 Adicionar pagamentos
- 📜 Ver histórico
- 📊 Acompanhar estatísticas

## 🆘 Problemas Comuns

### Erro: "Failed to fetch"
- ✅ Verifique se o `.env.local` está na pasta raiz
- ✅ Verifique se as credenciais estão corretas
- ✅ Reinicie o servidor (`npm run dev`)

### Erro: "relation does not exist"
- ✅ Execute novamente o SQL no Supabase (passo 2)

### Erro ao fazer upload de imagem
- ✅ Verifique se o bucket `payment-screenshots` foi criado
- ✅ Verifique se o bucket está marcado como **Public**

## 📞 Suporte

Se tiver problemas, verifique:
1. Console do navegador (F12 → Console)
2. Terminal onde o projeto está rodando
3. Logs do Supabase (Dashboard → Logs)

---

**Desenvolvido com** ⚔️ **para a comunidade Tibia**
