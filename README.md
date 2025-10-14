# ⚔️ Tibia - Sistema de Treinos ⚔️

Sistema de controle de pagamentos para Dummy Training no Tibia, com tema visual inspirado no jogo.

## 🎮 Funcionalidades

- **Dashboard Visual**: Interface temática do Tibia com cores douradas e estilo medieval
- **Cadastro de Jogadores**: Players se auto-cadastram com nome do personagem
- **Registro de Pagamentos**: Upload de comprovante (screenshot) de pagamento
- **Histórico Completo**: Visualização de todos os pagamentos de cada jogador
- **Status em Tempo Real**: Veja quem pagou hoje e quem está pendente
- **Estatísticas**: Total de pagamentos, último pagamento, status atual

## 🚀 Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma nova conta (se não tiver)
2. Crie um novo projeto
3. Aguarde a criação do banco de dados

### 2. Configurar Banco de Dados

1. No dashboard do Supabase, vá em **SQL Editor**
2. Cole e execute o conteúdo do arquivo `supabase-setup.sql`
3. Isso criará as tabelas `players` e `payments`, além das views necessárias

### 3. Configurar Storage

1. No dashboard do Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome do bucket: `payment-screenshots`
4. Marque como **Public bucket** (ou configure políticas de acesso conforme necessário)
5. Clique em **Create bucket**

### 4. Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 5. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione as credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
```

### 6. Instalar e Executar

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Executar em modo desenvolvimento
npm run dev
```

Acesse http://localhost:3000 no navegador

## 📖 Como Usar

### Registrar Novo Jogador

1. Clique em **"➕ Registrar Novo Player"**
2. Digite o nome do personagem (char)
3. Clique em **"Registrar"**

### Adicionar Pagamento

1. Clique em **"💰 Adicionar Pagamento"**
2. Selecione o jogador na lista
3. Faça upload do screenshot do pagamento
4. Clique em **"Confirmar Pagamento"**

### Ver Histórico

1. Nos cards dos jogadores, clique em **"📜 Ver Histórico"**
2. Visualize todos os pagamentos anteriores
3. Clique em **"🖼️ Ver Comprovante"** para ver o screenshot

## 🎨 Tema Visual

O sistema utiliza um tema inspirado no Tibia:
- **Cores douradas** (#C9B037) para destaque
- **Tons marrons** para fundos e painéis
- **Verde** para status pago
- **Vermelho** para status pendente
- **Fonte Medieval** (MedievalSharp)
- **Bordas ornamentadas** estilo jogo

## 💡 Dicas

- O sistema marca automaticamente a data do pagamento como hoje
- Cada jogador só pode ter um pagamento por dia
- Os comprovantes ficam armazenados no Supabase Storage
- As estatísticas são atualizadas automaticamente

## 🔧 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e Storage
- **PostgreSQL** - Banco de dados

## 📝 Estrutura do Banco

### Tabela: players
- `id` (UUID, PK)
- `character_name` (VARCHAR, UNIQUE)
- `created_at` (TIMESTAMP)

### Tabela: payments
- `id` (UUID, PK)
- `player_id` (UUID, FK → players)
- `payment_date` (DATE)
- `screenshot_url` (TEXT)
- `created_at` (TIMESTAMP)

### Views
- `payment_stats` - Estatísticas de cada jogador
- `todays_payments` - Pagamentos do dia atual
- `payments_with_players` - Pagamentos com info do jogador

## 🛡️ Segurança

- Row Level Security (RLS) habilitado
- Políticas de acesso configuradas
- Upload apenas de imagens
- Validação de dados no frontend e backend

## 📄 Licença

Sistema criado para controle interno de guilda do Tibia.

---

**Valor do Treino**: 💰 10,000 GP por dia
