require("dotenv").config();
const http = require("http");
const db = require("./banco");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SEGREDO = process.env.SEGREDO;

// --- AJUDANTE 1: lê o corpo de um pedido POST e devolve os dados ---
function lerCorpo(pedido, aoTerminar) {
  let corpo = "";
  pedido.on("data", function (pedaco) {
    corpo += pedaco;
  });
  pedido.on("end", function () {
    const dados = JSON.parse(corpo);
    aoTerminar(dados);
  });
}

// --- AJUDANTE 2: envia uma resposta JSON ---
function responderJSON(resposta, status, objeto) {
  resposta.writeHead(status, { "Content-Type": "application/json" });
  resposta.end(JSON.stringify(objeto));
}

// --- VERIFICA O TOKEN E DEVOLVE O USUÁRIO (ou null se inválido) ---
function verificarToken(pedido) {
  let auth = pedido.headers["authorization"];
  if (!auth) return null;

  let token = auth.replace("Bearer ", "");
  try {
    let dados = jwt.verify(token, SEGREDO);
    return dados.email;   // o e-mail que estava dentro do token
  } catch (erro) {
    return null;   // token inválido ou expirado
  }
}

const servidor = http.createServer(function (pedido, resposta) {
  // --- CORS: autoriza o Orion a falar com este servidor ---
  resposta.setHeader("Access-Control-Allow-Origin", "*");
  resposta.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  resposta.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (pedido.method === "OPTIONS") {
    resposta.writeHead(200);
    resposta.end();
    return;
  }

  // ===== ROTA: LER OS FAVORITOS (GET /favoritos?email=...) =====
  if (pedido.url.startsWith("/favoritos") && pedido.method === "GET") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }

    const buscar = db.prepare("SELECT * FROM favoritos WHERE usuario = ?");
    const favoritos = buscar.all(email);
    responderJSON(resposta, 200, favoritos);
    return;
  }

  // ===== ROTA: GUARDAR UM FAVORITO (POST /favoritar) =====
  if (pedido.url === "/favoritar" && pedido.method === "POST") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    lerCorpo(pedido, function (dados) {
      const inserir = db.prepare(`
        INSERT INTO favoritos (usuario, filme_id, titulo, capa)
        VALUES (?, ?, ?, ?)
      `);
      inserir.run(email, dados.filme_id, dados.titulo, dados.capa);
      responderJSON(resposta, 200, { sucesso: true });
    });
    return;
  }

  // ===== ROTA: REMOVER UM FAVORITO (POST /desfavoritar) =====
  if (pedido.url === "/desfavoritar" && pedido.method === "POST") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    lerCorpo(pedido, function (dados) {
      const deletar = db.prepare("DELETE FROM favoritos WHERE id = ?");
      deletar.run(dados.id);
      responderJSON(resposta, 200, { sucesso: true });
    });
    return;
  }

  // ===== ROTA: CADASTRAR USUÁRIO (POST /cadastrar) =====
  if (pedido.url === "/cadastrar" && pedido.method === "POST") {
    lerCorpo(pedido, function (dados) {
      const senhaHash = bcrypt.hashSync(dados.senha, 10);
      try {
        const inserir = db.prepare("INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)");
        inserir.run(dados.email, senhaHash);
        responderJSON(resposta, 200, { sucesso: true });
      } catch (erro) {
        responderJSON(resposta, 400, { sucesso: false, mensagem: "E-mail já cadastrado." });
      }
    });
    return;
  }

  // ===== ROTA: LOGIN (POST /login) =====
  if (pedido.url === "/login" && pedido.method === "POST") {
    lerCorpo(pedido, function (dados) {
      const buscar = db.prepare("SELECT * FROM usuarios WHERE email = ?");
      const usuario = buscar.get(dados.email);

      if (!usuario) {
        responderJSON(resposta, 401, { sucesso: false, mensagem: "E-mail ou senha incorretos." });
        return;
      }

      const senhaCorreta = bcrypt.compareSync(dados.senha, usuario.senha_hash);
      if (senhaCorreta) {
        // gera um token assinado, válido por 7 dias
        const token = jwt.sign(
          { email: usuario.email },
          SEGREDO,
          { expiresIn: "7d" }
        );
        responderJSON(resposta, 200, { sucesso: true, email: usuario.email, token: token });
      } else {
        responderJSON(resposta, 401, { sucesso: false, mensagem: "E-mail ou senha incorretos." });
      }
    });
    return;
  }

  // ===== ROTA: SALVAR PROGRESSO (POST /progresso) =====
  if (pedido.url === "/progresso" && pedido.method === "POST") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    lerCorpo(pedido, function (dados) {
      const salvar = db.prepare(`
        INSERT INTO progresso (usuario, filme_id, titulo, segundo, duracao, capa)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(usuario, filme_id)
        DO UPDATE SET segundo = ?, duracao = ?, capa = ?
      `);
      salvar.run(
        email, dados.filme_id, dados.titulo, dados.segundo, dados.duracao, dados.capa,
        dados.segundo, dados.duracao, dados.capa
      );
      responderJSON(resposta, 200, { sucesso: true });
    });
    return;
  }
  // ===== ROTA: BUSCAR PROGRESSO (GET /progresso?filme_id=...) =====
  if (pedido.url.startsWith("/progresso") && pedido.method === "GET") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    const url = new URL(pedido.url, "http://localhost:3000");
    const filmeId = url.searchParams.get("filme_id");

    const buscar = db.prepare("SELECT * FROM progresso WHERE usuario = ? AND filme_id = ?");
    const p = buscar.get(email, filmeId);

    responderJSON(resposta, 200, p ? p : { segundo: 0 });
    return;
  }

  // ===== ROTA: TODOS OS PROGRESSOS DO USUÁRIO (GET /meus-progressos) =====
  if (pedido.url.startsWith("/meus-progressos") && pedido.method === "GET") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    const buscar = db.prepare("SELECT * FROM progresso WHERE usuario = ?");
    const progressos = buscar.all(email);

    responderJSON(resposta, 200, progressos);
    return;
  }
  // ===== ROTA: REMOVER PROGRESSO (POST /remover-progresso) =====
  if (pedido.url === "/remover-progresso" && pedido.method === "POST") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    lerCorpo(pedido, function (dados) {
      const deletar = db.prepare("DELETE FROM progresso WHERE usuario = ? AND filme_id = ?");
      deletar.run(email, dados.filme_id);
      responderJSON(resposta, 200, { sucesso: true });
    });
    return;
  }

  // ===== ROTA: DEFINIR/ATUALIZAR PIN (POST /definir-pin) =====
  if (pedido.url === "/definir-pin" && pedido.method === "POST") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    lerCorpo(pedido, function (dados) {
      const pinHash = bcrypt.hashSync(dados.pin, 10);
      const atualizar = db.prepare("UPDATE usuarios SET pin_hash = ? WHERE email = ?");
      atualizar.run(pinHash, email);
      responderJSON(resposta, 200, { sucesso: true });
    });
    return;
  }

  // ===== ROTA: VERIFICAR PIN (POST /verificar-pin) =====
  if (pedido.url === "/verificar-pin" && pedido.method === "POST") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    lerCorpo(pedido, function (dados) {
      const buscar = db.prepare("SELECT pin_hash FROM usuarios WHERE email = ?");
      const usuario = buscar.get(email);

      if (!usuario || !usuario.pin_hash) {
        responderJSON(resposta, 200, { correto: false, semPin: true });
        return;
      }

      const correto = bcrypt.compareSync(dados.pin, usuario.pin_hash);
      responderJSON(resposta, 200, { correto: correto, semPin: false });
    });
    return;
  }

  // ===== ROTA: TEM PIN DEFINIDO? (GET /tem-pin) =====
  if (pedido.url.startsWith("/tem-pin") && pedido.method === "GET") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }
    const usuario = db.prepare("SELECT pin_hash FROM usuarios WHERE email = ?").get(email);
    responderJSON(resposta, 200, { temPin: usuario && usuario.pin_hash ? true : false });
    return;
  }

  // ===== ROTA-PROXY DO TMDB (GET /tmdb?caminho=...) =====
  if (pedido.url.startsWith("/tmdb") && pedido.method === "GET") {
    const email = verificarToken(pedido);
    if (!email) {
      responderJSON(resposta, 401, { erro: "Não autorizado" });
      return;
    }

    const url = new URL(pedido.url, "http://localhost:3000");
    const caminho = url.searchParams.get("caminho");   // ex: "movie/popular"
    const extra = url.searchParams.get("extra") || ""; // ex: "&with_genres=28"
    const idioma = url.searchParams.get("idioma") || "pt-BR";

    // monta a URL do TMDB COM a chave (que fica escondida aqui no servidor)
    const urlTMDB = "https://api.themoviedb.org/3/" + caminho +
                    "?api_key=" + process.env.TMDB_KEY +
                    "&language=" + idioma + extra;

    // busca no TMDB e repassa a resposta
    fetch(urlTMDB)
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        responderJSON(resposta, 200, dados);
      })
      .catch(function (erro) {
        responderJSON(resposta, 500, { erro: "Erro ao buscar no TMDB" });
      });
    return;
  }

  // ===== se não bateu com nenhuma rota =====
  resposta.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  resposta.end("Rota não encontrada.");
});

servidor.listen(3000, function () {
  console.log("Servidor rodando em http://localhost:3000 🚀");
});