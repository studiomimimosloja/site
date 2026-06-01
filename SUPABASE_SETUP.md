# Configuração do Supabase — Studio MiMimos

## 1. Criar a tabela `produtos`

No painel do Supabase, vá em **SQL Editor** e execute:

```sql
CREATE TABLE IF NOT EXISTS produtos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco TEXT,
  preco_tipo TEXT DEFAULT 'fixo' CHECK (preco_tipo IN ('fixo', 'partir', 'consulta')),
  badge TEXT DEFAULT 'Nenhum',
  foto_url TEXT,
  whatsapp_msg TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Oculto', 'Esgotado')),
  ordem INTEGER DEFAULT 0,
  promo BOOLEAN DEFAULT FALSE,
  promo_preco TEXT,
  promo_texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Ativar RLS (Row Level Security)

```sql
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
```

## 3. Criar políticas RLS

### Leitura pública (visitantes veem apenas produtos ativos)

```sql
CREATE POLICY "Visitantes podem ver produtos ativos"
  ON produtos
  FOR SELECT
  TO anon, authenticated
  USING (status = 'Ativo');
```

### Admin vê todos os produtos

```sql
CREATE POLICY "Admin ve todos os produtos"
  ON produtos
  FOR SELECT
  TO authenticated
  USING (true);
```

### Apenas admin autenticado pode criar

```sql
CREATE POLICY "Admin pode criar produtos"
  ON produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Apenas admin autenticado pode editar

```sql
CREATE POLICY "Admin pode editar produtos"
  ON produtos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Apenas admin autenticado pode excluir

```sql
CREATE POLICY "Admin pode excluir produtos"
  ON produtos
  FOR DELETE
  TO authenticated
  USING (true);
```

## 4. Configurar Supabase Auth

1. No painel Supabase, vá em **Authentication > Settings**
2. Em **Email Auth**, habilite "Enable Email Signup"
3. Vá em **Authentication > Users**
4. Clique em **Add User** (ou **Invite User**)
5. Cadastre seu e-mail admin (ex: `admin@studiomimimos.com`) com uma senha forte
6. Confirme o e-mail se necessário

## 5. Criar bucket de Storage para fotos (opcional)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true);
```

Política para upload autenticado:

```sql
CREATE POLICY "Admin pode fazer upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produtos');

CREATE POLICY "Fotos publicas"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'produtos');
```

## 6. Chaves

- **Anon Key (pública):** pode ficar no front-end. É usada pelo site público para ler produtos ativos. Com RLS ativado, ela só permite leitura de produtos com `status = 'Ativo'`.
- **Service Role Key (secreta):** **NUNCA** coloque no front-end. Use apenas em back-end ou funções serverless.

## 7. Cuidados de segurança

- A `anon key` no front-end é segura **apenas** com RLS ativado corretamente
- O admin usa `authenticated` role via Supabase Auth (e-mail + senha)
- Após login, o token JWT do usuário é usado nas requisições (substitui a anon key)
- Nunca exponha a `service_role` key no código front-end
- Altere a senha admin periodicamente
