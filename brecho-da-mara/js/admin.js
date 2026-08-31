// ==========================================================================
// Painel administrativo — login e CRUD do catálogo, conectados ao Supabase
// ==========================================================================

const BUCKET_IMAGENS = "produtos";

const telaLogin = document.getElementById("tela-login");
const telaPainel = document.getElementById("tela-painel");
const formLogin = document.getElementById("form-login");
const loginErro = document.getElementById("login-erro");
const btnSair = document.getElementById("btn-sair");
const emailUsuario = document.getElementById("email-usuario");

const corpoTabela = document.getElementById("corpo-tabela-produtos");
const btnNovoProduto = document.getElementById("btn-novo-produto");
const sobreposicaoModal = document.getElementById("sobreposicao-modal");
const formProduto = document.getElementById("form-produto");
const modalTitulo = document.getElementById("modal-titulo");
const btnCancelarModal = document.getElementById("btn-cancelar-modal");
const modalErro = document.getElementById("modal-erro");

let produtoEditandoId = null;

// ---------- Autenticação ----------

async function verificarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    mostrarPainel(session);
  } else {
    mostrarLogin();
  }
}

function mostrarLogin() {
  telaLogin.style.display = "flex";
  telaPainel.style.display = "none";
}

function mostrarPainel(session) {
  telaLogin.style.display = "none";
  telaPainel.style.display = "block";
  emailUsuario.textContent = session.user.email;
  carregarProdutosAdmin();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErro.style.display = "none";

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

  if (error) {
    loginErro.textContent = "E-mail ou senha incorretos.";
    loginErro.style.display = "block";
    return;
  }

  mostrarPainel(data.session);
});

btnSair.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  mostrarLogin();
});

// ---------- Listagem ----------

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function linhaTabela(produto) {
  const miniatura = produto.imagem_url
    ? `<img class="tabela-miniatura" src="${produto.imagem_url}" alt="">`
    : `<div class="tabela-miniatura"></div>`;

  return `
    <tr data-id="${produto.id}">
      <td>${miniatura}</td>
      <td>${produto.nome}</td>
      <td>${produto.categoria}</td>
      <td>${produto.tamanho}</td>
      <td>${formatarPreco(produto.preco)}</td>
      <td><span class="etiqueta-status ${produto.status}">${produto.status === "vendido" ? "Vendido" : "Disponível"}</span></td>
      <td>
        <div class="acoes-tabela">
          <button class="editar">Editar</button>
          <button class="alternar-status">${produto.status === "vendido" ? "Marcar disponível" : "Marcar vendido"}</button>
          <button class="excluir">Excluir</button>
        </div>
      </td>
    </tr>
  `;
}

async function carregarProdutosAdmin() {
  corpoTabela.innerHTML = `<tr><td colspan="7" class="carregando">Carregando…</td></tr>`;

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    corpoTabela.innerHTML = `<tr><td colspan="7" class="carregando">Erro ao carregar produtos.</td></tr>`;
    console.error(error);
    return;
  }

  if (!data.length) {
    corpoTabela.innerHTML = `<tr><td colspan="7" class="carregando">Nenhuma peça cadastrada ainda.</td></tr>`;
    return;
  }

  corpoTabela.innerHTML = data.map(linhaTabela).join("");
  window.__produtosCache = data;
}

corpoTabela.addEventListener("click", async (e) => {
  const linha = e.target.closest("tr");
  if (!linha) return;
  const id = linha.dataset.id;
  const produto = (window.__produtosCache || []).find(p => String(p.id) === String(id));
  if (!produto) return;

  if (e.target.classList.contains("editar")) {
    abrirModal(produto);
  } else if (e.target.classList.contains("excluir")) {
    if (confirm(`Excluir "${produto.nome}" do catálogo? Essa ação não pode ser desfeita.`)) {
      const { error } = await supabaseClient.from("produtos").delete().eq("id", id);
      if (error) { alert("Não foi possível excluir a peça."); console.error(error); return; }
      carregarProdutosAdmin();
    }
  } else if (e.target.classList.contains("alternar-status")) {
    const novoStatus = produto.status === "vendido" ? "disponivel" : "vendido";
    const { error } = await supabaseClient.from("produtos").update({ status: novoStatus }).eq("id", id);
    if (error) { alert("Não foi possível atualizar o status."); console.error(error); return; }
    carregarProdutosAdmin();
  }
});

// ---------- Modal de cadastro/edição ----------

function abrirModal(produto = null) {
  formProduto.reset();
  modalErro.style.display = "none";
  produtoEditandoId = produto ? produto.id : null;
  modalTitulo.textContent = produto ? "Editar peça" : "Nova peça";

  if (produto) {
    document.getElementById("campo-nome").value = produto.nome;
    document.getElementById("campo-categoria").value = produto.categoria;
    document.getElementById("campo-tamanho").value = produto.tamanho;
    document.getElementById("campo-preco").value = produto.preco;
    document.getElementById("campo-descricao").value = produto.descricao || "";
  }

  sobreposicaoModal.style.display = "flex";
}

function fecharModal() {
  sobreposicaoModal.style.display = "none";
  produtoEditandoId = null;
}

btnNovoProduto.addEventListener("click", () => abrirModal());
btnCancelarModal.addEventListener("click", fecharModal);
sobreposicaoModal.addEventListener("click", (e) => {
  if (e.target === sobreposicaoModal) fecharModal();
});

async function enviarImagemSeHouver() {
  const arquivo = document.getElementById("campo-imagem").files[0];
  if (!arquivo) return null;

  const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;

  const { error: erroUpload } = await supabaseClient.storage
    .from(BUCKET_IMAGENS)
    .upload(nomeArquivo, arquivo, { cacheControl: "3600", upsert: false });

  if (erroUpload) throw erroUpload;

  const { data } = supabaseClient.storage.from(BUCKET_IMAGENS).getPublicUrl(nomeArquivo);
  return data.publicUrl;
}

formProduto.addEventListener("submit", async (e) => {
  e.preventDefault();
  modalErro.style.display = "none";

  const botaoSalvar = formProduto.querySelector("button[type=submit]");
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando…";

  try {
    const dados = {
      nome: document.getElementById("campo-nome").value.trim(),
      categoria: document.getElementById("campo-categoria").value.trim(),
      tamanho: document.getElementById("campo-tamanho").value.trim(),
      preco: parseFloat(document.getElementById("campo-preco").value),
      descricao: document.getElementById("campo-descricao").value.trim(),
    };

    const urlImagem = await enviarImagemSeHouver();
    if (urlImagem) dados.imagem_url = urlImagem;

    let erro;
    if (produtoEditandoId) {
      ({ error: erro } = await supabaseClient.from("produtos").update(dados).eq("id", produtoEditandoId));
    } else {
      dados.status = "disponivel";
      ({ error: erro } = await supabaseClient.from("produtos").insert(dados));
    }

    if (erro) throw erro;

    fecharModal();
    carregarProdutosAdmin();
  } catch (erro) {
    console.error(erro);
    modalErro.textContent = "Não foi possível salvar a peça. Confira os campos e tente novamente.";
    modalErro.style.display = "block";
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = "Salvar peça";
  }
});

verificarSessao();
