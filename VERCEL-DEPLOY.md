# 🚀 Deploy na Vercel - Guia Completo

## ✅ Pré-requisitos
- [x] Conta no GitHub (crie em github.com se não tiver)
- [x] Conta na Vercel (crie em vercel.com - pode logar com GitHub)
- [x] Projeto já commitado no Git (✅ FEITO!)

---

## 📋 Método 1: Deploy via GitHub (Recomendado)

### **Passo 1: Criar Repositório no GitHub**

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `tibia-training-manager`
   - **Description:** "Sistema de gerenciamento de pagamentos de treino - Tibia"
   - **Public** ou **Private** (sua escolha)
3. ❌ **NÃO** marque "Add README" (já temos)
4. Clique em **"Create repository"**

### **Passo 2: Conectar seu projeto ao GitHub**

No terminal, rode esses comandos:

```bash
cd /Users/mr.igor/IA/Treinos/tibia-treinos

# Adicionar o remote (SUBSTITUA 'SEU-USUARIO' pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU-USUARIO/tibia-training-manager.git

# Enviar o código
git branch -M main
git push -u origin main
```

> 💡 **Dica:** Se pedir usuário/senha, use seu username do GitHub e um **Personal Access Token** como senha (não use sua senha normal!)
> Crie um token em: https://github.com/settings/tokens

### **Passo 3: Deploy na Vercel**

1. Acesse: https://vercel.com
2. Clique em **"Login"** → Login com GitHub
3. Autorize a Vercel a acessar seus repositórios
4. Clique em **"Add New..."** → **"Project"**
5. Encontre `tibia-training-manager` e clique em **"Import"**
6. **Configure as variáveis de ambiente:**

   Clique em **"Environment Variables"** e adicione:

   ```
   NEXT_PUBLIC_SUPABASE_URL = sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sua-chave-anonima-do-supabase
   ```

   > 🔑 **Onde encontrar essas chaves?**
   > 1. Acesse: https://supabase.com/dashboard
   > 2. Abra seu projeto
   > 3. Vá em **Settings** → **API**
   > 4. Copie:
   >    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   >    - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

7. Clique em **"Deploy"**
8. Aguarde 1-2 minutos ⏳
9. 🎉 **PRONTO!** Seu site está no ar!

### **Passo 4: Acessar seu site**

Após o deploy, você receberá uma URL tipo:
```
https://tibia-training-manager.vercel.app
```

---

## 📋 Método 2: Deploy via Vercel CLI (Alternativo)

Se preferir fazer tudo pelo terminal:

### **1. Instalar Vercel CLI**
```bash
npm i -g vercel
```

### **2. Login**
```bash
vercel login
```

### **3. Deploy**
```bash
cd /Users/mr.igor/IA/Treinos/tibia-treinos
vercel
```

Responda as perguntas:
- Set up and deploy? **Y**
- Which scope? Selecione sua conta
- Link to existing project? **N**
- Project name? `tibia-training-manager`
- Directory? **./** (apenas Enter)
- Override settings? **N**

### **4. Adicionar variáveis de ambiente**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Cole sua URL e pressione Enter

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Cole sua chave e pressione Enter
```

### **5. Deploy para produção**
```bash
vercel --prod
```

---

## 🔄 Atualizações Futuras

Depois que configurar, atualizar é SUPER fácil:

```bash
cd /Users/mr.igor/IA/Treinos/tibia-treinos
git add .
git commit -m "Descrição da mudança"
git push
```

A Vercel vai **automaticamente**:
1. Detectar o push
2. Fazer build
3. Deployar
4. Atualizar o site

**Zero configuração adicional! 🎉**

---

## 🌐 Domínio Customizado (Opcional)

Quer usar seu próprio domínio tipo `training.seusite.com`?

1. No painel da Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure o DNS conforme instruções
4. Pronto!

---

## 📊 Monitoramento

A Vercel mostra automaticamente:
- ✅ Quantas pessoas acessaram
- 📈 Performance do site
- 🐛 Erros que ocorreram
- 🌍 De onde vêm os acessos

Acesse em: https://vercel.com/dashboard

---

## ❓ Problemas Comuns

### **Erro: "Build failed"**
- Verifique se as variáveis de ambiente estão corretas
- Rode `npm run build` localmente para testar

### **Erro: "Module not found"**
- Rode `npm install` e faça commit do package-lock.json

### **Site não atualiza**
- Faça hard refresh: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- Aguarde 1-2 minutos (cache)

---

## 🎯 Checklist Final

- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] Projeto importado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy bem-sucedido
- [ ] Site acessível via URL .vercel.app
- [ ] Testado login/cadastro
- [ ] Testado pagamentos

---

## 💡 Dicas Pro

1. **Preview Deploys**: Cada branch/PR gera uma URL de preview automática
2. **Rollback**: Pode voltar para versões anteriores com 1 clique
3. **Analytics**: Ative analytics grátis nas configurações
4. **Edge Functions**: Já estão habilitadas automaticamente
5. **Custom Headers**: Configure em `next.config.js` se precisar

---

## 📞 Suporte

- Documentação Vercel: https://vercel.com/docs
- Comunidade Discord: https://vercel.com/discord
- Status da Vercel: https://vercel-status.com

---

**Feito com ❤️ para o servidor Exordion Tibia**
