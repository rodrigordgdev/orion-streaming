# 🎬 Orion

App de streaming full-stack construído do zero — do HTML ao banco de dados.
Catálogo real de filmes e séries via API do TMDB, player HLS, autenticação
segura e área de configurações completa.

## ✨ Funcionalidades

- **Autenticação segura** — cadastro e login com senhas protegidas por hash (bcrypt) e sessão via JWT
- **Catálogo real** — filmes e séries do TMDB, organizados por categorias
- **Player HLS** — reprodução de vídeo adaptativa com hls.js
- **Favoritos por usuário** — cada conta com sua própria lista
- **Continuar assistindo** — salva onde você parou, com barra de progresso nos cards, e remove automaticamente ao terminar
- **Busca com debounce** — em filmes, séries e canais
- **Ajustes** — formato de hora (12h/24h), idioma (PT/EN), avaliação e controle dos pais com PIN
- **Controle dos pais** — PIN com hash, modo protegido e bloqueio de conteúdo adulto
- **Design responsivo** — tema escuro, funciona em desktop e mobile

## 🛠️ Tecnologias

**Front-end:** HTML, CSS (Flexbox/Grid, variáveis CSS), JavaScript (ES6+), hls.js
**Back-end:** Node.js (módulo http nativo), SQLite (better-sqlite3)
**Segurança:** JWT, bcryptjs, dotenv, prepared statements
**API externa:** TMDB (via proxy no back-end)

## 🔒 Segurança

- Senhas e PINs nunca armazenados em texto puro (hash com bcrypt)
- Todas as rotas privadas protegidas por JWT — a identidade vem do token assinado, não do que o cliente afirma
- Prepared statements em todas as queries (proteção contra SQL injection)
- Segredos em variáveis de ambiente (`.env`, fora do versionamento)
- Chave da API do TMDB nunca exposta no front-end — as requisições passam por um proxy no servidor

## 🚀 Como rodar

```bash
# clone o repositório
git clone https://github.com/rodrigordgdev/orion-streaming.git
cd orion-streaming/orion-servidor

# instale as dependências
npm install

# crie um arquivo .env com:
# SEGREDO=sua_chave_secreta_aqui
# TMDB_KEY=sua_chave_do_tmdb

# inicie o servidor
npm run dev
```

Depois, abra `essets/index.html` no navegador (recomendado via Live Server).

## 📄 Sobre o conteúdo

O Orion usa o TMDB apenas para **metadados** (capas, títulos, sinopses) e
reproduz **streams de demonstração públicos** (Big Buck Bunny, Sintel e outros
vídeos de teste livres). Nenhum conteúdo protegido por direitos autorais é
distribuído.

## 📌 Status

Projeto em desenvolvimento ativo. Próximos passos: deploy em VPS com HTTPS.

---

Feito por [rodrigordgdev](https://github.com/rodrigordgdev)
