# Studio MiMimos — Site Oficial

Site institucional e catálogo de produtos da **Studio MiMimos**, loja de lembrancinhas personalizadas, mimos, presentes e impressão 3D em Fortaleza, CE.

## Estrutura de Pastas

```
/
├── index.html              # Página principal do site
├── admin.html              # Painel administrativo (protegido por Supabase Auth)
├── assets/
│   ├── css/
│   │   ├── style.css       # Estilos do site principal
│   │   └── admin.css       # Estilos do painel admin
│   ├── js/
│   │   ├── main.js         # JavaScript do site (carousel, FAQ, catálogo)
│   │   └── admin.js        # JavaScript do admin (CRUD de produtos)
│   └── img/
│       ├── logo-*.png      # Logos
│       ├── hero-*.jpg      # Imagens do carousel hero
│       ├── instagram-*.jpg # Imagens da seção Instagram
│       └── img-*.jpg       # Outras imagens
├── README.md               # Este arquivo
└── SUPABASE_SETUP.md       # Guia de configuração do Supabase
```

## Como rodar localmente

1. Clone ou baixe o projeto
2. Abra com qualquer servidor local:
   - VS Code: extensão **Live Server**
   - Terminal: `npx serve .` ou `python3 -m http.server 8000`
3. Acesse `http://localhost:8000`

> O site é 100% estático (HTML/CSS/JS puro). Não precisa de Node.js ou back-end.

## Como publicar no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Arraste a pasta do projeto para o painel do Netlify
3. O site será publicado automaticamente
4. Configure o domínio personalizado se desejar

## Configuração do Supabase

O catálogo de produtos é carregado dinamicamente do Supabase. Veja o arquivo `SUPABASE_SETUP.md` para instruções detalhadas de:

- Criação da tabela `produtos`
- Ativação de RLS (Row Level Security)
- Políticas de leitura/escrita
- Configuração de autenticação
- Cuidados com chaves

## Como editar produtos

1. Acesse `seusite.com/admin.html`
2. Faça login com e-mail e senha cadastrados no Supabase Auth
3. Use o painel para adicionar, editar, ocultar ou excluir produtos
4. As alterações aparecem automaticamente no site público

## Tecnologias

- HTML5, CSS3, JavaScript puro (sem frameworks)
- Supabase (banco de dados + autenticação + storage)
- Netlify (hospedagem)
- Fontes: Plus Jakarta Sans + Playfair Display (Google Fonts)

## Segurança

- ✅ Autenticação via Supabase Auth (e-mail + senha)
- ✅ RLS ativado na tabela de produtos
- ✅ Proteção contra XSS no catálogo dinâmico (DOM API, sem innerHTML)
- ✅ Apenas `anon key` no front-end (segura com RLS)
- ✅ Painel admin protegido por login real
- ⚠️ Nunca exponha a `service_role` key no front-end

## Alterações realizadas (v2.0)

### Problemas encontrados e resolvidos:

1. **Senha hardcoded no admin** → Removida. Substituída por Supabase Auth (e-mail + senha)
2. **XSS no catálogo** → innerHTML substituído por criação segura de elementos DOM (createElement/textContent)
3. **HTML monolítico (1.4MB)** → Separado em HTML (60KB) + CSS + JS + imagens
4. **19 imagens base64 inline** → Extraídas para `/assets/img/` (redução de ~95% no HTML)
5. **CSS e JS misturados no HTML** → Separados em arquivos próprios
6. **Senha visível na tela de config** → Removida, mostra apenas tipo de auth
7. **Mensagens WhatsApp** → Melhoradas com contexto do produto

### O que ainda precisa de configuração manual:

1. **Supabase Auth**: Cadastrar usuário admin (ver `SUPABASE_SETUP.md`)
2. **RLS**: Executar as queries SQL no Supabase (ver `SUPABASE_SETUP.md`)
3. **Storage**: Criar bucket para fotos de produtos (ver `SUPABASE_SETUP.md`)
4. **Deploy**: Subir os arquivos no Netlify

### Alertas de segurança:

- A `anon key` do Supabase está no front-end — isso é aceitável **apenas** com RLS ativado
- Sem RLS, qualquer pessoa pode ler/modificar dados usando essa chave
- **Ative o RLS imediatamente** seguindo o guia `SUPABASE_SETUP.md`
