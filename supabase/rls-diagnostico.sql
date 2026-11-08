-- ══ DIAGNÓSTICO DE SEGURANÇA (RLS) — SÓ LEITURA ═══════════════════
-- Não altera nada no banco. Mostra numa tabela só:
--   >>> ATENÇÃO  regras que deixam quem NÃO está logado gravar/apagar dados
--   RLS          se a proteção por linha está ligada em cada tabela
--   POLÍTICA     cada regra das tabelas (quem pode, fazer o quê)
--   STORAGE      regras das fotos (bucket "produtos")
--   BUCKET       se cada pasta de fotos é pública ou privada
--   USUÁRIOS     quantas contas existem (deve ser só a do admin)
--
-- Como rodar: Supabase › SQL Editor › New query › cole tudo › Run.
-- Depois exporte o resultado (botão "Export" › CSV) ou copie a tabela
-- e mande para o Claude.

with risco as (
  select '>>> ATENÇÃO'::text as secao, tablename::text as tabela,
         (policyname || ' (' || cmd || ')')::text as detalhe,
         array_to_string(roles, ', ')::text as quem,
         ('quem não está logado pode fazer ' || cmd)::text as regra
  from pg_policies
  where schemaname in ('public', 'storage')
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    and roles && array['public', 'anon']::name[]
),
rls as (
  select 'RLS', c.relname::text,
         case when c.relrowsecurity then 'ligado' else '>>> DESLIGADO <<<' end,
         null::text, null::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
politicas as (
  select case when schemaname = 'storage' then 'STORAGE' else 'POLÍTICA' end,
         tablename::text,
         policyname || ' (' || cmd || ')',
         array_to_string(roles, ', '),
         'USING: ' || coalesce(qual, '-') || '  |  CHECK: ' || coalesce(with_check, '-')
  from pg_policies
  where schemaname in ('public', 'storage')
),
buckets as (
  select 'BUCKET', id::text,
         case when public then 'público (qualquer um vê as fotos)' else 'privado' end,
         null::text, null::text
  from storage.buckets
),
usuarios as (
  select 'USUÁRIOS', 'auth.users', count(*)::text || ' conta(s)', null::text, null::text
  from auth.users
)
select * from risco
union all select * from rls
union all select * from politicas
union all select * from buckets
union all select * from usuarios
order by 1, 2, 3;
