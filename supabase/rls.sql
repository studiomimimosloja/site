-- ══ CORREÇÃO DE SEGURANÇA DAS FOTOS (bucket "produtos") ═══════════
-- Problema (diagnóstico de 08/11/2026): três regras do Storage deixavam
-- QUEM NÃO ESTÁ LOGADO enviar, trocar e apagar fotos (INSERT, UPDATE e
-- DELETE para "anon"). Como a chave anon é pública (está no site), qualquer
-- pessoa poderia apagar ou trocar as fotos dos produtos.
--
-- O que este arquivo faz: passa essas três regras de "anon" para
-- "authenticated" (só quem fez login no painel). As condições das regras
-- continuam iguais. Ver as fotos no site continua livre (o bucket é público).
-- O painel já envia as fotos com o login do admin, então nada muda para você.
--
-- Como desfazer: rodar rls-rollback.sql.
-- Como rodar: Supabase › SQL Editor › New query › cole tudo › Run.
-- No fim aparece uma conferência: se vier "nenhum risco encontrado", deu certo.

begin;

alter policy "allow_all 1ifiba2_1" on storage.objects to authenticated;  -- UPDATE
alter policy "allow_all 1ifiba2_2" on storage.objects to authenticated;  -- DELETE
alter policy "allow_all 1ifiba2_3" on storage.objects to authenticated;  -- INSERT

commit;

-- Conferência: regras de gravação abertas para quem não está logado,
-- e tabelas com a proteção por linha desligada.
with problemas as (
  select 'RISCO: ' || schemaname || '.' || tablename || ' › ' || policyname || ' (' || cmd || ')' as item
  from pg_policies
  where schemaname in ('public', 'storage')
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    and roles && array['public', 'anon']::name[]
  union all
  select 'RLS DESLIGADO: public.' || c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
)
select item from problemas
union all
select 'nenhum risco encontrado' where not exists (select 1 from problemas);
