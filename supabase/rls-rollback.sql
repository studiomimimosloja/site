-- ══ DESFAZ rls.sql ════════════════════════════════════════════════
-- Volta as três regras do Storage (bucket "produtos") para "anon", como
-- estavam antes de 08/11/2026. Só use se o envio de fotos pelo painel
-- parar de funcionar depois da correção.
-- Atenção: isso reabre a brecha (qualquer pessoa pode trocar/apagar fotos).

begin;

alter policy "allow_all 1ifiba2_1" on storage.objects to anon;  -- UPDATE
alter policy "allow_all 1ifiba2_2" on storage.objects to anon;  -- DELETE
alter policy "allow_all 1ifiba2_3" on storage.objects to anon;  -- INSERT

commit;
