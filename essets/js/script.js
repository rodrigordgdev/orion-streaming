// --- CONFIGURAÇÃO DO TMDB ---
let baseImagem = "https://image.tmdb.org/t/p/w300";
let semCapa = "https://placehold.co/300x450/1c1c2e/6c2bd9?text=Sem+Imagem";
let servidorURL = "http://localhost:3000";
let usuarioLogado = "";
let progressosUsuario = [];
let itensAtuais = [];
let idioma = localStorage.getItem("orion_idioma") || "pt";
let tokenAtual = localStorage.getItem("orion_token") || "";

let textos = {
  pt: {
    entrar: "Entrar",
    criar_conta: "Criar conta",
    ja_tem_conta: "Já tem conta?",
    nao_tem_conta: "Não tem conta?",
    cadastrar: "Cadastrar",
    email_ph: "Seu e-mail",
    senha_ph: "Sua senha",
    voltar: "◀ Voltar",
    filmes: "Filmes",
    series: "Séries",
    canais: "Canais",
    ajustes: "Ajustes",
    sair: "⎋ Sair",
    buscar_filme: "🔍 Buscar filme...",
    buscar_serie: "🔍 Buscar série...",
    buscar_canal: "🔍 Buscar canal...",
    formato_hora: "Formato de hora",
    avalie: "Avalie o Orion",
    conta: "Conta",
    assistir: "▶ Assistir",
    idioma: "Idioma"
  },
  en: {
    entrar: "Sign in",
    criar_conta: "Create account",
    ja_tem_conta: "Already have an account?",
    nao_tem_conta: "Don't have an account?",
    cadastrar: "Sign up",
    email_ph: "Your email",
    senha_ph: "Your password",
    voltar: "◀ Back",
    filmes: "Movies",
    series: "Series",
    canais: "Channels",
    ajustes: "Settings",
    sair: "⎋ Log out",
    buscar_filme: "🔍 Search movie...",
    buscar_serie: "🔍 Search series...",
    buscar_canal: "🔍 Search channel...",
    formato_hora: "Time format",
    avalie: "Rate Orion",
    conta: "Account",
    assistir: "▶ Watch",
    idioma: "Language"
  }
};

// aplica o idioma em todos os elementos marcados
function aplicarIdioma() {
  // textos normais (data-i18n)
  let elementos = document.querySelectorAll("[data-i18n]");
  for (let i = 0; i < elementos.length; i++) {
    let chave = elementos[i].dataset.i18n;
    if (textos[idioma][chave]) {
      elementos[i].textContent = textos[idioma][chave];
    }
  }

  // placeholders dos inputs (data-i18n-ph)
  let inputs = document.querySelectorAll("[data-i18n-ph]");
  for (let i = 0; i < inputs.length; i++) {
    let chave = inputs[i].dataset.i18nPh;
    if (textos[idioma][chave]) {
      inputs[i].placeholder = textos[idioma][chave];
    }
  }
}

// --- TROCAR DE TELA ---
function mostrarTela(id) {
  let telas = document.querySelectorAll(".tela");
  for (let i = 0; i < telas.length; i++) {
    telas[i].classList.add("escondida");
  }
  document.getElementById(id).classList.remove("escondida");
}

// --- MONTA O "MIOLO" DE UM CARD (capa + título) ---
function mioloCard(capaUrl, titulo) {
  return `
    <img src="${capaUrl}" onerror="this.src='${semCapa}'">
    <p>${titulo}</p>
  `;
}

// --- ENVIA UM POST PRO SERVIDOR E DEVOLVE A RESPOSTA (JSON) ---
async function enviarPOST(rota, dados) {
  let resposta = await fetch(servidorURL + rota, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + tokenAtual   // <-- envia o token
    },
    body: JSON.stringify(dados)
  });
  return await resposta.json();
}

// --- FAZ UM GET PRO SERVIDOR COM O TOKEN ---
async function buscarGET(rota) {
  let resposta = await fetch(servidorURL + rota, {
    headers: { "Authorization": "Bearer " + tokenAtual }
  });
  return await resposta.json();
}

// --- BUSCA NO TMDB ATRAVÉS DO NOSSO SERVIDOR (proxy) ---
async function buscarTMDB(caminho, extra) {
  let url = servidorURL + "/tmdb?caminho=" + caminho + "&idioma=" + idiomaTMDB();
  if (extra) {
    url += "&extra=" + encodeURIComponent(extra);
  }
  let resposta = await fetch(url, {
    headers: { "Authorization": "Bearer " + tokenAtual }
  });
  return await resposta.json();
}

// --- TELA DE LOGIN ---
// --- ALTERNAR ENTRE LOGIN E CADASTRO ---
document.getElementById("ir-cadastro").addEventListener("click", function () {
  document.getElementById("form-login").classList.add("escondida");
  document.getElementById("form-cadastro").classList.remove("escondida");
});
document.getElementById("ir-login").addEventListener("click", function () {
  document.getElementById("form-cadastro").classList.add("escondida");
  document.getElementById("form-login").classList.remove("escondida");
});

// --- LOGIN DE VERDADE ---
let botaoEntrar = document.getElementById("botao-entrar");
let aviso = document.getElementById("aviso");

botaoEntrar.addEventListener("click", async function () {
  let email = document.getElementById("email").value;
  let senha = document.getElementById("senha").value;

  if (email === "" || senha === "") {
    aviso.textContent = "Preencha e-mail e senha.";
    return;
  }

  let resposta = await fetch(servidorURL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, senha: senha })
  });

  let dados = await enviarPOST("/login", { email: email, senha: senha });
  
  if (dados.sucesso) {
    usuarioLogado = dados.email;
    localStorage.setItem("orion_usuario", dados.email);
    localStorage.setItem("orion_token", dados.token);   // <-- guarda o token
    mostrarTela("tela-selecao");
  } else {
    aviso.textContent = dados.mensagem;
  }
});

// --- CADASTRO ---
let botaoCadastrar = document.getElementById("botao-cadastrar");
let avisoCadastro = document.getElementById("aviso-cadastro");

botaoCadastrar.addEventListener("click", async function () {
  let email = document.getElementById("email-cadastro").value;
  let senha = document.getElementById("senha-cadastro").value;

  if (email === "" || senha === "") {
    avisoCadastro.textContent = "Preencha e-mail e senha.";
    return;
  }

  let dados = await enviarPOST("/cadastrar", { email: email, senha: senha });

  if (dados.sucesso) {
    avisoCadastro.style.color = "#6bff9e";
    avisoCadastro.textContent = "Conta criada! Agora é só entrar. ✅";
    setTimeout(function () {
      document.getElementById("form-cadastro").classList.add("escondida");
      document.getElementById("form-login").classList.remove("escondida");
    }, 1500);
  } else {
    avisoCadastro.textContent = dados.mensagem;
  }
});

// --- TELA DE SELEÇÃO ---
let blocos = document.querySelectorAll(".bloco");
for (let i = 0; i < blocos.length; i++) {
  blocos[i].addEventListener("click", function () {
    let destino = blocos[i].dataset.destino;
    mostrarTela(destino);

    if (destino === "tela-filmes") {
      iniciarSecao("movie");
    }
    if (destino === "tela-series") {
      iniciarSecao("tv");
    }
    if (destino === "tela-canais") {
      iniciarCanais();
    }
  });
}

// --- BOTÕES VOLTAR ---
let botoesVoltar = document.querySelectorAll(".botao-voltar");
for (let i = 0; i < botoesVoltar.length; i++) {
  botoesVoltar[i].addEventListener("click", function () {
    mostrarTela(botoesVoltar[i].dataset.voltar);
  });
}

// --- FECHAR O MODAL ---
let modal = document.getElementById("modal-detalhes");

function fecharModal() {
  modal.classList.add("escondida");
  let video = document.getElementById("player");
  if (video) {
    video.pause();
  }
}

document.getElementById("fechar-modal").addEventListener("click", fecharModal);

modal.addEventListener("click", function (evento) {
  if (evento.target === modal) {
    fecharModal();
  }
});

// --- CATEGORIAS (filmes e séries usam números diferentes!) ---
let categoriasFilmes = [
  { nome: "▶ Continuar assistindo", id: "continuar" },
  { nome: "⭐ Favoritos", id: "favoritos" },
  { nome: "Populares", id: null },
  { nome: "Ação",      id: 28 },
  { nome: "Terror",    id: 27 },
  { nome: "Infantil",  id: 10751 },
  { nome: "Romance",   id: 10749 },
  { nome: "Comédia",   id: 35 },
  { nome: "Suspense",  id: 53 }
];

let categoriasSeries = [
  { nome: "⭐ Favoritos", id: "favoritos" },
  { nome: "Populares",       id: null },
  { nome: "Ação e Aventura", id: 10759 },
  { nome: "Comédia",         id: 35 },
  { nome: "Drama",           id: 18 },
  { nome: "Crime",           id: 80 },
  { nome: "Animação",        id: 16 },
  { nome: "Sci-Fi e Fantasia", id: 10765 },
  { nome: "Mistério",        id: 9648 }
];


// --- CONFIGURAÇÃO DE CADA TIPO (filme ou série) ---
function configDe(tipo) {
  if (tipo === "movie") {
    return {
      categorias: categoriasFilmes,
      idMenu: "menu-categorias",
      idLista: "lista-filmes",
      endpointPop: "movie/popular",
      endpointDisc: "discover/movie"
    };
  } else {
    return {
      categorias: categoriasSeries,
      idMenu: "menu-series",
      idLista: "lista-series",
      endpointPop: "tv/popular",
      endpointDisc: "discover/tv"
    };
  }
}


// --- MONTA O MENU LATERAL (serve pra filme E pra série) ---
function iniciarSecao(tipo) {
  let config = configDe(tipo);
  let menu = document.getElementById(config.idMenu);
  menu.innerHTML = "";

  // categorias bloqueadas no modo protegido
  let bloqueadas = ["Terror"];

  for (let i = 0; i < config.categorias.length; i++) {
    let cat = config.categorias[i];

    // se o modo protegido está ligado, pula as categorias bloqueadas
    if (modoProtegido && bloqueadas.includes(cat.nome)) {
      continue;
    }

    menu.innerHTML += `<button class="item-categoria" data-id="${cat.id}">${cat.nome}</button>`;
  }

  // pega só os itens DESTE menu (importante: tem dois menus agora!)
  let itens = menu.querySelectorAll(".item-categoria");
  for (let i = 0; i < itens.length; i++) {
    itens[i].addEventListener("click", function () {
      for (let j = 0; j < itens.length; j++) {
        itens[j].classList.remove("ativa");
      }
      itens[i].classList.add("ativa");
      mostrarConteudo(tipo, itens[i].dataset.id);
    });
  }

  itens[0].classList.add("ativa");
  mostrarConteudo(tipo, itens[0].dataset.id);
}


// --- BUSCA E MOSTRA (serve pra filme E pra série) ---
async function mostrarConteudo(tipo, generoId) {
  if (generoId === "favoritos") {
    mostrarFavoritos(tipo);
    return;
  }
  if (generoId === "continuar") {
    mostrarContinuar(tipo);
    return;
  }

  await carregarProgressos();
  
  let config = configDe(tipo);
  let area = document.getElementById(config.idLista);
  area.innerHTML = `<p class="vazio">Carregando... ⏳</p>`;

  let incluirAdulto = modoProtegido ? "false" : "true";
  let dados;
  if (!generoId || generoId === "null") {
    dados = await buscarTMDB(config.endpointPop, "&include_adult=" + incluirAdulto);
  } else {
    dados = await buscarTMDB(config.endpointDisc, "&with_genres=" + generoId + "&include_adult=" + incluirAdulto);
  }
  itensAtuais = dados.results;

  let cardsHTML = "";
  for (let i = 0; i < itensAtuais.length; i++) {
    let item = itensAtuais[i];
    // no modo protegido, pula filmes adultos
    if (modoProtegido && item.adult === true) {
      continue;
    }
    let titulo = item.title || item.name;   // filme usa title, série usa name
    let capa = item.poster_path ? baseImagem + item.poster_path : semCapa;

    // procura se este filme tem progresso salvo
    let barra = "";
    for (let p = 0; p < progressosUsuario.length; p++) {
      let prog = progressosUsuario[p];
      if (prog.filme_id === item.id && prog.duracao > 0) {
        let porcentagem = (prog.segundo / prog.duracao) * 100;
        barra = `<div class="barra-progresso"><div class="barra-preenchida" style="width: ${porcentagem}%"></div></div>`;
      }
    }

    cardsHTML += `
      <div class="card" data-index="${i}">
        ${mioloCard(capa, titulo)}
      </div>
    `;
  }

  if (cardsHTML === "") {
    cardsHTML = `<p class="vazio">Nada encontrado. 🎬</p>`;
  }

  area.innerHTML = cardsHTML;

  // liga o clique em cada card
  let cards = area.querySelectorAll(".card");
  for (let i = 0; i < cards.length; i++) {
    let item = itensAtuais[i];
    cards[i].addEventListener("click", function () {
      abrirDetalhes(item);
    });
  }
}


// --- ABRE OS DETALHES (serve pra filme E pra série) ---
async function abrirDetalhes(item) {
  let titulo = item.title || item.name;
  let data = item.release_date || item.first_air_date;
  let ano = data ? data.substring(0, 4) : "—";
  let nota = item.vote_average ? item.vote_average.toFixed(1) : "—";
  let sinopse = item.overview ? item.overview : "Sinopse não disponível em português.";
  let capa = item.backdrop_path
    ? "https://image.tmdb.org/t/p/w780" + item.backdrop_path
    : baseImagem + item.poster_path;

  let corpo = document.querySelector(".modal-corpo");
  corpo.innerHTML = `
    <img class="modal-capa" src="${capa}">
    <div class="modal-info">
      <h2>${titulo}</h2>
      <p class="modal-meta">⭐ ${nota} &nbsp;•&nbsp; 📅 ${ano}</p>
      <p class="modal-sinopse">${sinopse}</p>
      <button class="botao-assistir">▶ Assistir</button>
      <button class="botao-favoritar" id="btn-fav">🤍 Favoritar</button>
    </div>
  `;

  modal.classList.remove("escondida");

  document.querySelector(".botao-assistir").addEventListener("click", function () {
    let capa = item.poster_path ? baseImagem + item.poster_path : semCapa;
    tocarVideo(titulo, item.id, capa);
  });
  // --- BOTÃO FAVORITAR INTELIGENTE ---
  let btnFav = document.getElementById("btn-fav");

  // 1. checa se este filme já é favorito
  let listaFav = await buscarGET("/favoritos?email=" + usuarioLogado);
  
  let favExistente = null;
  for (let i = 0; i < listaFav.length; i++) {
    if (listaFav[i].filme_id === item.id) {
      favExistente = listaFav[i];
    }
  }

  // 2. mostra o estado certo
  if (favExistente) {
    btnFav.textContent = "❤️ Nos favoritos";
    btnFav.classList.add("favoritado");
  } else {
    btnFav.textContent = "🤍 Favoritar";
  }

  // 3. clique alterna entre favoritar e desfavoritar
  btnFav.addEventListener("click", async function () {
    if (favExistente) {
      // já é favorito → remove
      await enviarPOST("/desfavoritar", { id: favExistente.id });
      favExistente = null;
      btnFav.textContent = "🤍 Favoritar";
      btnFav.classList.remove("favoritado");
    } else {
      // não é favorito → adiciona
      let titulo = item.title || item.name;
      let capa = item.poster_path ? baseImagem + item.poster_path : semCapa;
      let resp = await enviarPOST("/favoritar", { usuario: usuarioLogado, filme_id: item.id, titulo: titulo, capa: capa });
      // guarda o novo favorito (busca de novo pra pegar o id)
      let novaLista = await buscarGET("/favoritos?email=" + usuarioLogado);
      for (let i = 0; i < novaLista.length; i++) {
        if (novaLista[i].filme_id === item.id) {
          favExistente = novaLista[i];
        }
      }
      btnFav.textContent = "❤️ Nos favoritos";
      btnFav.classList.add("favoritado");
    }
  });
}


// --- TOCA O VÍDEO (player HLS) com "continuar assistindo" ---
async function tocarVideo(titulo, filmeId, capa) {
  jaRemovido = false; 
  let corpo = document.querySelector(".modal-corpo");
  corpo.innerHTML = `
    <video id="player" class="player" controls autoplay></video>
    <div class="modal-info">
      <h2>${titulo}</h2>
      <p class="modal-meta">🎬 Vídeo de demonstração (Big Buck Bunny)</p>
    </div>
  `;

  let video = document.getElementById("player");
  let urlStream = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  conectarHLS(video, urlStream);

  // 1. BUSCA onde o usuário parou
  let resposta = await fetch(servidorURL + "/progresso?email=" + usuarioLogado + "&filme_id=" + filmeId);
  let dados = await resposta.json();

  // 2. quando o vídeo estiver pronto, PULA pro segundo salvo
  video.addEventListener("loadedmetadata", function () {
    if (dados.segundo > 0) {
      video.currentTime = dados.segundo;
    }
  });

  // 3. a cada 5 segundos, SALVA onde está
  setInterval(function () {
    if (!video.paused) {
      enviarPOST("/progresso", {
        usuario: usuarioLogado,
        filme_id: filmeId,
        titulo: titulo,
        segundo: Math.floor(video.currentTime),
        duracao: Math.floor(video.duration),
        capa: capa
      });
    }
  }, 5000);

  // --- detecta se o vídeo terminou (ou quase) e remove do "continuar" ---
  video.addEventListener("timeupdate", function () {
    // se assistiu 95% ou mais, considera "terminado"
    if (video.duration > 0 && video.currentTime >= video.duration * 0.95) {
      removerProgresso(filmeId);
    }
  });

  video.addEventListener("ended", function () {
    removerProgresso(filmeId);
  });
}

// --- DADOS DOS CANAIS (lista feita à mão — são streams de teste!) ---
let canais = [
  { nome: "Ao Vivo (teste)",  categoria: "Notícias", icone: "🔴", stream: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8" },
  { nome: "News Demo",        categoria: "Notícias", icone: "📰", stream: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8" },
  { nome: "Arena Live",       categoria: "Esportes", icone: "🏟️", stream: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8" },
  { nome: "Sports Demo",      categoria: "Esportes", icone: "⚽", stream: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8" },
  { nome: "Kids Bunny",       categoria: "Infantil", icone: "🐰", stream: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
  { nome: "Cine Sintel",      categoria: "Filmes",   icone: "🎬", stream: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" },
  { nome: "Cine Bunny",       categoria: "Filmes",   icone: "🎞️", stream: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
];

let categoriasCanais = ["Todos", "Notícias", "Esportes", "Infantil", "Filmes"];


// --- MONTA O MENU LATERAL DOS CANAIS ---
function iniciarCanais() {
  let menu = document.getElementById("menu-canais");
  menu.innerHTML = "";

  for (let i = 0; i < categoriasCanais.length; i++) {
    menu.innerHTML += `<button class="item-categoria" data-cat="${categoriasCanais[i]}">${categoriasCanais[i]}</button>`;
  }

  let itens = menu.querySelectorAll(".item-categoria");
  for (let i = 0; i < itens.length; i++) {
    itens[i].addEventListener("click", function () {
      for (let j = 0; j < itens.length; j++) {
        itens[j].classList.remove("ativa");
      }
      itens[i].classList.add("ativa");
      mostrarCanais(itens[i].dataset.cat);
    });
  }

  itens[0].classList.add("ativa");
  mostrarCanais("Todos");
}


// --- MOSTRA OS CANAIS DA CATEGORIA ---
function mostrarCanais(categoria) {
  let area = document.getElementById("lista-canais");

  let html = "";
  for (let i = 0; i < canais.length; i++) {
    let canal = canais[i];
    if (categoria === "Todos" || canal.categoria === categoria) {
      html += `
        <div class="canal-card" data-index="${i}">
          <span class="canal-icone">${canal.icone}</span>
          <span class="canal-nome">${canal.nome}</span>
        </div>
      `;
    }
  }

  if (html === "") {
    html = `<p class="vazio">Nenhum canal nesta categoria. 📡</p>`;
  }

  area.innerHTML = html;

  let cards = area.querySelectorAll(".canal-card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener("click", function () {
      let idx = Number(cards[i].dataset.index);
      tocarCanal(canais[idx].nome, canais[idx].stream);
    });
  }
}


// --- TOCA UM CANAL AO VIVO (player HLS) ---
function tocarCanal(nome, urlStream) {
  let corpo = document.querySelector(".modal-corpo");
  corpo.innerHTML = `
    <video id="player" class="player" controls autoplay></video>
    <div class="modal-info">
      <h2>${nome}</h2>
      <p class="modal-meta">🔴 Ao vivo</p>
    </div>
  `;

  let video = document.getElementById("player");

  conectarHLS(video, urlStream);
  modal.classList.remove("escondida");
}

// --- CONECTA UM STREAM HLS A UM ELEMENTO DE VÍDEO (usado por filmes, séries e canais) ---
function conectarHLS(video, urlStream) {
  if (Hls.isSupported()) {
    let hls = new Hls();
    hls.loadSource(urlStream);
    hls.attachMedia(video);
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = urlStream;
  }
}

// --- BUSCA E MOSTRA OS FAVORITOS (vêm do NOSSO servidor) ---
async function mostrarFavoritos(tipo) {
  let config = configDe(tipo);
  let area = document.getElementById(config.idLista);
  area.innerHTML = `<p class="vazio">Carregando favoritos... ⏳</p>`;

  let favoritos = await buscarGET("/favoritos?email=" + usuarioLogado);

  let cardsHTML = "";
  for (let i = 0; i < favoritos.length; i++) {
    let fav = favoritos[i];
    let capa = fav.capa ? fav.capa : semCapa;
    cardsHTML += `
      <div class="card card-fav">
        <button class="botao-remover" data-id="${fav.id}" title="Remover dos favoritos">✕</button>
        <img src="${capa}" onerror="this.src='${semCapa}'">
        <p>${fav.titulo}</p>
      </div>
    `;
  }

  if (cardsHTML === "") {
    cardsHTML = `<p class="vazio">Você ainda não favoritou nada. Clique em ❤ num filme! 🎬</p>`;
  }

  area.innerHTML = cardsHTML;

  // liga o clique em cada botão de remover
  let botoes = area.querySelectorAll(".botao-remover");
  for (let i = 0; i < botoes.length; i++) {
    botoes[i].addEventListener("click", function () {
      let id = botoes[i].dataset.id;
      desfavoritar(id, tipo);
    });
  }
}

// --- REMOVE UM FAVORITO (POST /desfavoritar) ---
async function desfavoritar(id, tipo) {
  let dados = await enviarPOST("/desfavoritar", { id: id });
  if (dados.sucesso) {
    mostrarFavoritos(tipo);
  }
}

// --- MANTER LOGADO: checa se já tem usuário salvo ao abrir ---
let salvo = localStorage.getItem("orion_usuario");
if (salvo) {
  usuarioLogado = salvo;
  tokenAtual = localStorage.getItem("orion_token") || "";
  mostrarTela("tela-selecao");
}


// --- SAIR (logout) ---
function sair() {
  localStorage.removeItem("orion_usuario");
  localStorage.removeItem("orion_token");   // <-- apaga o token
  usuarioLogado = "";
  tokenAtual = "";
  mostrarTela("tela-login");
}

document.getElementById("botao-sair").addEventListener("click", sair);

// --- BUSCA TODOS OS PROGRESSOS DO USUÁRIO ---
async function carregarProgressos() {
  progressosUsuario = await buscarGET("/meus-progressos?email=" + usuarioLogado);
}

// --- MOSTRA "CONTINUAR ASSISTINDO" ---
async function mostrarContinuar(tipo) {
  let config = configDe(tipo);
  let area = document.getElementById(config.idLista);
  area.innerHTML = `<p class="vazio">Carregando... ⏳</p>`;

  let lista = await buscarGET("/meus-progressos?email=" + usuarioLogado);

  let cardsHTML = "";
  for (let i = 0; i < lista.length; i++) {
    let item = lista[i];

    // só mostra quem tem progresso de verdade (começou mas não acabou)
    if (item.duracao > 0 && item.segundo > 0) {
      let capa = item.capa ? item.capa : semCapa;
      let porcentagem = (item.segundo / item.duracao) * 100;
      cardsHTML += `
        <div class="card" data-fid="${item.filme_id}" data-titulo="${item.titulo}" data-capa="${item.capa}">
          <img src="${capa}" onerror="this.src='${semCapa}'">
          <div class="barra-progresso"><div class="barra-preenchida" style="width: ${porcentagem}%"></div></div>
          <p>${item.titulo}</p>
        </div>
      `;
    }
  }

  if (cardsHTML === "") {
    cardsHTML = `<p class="vazio">Você ainda não começou nenhum filme. Dê o play em algo! 🎬</p>`;
  }

  area.innerHTML = cardsHTML;

  // clicar no card retoma o vídeo
  let cards = area.querySelectorAll(".card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener("click", function () {
      let fid = Number(cards[i].dataset.fid);
      let tit = cards[i].dataset.titulo;
      let cap = cards[i].dataset.capa;
      // abre o modal já tocando o vídeo, do ponto salvo
      modal.classList.remove("escondida");
      tocarVideo(tit, fid, cap);
    });
  }
}

// --- BUSCA (serve pra filmes E séries) ---
function ligarBusca(idCampo, tipo) {
  let campo = document.getElementById(idCampo);
  let tempoBusca;

  campo.addEventListener("input", function () {
    let texto = campo.value;

    clearTimeout(tempoBusca);
    tempoBusca = setTimeout(function () {
      if (texto.trim() === "") {
        mostrarConteudo(tipo, null);   // volta pros populares
      } else {
        buscarConteudo(tipo, texto);
      }
    }, 400);
  });
}

// liga a busca nos dois campos
ligarBusca("busca-filmes", "movie");
ligarBusca("busca-series", "tv");


async function buscarConteudo(tipo, texto) {
  let config = configDe(tipo);
  let area = document.getElementById(config.idLista);
  area.innerHTML = `<p class="vazio">Buscando... 🔍</p>`;

  let incluirAdulto = modoProtegido ? "false" : "true";
  let endpoint = tipo === "movie" ? "search/movie" : "search/tv";
  let dados = await buscarTMDB(endpoint, "&query=" + encodeURIComponent(texto) + "&include_adult=" + incluirAdulto);
  itensAtuais = dados.results;

  let cardsHTML = "";
  for (let i = 0; i < itensAtuais.length; i++) {
    let item = itensAtuais[i];
    let titulo = item.title || item.name;
    let capa = item.poster_path ? baseImagem + item.poster_path : semCapa;
    cardsHTML += `
      <div class="card" data-index="${i}">
        ${mioloCard(capa, titulo)}
      </div>
    `;
  }

  if (cardsHTML === "") {
    cardsHTML = `<p class="vazio">Nada encontrado pra "${texto}". 🎬</p>`;
  }

  area.innerHTML = cardsHTML;

  let cards = area.querySelectorAll(".card");
  for (let i = 0; i < cards.length; i++) {
    let item = itensAtuais[i];
    cards[i].addEventListener("click", function () {
      abrirDetalhes(item);
    });
  }
}

// --- REMOVE O PROGRESSO (quando o filme termina) ---
async function removerProgresso(filmeId) {
  if (jaRemovido) return;
  jaRemovido = true;
  await enviarPOST("/remover-progresso", { usuario: usuarioLogado, filme_id: filmeId });
}
// --- BUSCA DE CANAIS (filtra a lista local, sem internet) ---
let campoBuscaCanais = document.getElementById("busca-canais");
let tempoBuscaCanais;

campoBuscaCanais.addEventListener("input", function () {
  let texto = campoBuscaCanais.value.toLowerCase().trim();

  clearTimeout(tempoBuscaCanais);
  tempoBuscaCanais = setTimeout(function () {
    if (texto === "") {
      // apagou tudo: volta a mostrar todos
      mostrarCanais("Todos");
      return;
    }

    // filtra os canais cujo nome contém o texto digitado
    let encontrados = [];
    for (let i = 0; i < canais.length; i++) {
      if (canais[i].nome.toLowerCase().includes(texto)) {
        encontrados.push(canais[i]);
      }
    }

    desenharCanais(encontrados);
  }, 300);
});


// --- DESENHA UMA LISTA DE CANAIS (reutilizável) ---
function desenharCanais(lista) {
  let area = document.getElementById("lista-canais");

  let html = "";
  for (let i = 0; i < lista.length; i++) {
    let canal = lista[i];
    let idxReal = canais.indexOf(canal);
    html += `
      <div class="canal-card" data-index="${idxReal}">
        <span class="canal-icone">${canal.icone}</span>
        <span class="canal-nome">${canal.nome}</span>
      </div>
    `;
  }

  if (html === "") {
    html = `<p class="vazio">Nenhum canal encontrado. 📡</p>`;
  }

  area.innerHTML = html;

  let cards = area.querySelectorAll(".canal-card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener("click", function () {
      let idx = Number(cards[i].dataset.index);
      tocarCanal(canais[idx].nome, canais[idx].stream);
    });
  }
}

// --- RELÓGIO ---
let formatoHora = localStorage.getItem("orion_formato_hora") || "24";

function atualizarRelogio() {
  let agora = new Date();
  let horas = agora.getHours();
  let minutos = agora.getMinutes();

  // adiciona o zero à esquerda (ex: 9 -> 09)
  let minutosTexto = minutos < 10 ? "0" + minutos : minutos;

  let texto;
  if (formatoHora === "12") {
    let periodo = horas >= 12 ? "PM" : "AM";
    let horas12 = horas % 12;
    if (horas12 === 0) horas12 = 12;
    texto = horas12 + ":" + minutosTexto + " " + periodo;
  } else {
    let horasTexto = horas < 10 ? "0" + horas : horas;
    texto = horasTexto + ":" + minutosTexto;
  }

  let relogio = document.querySelectorAll(".relogio");
  if (relogio) {
    relogio.forEach(function (relogio) {
      relogio.textContent = texto;
    });
  }
}

// atualiza agora e depois a cada segundo
atualizarRelogio();
setInterval(atualizarRelogio, 1000);


// --- AJUSTE: FORMATO DE HORA ---
let btnsFormato = document.querySelectorAll(".btn-formato");
for (let i = 0; i < btnsFormato.length; i++) {
  // marca o botão ativo ao carregar
  if (btnsFormato[i].dataset.formato === formatoHora) {
    btnsFormato[i].classList.add("ativo");
  }

  btnsFormato[i].addEventListener("click", function () {
    formatoHora = btnsFormato[i].dataset.formato;
    localStorage.setItem("orion_formato_hora", formatoHora);

    // atualiza o destaque dos botões
    for (let j = 0; j < btnsFormato.length; j++) {
      btnsFormato[j].classList.remove("ativo");
    }
    btnsFormato[i].classList.add("ativo");

    // atualiza o relógio na hora
    atualizarRelogio();
  });
}

// --- AVALIAÇÃO POR ESTRELAS ---
let estrelas = document.querySelectorAll(".estrela");
let avisoAvaliacao = document.getElementById("aviso-avaliacao");

for (let i = 0; i < estrelas.length; i++) {
  estrelas[i].addEventListener("click", function () {
    let valor = Number(estrelas[i].dataset.valor);

    // acende as estrelas até a clicada
    for (let j = 0; j < estrelas.length; j++) {
      if (j < valor) {
        estrelas[j].classList.add("acesa");
      } else {
        estrelas[j].classList.remove("acesa");
      }
    }

    // mensagem de agradecimento
    if (valor >= 4) {
      avisoAvaliacao.textContent = "Obrigado pela avaliação! 🎉";
    } else {
      avisoAvaliacao.textContent = "Obrigado! Vamos melhorar. 🙏";
    }

    // lembra a avaliação
    localStorage.setItem("orion_avaliacao", valor);
  });
}

// mostra a avaliação salva (se já avaliou antes)
let avaliacaoSalva = Number(localStorage.getItem("orion_avaliacao"));
if (avaliacaoSalva > 0) {
  for (let i = 0; i < estrelas.length; i++) {
    if (i < avaliacaoSalva) {
      estrelas[i].classList.add("acesa");
    }
  }
}

// --- MOSTRAR E-MAIL LOGADO NOS AJUSTES ---
let btnSairAjustes = document.getElementById("sair-ajustes");

btnSairAjustes.addEventListener("click", sair);

// preenche o e-mail toda vez que abre a tela de ajustes
let blocoAjustes = document.querySelector('.bloco[data-destino="tela-ajustes"]');
if (blocoAjustes) {
  blocoAjustes.addEventListener("click", function () {
    let campoEmail = document.getElementById("email-logado");
    if (campoEmail) {
      campoEmail.textContent = usuarioLogado;
    }
  });
}

// --- SELETOR DE IDIOMA ---
let btnsIdioma = document.querySelectorAll(".btn-idioma");
for (let i = 0; i < btnsIdioma.length; i++) {
  if (btnsIdioma[i].dataset.idioma === idioma) {
    btnsIdioma[i].classList.add("ativo");
  }

  btnsIdioma[i].addEventListener("click", function () {
    idioma = btnsIdioma[i].dataset.idioma;
    localStorage.setItem("orion_idioma", idioma);

    for (let j = 0; j < btnsIdioma.length; j++) {
      btnsIdioma[j].classList.remove("ativo");
    }
    btnsIdioma[i].classList.add("ativo");

    aplicarIdioma();
  });
}

// aplica o idioma salvo assim que a página carrega
aplicarIdioma();

function idiomaTMDB() {
  return idioma === "en" ? "en-US" : "pt-BR";
}

// --- CONTROLE DOS PAIS: DEFINIR PIN ---
let btnSalvarPin = document.getElementById("btn-salvar-pin");
let avisoPin = document.getElementById("aviso-pin");

btnSalvarPin.addEventListener("click", async function () {
  let pin = document.getElementById("campo-pin").value;

  // valida: tem que ser 4 dígitos numéricos
  if (pin.length !== 4 || isNaN(pin)) {
    avisoPin.style.color = "#ff6b6b";
    avisoPin.textContent = "O PIN deve ter 4 números.";
    return;
  }

  let resposta = await fetch(servidorURL + "/definir-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: usuarioLogado, pin: pin })
  });

  let dados = await enviarPOST("/definir-pin", { usuario: usuarioLogado, pin: pin });
  if (dados.sucesso) {
    avisoPin.style.color = "#6bff9e";
    avisoPin.textContent = "PIN salvo com segurança! 🔒";
    document.getElementById("campo-pin").value = "";
  }
});

// --- MODO PROTEGIDO (liga/desliga) ---
let checkProtegido = document.getElementById("check-protegido");

// carrega o estado salvo
let modoProtegido = localStorage.getItem("orion_protegido") === "true";
checkProtegido.checked = modoProtegido;

checkProtegido.addEventListener("change", async function () {
  if (checkProtegido.checked) {
    // LIGAR: livre
    modoProtegido = true;
    localStorage.setItem("orion_protegido", "true");
  } else {
    // DESLIGAR: exige o PIN
    let pin = prompt("Digite o PIN de 4 dígitos para desligar o modo protegido:");

    if (pin === null) {
      // cancelou: mantém ligado
      checkProtegido.checked = true;
      return;
    }

    let resposta = await fetch(servidorURL + "/verificar-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuarioLogado, pin: pin })
    });
    let dados = await enviarPOST("/verificar-pin", { usuario: usuarioLogado, pin: pin });

    if (dados.semPin) {
      alert("Você ainda não definiu um PIN. Defina um primeiro!");
      checkProtegido.checked = true;
      return;
    }
    // ...resto igual

    if (dados.correto) {
      modoProtegido = false;
      localStorage.setItem("orion_protegido", "false");
    } else {
      alert("PIN incorreto. 🔒");
      checkProtegido.checked = true;   // volta pra ligado
    }
  }
});