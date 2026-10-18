-- ════════════════════════════════════════════════════
-- CALENDÁRIO — reforma de 18/10/2026
-- Rodar no Supabase: SQL Editor > New query > colar tudo > Run
-- Rodar ANTES de publicar o painel novo.
-- ════════════════════════════════════════════════════

-- 1) Backup das datas antigas (fica guardado, sem acesso pela API)
CREATE TABLE IF NOT EXISTS calendario_backup_20261018 AS SELECT * FROM calendario;
ALTER TABLE calendario_backup_20261018 ENABLE ROW LEVEL SECURITY;

-- 2) Colunas novas
ALTER TABLE calendario ADD COLUMN IF NOT EXISTS regra_data TEXT DEFAULT '';
ALTER TABLE calendario ADD COLUMN IF NOT EXISTS linha_produto TEXT DEFAULT '';

-- 3) Troca as datas antigas pela lista enxuta
DELETE FROM calendario;

INSERT INTO calendario
  (nome, data_evento, mes, categoria, potencial, linha_produto, regra_data,
   produtos_sugeridos, dias_planejamento, dias_divulgacao, dias_encerrar_pedidos, status, prioridade)
VALUES
  ('Dia da Mulher', '08/03', 'MAR', 'Empresas', 'Médio', 'Corporativo', '',
   'Brinde corporativo (caneca ou peça 3D personalizada) para equipes e clientes.', 45, 21, 5, 'Planejada', 'Média'),

  ('Páscoa', 'Domingo de Páscoa', 'ABR', 'Família', 'Alto', 'Papelaria', 'pascoa:0',
   'Lembrancinhas de papelaria e peças 3D temáticas; kit Páscoa.', 45, 30, 7, 'Planejada', 'Média'),

  ('Dia das Mães', '2º domingo de maio', 'MAI', 'Família', 'Muito alto', 'Kit', 'dom:05:2',
   'Kit mãe e maternidade (caneca + peça 3D de memória + papelaria); presentes para recém-nascidos e maternidade.', 60, 35, 10, 'Planejada', 'Alta'),

  ('Dia dos Namorados', '12/06', 'JUN', 'Família', 'Alto', 'Caneca', '',
   'Caneca para casal, peça 3D de memória, kit presente.', 45, 25, 7, 'Planejada', 'Média'),

  ('Dia dos Pais', '2º domingo de agosto', 'AGO', 'Família', 'Alto', 'Caneca', 'dom:08:2',
   'Caneca personalizada, peça 3D, kit presente.', 45, 25, 7, 'Planejada', 'Média'),

  ('Dia das Crianças', '12/10', 'OUT', 'Festas', 'Alto', 'Papelaria', '',
   'Lembrancinhas de papelaria e kits de festa.', 45, 25, 7, 'Planejada', 'Média'),

  ('Black Friday', '4ª quinta de novembro + 1', 'NOV', 'Comercial', 'Alto', 'Kit', 'bf',
   'Kits com preço especial; foco em estoque de peças que já têm molde pronto.', 30, 14, 2, 'Planejada', 'Média'),

  ('Confraternizações de empresas', '12/12', 'DEZ', 'Empresas', 'Muito alto', 'Corporativo', '',
   'Brindes corporativos: caneca, peça 3D, kit. Precisa do catálogo corporativo pronto.', 60, 35, 15, 'Planejada', 'Alta'),

  ('Natal', '25/12', 'DEZ', 'Família', 'Muito alto', 'Kit', '',
   'Kits de Natal (caneca + peça 3D + papelaria), presépio e Sagrada Família em 3D, lembrancinhas.', 60, 40, 12, 'Planejada', 'Alta'),

  ('Volta às aulas', '01/02', 'FEV', 'Escolas', 'Médio', 'Papelaria', '',
   'Papelaria personalizada e caneca para o retorno escolar.', 45, 21, 5, 'Planejada', 'Baixa');

-- As datas antigas continuam guardadas em calendario_backup_20261018 (para consulta ou para restaurar com ajuda).
