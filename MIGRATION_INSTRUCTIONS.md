# 📋 Instruções de Migração - Skill History

## Problema Resolvido
O sistema estava tentando usar a tabela `skill_history` que não existia no banco de dados, causando o erro:
```
Could not find the 'melee_level' column of 'skill_history' in the schema cache
```

## Solução

### 1. Executar a Migração no Supabase

Acesse o **SQL Editor** do seu projeto Supabase correto (Tibia Treinos) e execute o conteúdo do arquivo:

📄 **`migrations/11-create-skill-history.sql`**

### 2. O que a migração faz:

✅ Cria a tabela `skill_history` com as seguintes colunas:
- `sword_level`, `sword_percent` - Para Elite Knights
- `club_level`, `club_percent` - Para Elite Knights
- `axe_level`, `axe_percent` - Para Elite Knights
- `distance_level`, `distance_percent` - Para Royal Paladins
- `shielding_level`, `shielding_percent` - Opcional para todos
- `magic_level`, `magic_percent` - Para todas as vocações

✅ Cria índices para melhor performance

✅ Configura Row Level Security (RLS) para que cada usuário só veja seus próprios skills

### 3. Mudanças no Código

✅ **LoginModal** agora mostra 3 campos de arma separados para EK:
- 🗡️ Sword Fighting
- 🔨 Club Fighting
- 🪓 Axe Fighting

✅ **Interface SkillHistory** atualizada em `lib/supabase.ts`

✅ O fluxo de registro já está integrado - após criar a conta, o usuário insere skills iniciais na mesma sessão

## Como Testar

1. Execute a migração no Supabase
2. Tente fazer um novo registro no sistema
3. Escolha vocação EK
4. Preencha pelo menos uma das armas (Sword, Club ou Axe)
5. Preencha Magic Level
6. Clique em "Salvar e Continuar"

## Observação Importante

⚠️ O MCP do Supabase está conectado ao banco de dados errado (mostrando tabelas de outros projetos como gestão, receitas, vault). Você precisa executar a migração manualmente no SQL Editor do projeto correto.
