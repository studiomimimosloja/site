-- ════════════════════════════════════════════════════
-- TABELAS ADICIONAIS PARA O ADMIN COMPLETO
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════

-- 1. CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  imagem_url TEXT DEFAULT '',
  ordem INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Oculta')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publico ve categorias ativas" ON categorias FOR SELECT TO anon, authenticated USING (status = 'Ativa');
CREATE POLICY "Admin ve todas categorias" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria categorias" ON categorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin edita categorias" ON categorias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin exclui categorias" ON categorias FOR DELETE TO authenticated USING (true);

-- 2. DEPOIMENTOS
CREATE TABLE IF NOT EXISTS depoimentos (
  id BIGSERIAL PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota INTEGER DEFAULT 5 CHECK (nota >= 1 AND nota <= 5),
  categoria TEXT DEFAULT '',
  tipo_pedido TEXT DEFAULT '',
  imagem_produto TEXT DEFAULT '',
  imagem_print TEXT DEFAULT '',
  ocultar_nome BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Oculto')),
  destaque BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publico ve depoimentos ativos" ON depoimentos FOR SELECT TO anon, authenticated USING (status = 'Ativo');
CREATE POLICY "Admin ve todos depoimentos" ON depoimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria depoimentos" ON depoimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin edita depoimentos" ON depoimentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin exclui depoimentos" ON depoimentos FOR DELETE TO authenticated USING (true);

-- 3. GALERIA / PORTFÓLIO
CREATE TABLE IF NOT EXISTS galeria (
  id BIGSERIAL PRIMARY KEY,
  foto_url TEXT NOT NULL,
  tema TEXT DEFAULT '',
  tipo_produto TEXT DEFAULT '',
  categoria TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Oculto')),
  destaque BOOLEAN DEFAULT FALSE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE galeria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publico ve galeria ativa" ON galeria FOR SELECT TO anon, authenticated USING (status = 'Ativo');
CREATE POLICY "Admin ve toda galeria" ON galeria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria galeria" ON galeria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin edita galeria" ON galeria FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin exclui galeria" ON galeria FOR DELETE TO authenticated USING (true);

-- 4. FAQ
CREATE TABLE IF NOT EXISTS faq (
  id BIGSERIAL PRIMARY KEY,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria TEXT DEFAULT '',
  ordem INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Oculto')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publico ve faq ativo" ON faq FOR SELECT TO anon, authenticated USING (status = 'Ativo');
CREATE POLICY "Admin ve todo faq" ON faq FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria faq" ON faq FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin edita faq" ON faq FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin exclui faq" ON faq FOR DELETE TO authenticated USING (true);

-- 5. BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT DEFAULT '',
  subtitulo TEXT DEFAULT '',
  imagem_url TEXT DEFAULT '',
  texto_botao TEXT DEFAULT 'Fazer orçamento',
  link_botao TEXT DEFAULT '',
  ordem INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Oculto')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publico ve banners ativos" ON banners FOR SELECT TO anon, authenticated USING (status = 'Ativo');
CREATE POLICY "Admin ve todos banners" ON banners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria banners" ON banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin edita banners" ON banners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin exclui banners" ON banners FOR DELETE TO authenticated USING (true);


-- ════════════════════════════════════════════════════
-- 6. CALENDÁRIO COMERCIAL
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS calendario (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  data_evento TEXT NOT NULL,
  mes TEXT DEFAULT '',
  categoria TEXT DEFAULT '',
  potencial TEXT DEFAULT 'Médio' CHECK (potencial IN ('Baixo', 'Médio', 'Alto', 'Muito alto')),
  publico_alvo TEXT DEFAULT '',
  produtos_sugeridos TEXT DEFAULT '',
  materiais_necessarios TEXT DEFAULT '',
  dias_planejamento INTEGER DEFAULT 90,
  dias_compra_materiais INTEGER DEFAULT 60,
  dias_criar_amostras INTEGER DEFAULT 45,
  dias_divulgacao INTEGER DEFAULT 30,
  dias_abrir_encomendas INTEGER DEFAULT 30,
  dias_encerrar_pedidos INTEGER DEFAULT 7,
  ideias_campanha TEXT DEFAULT '',
  ideias_posts TEXT DEFAULT '',
  ideias_reels TEXT DEFAULT '',
  ideias_stories TEXT DEFAULT '',
  msg_whatsapp TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  custo_estimado TEXT DEFAULT '',
  status TEXT DEFAULT 'Planejada' CHECK (status IN ('Planejada', 'Em andamento', 'Concluída', 'Atrasada', 'Cancelada')),
  prioridade TEXT DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')),
  resultado_vendas TEXT DEFAULT '',
  resultado_pedidos TEXT DEFAULT '',
  resultado_produtos_top TEXT DEFAULT '',
  resultado_melhorias TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin ve calendario" ON calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria calendario" ON calendario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin edita calendario" ON calendario FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin exclui calendario" ON calendario FOR DELETE TO authenticated USING (true);

