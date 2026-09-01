// ==========================================================================
// Catálogo público — busca produtos no Supabase e renderiza a vitrine
// ==========================================================================

const NUMERO_WHATSAPP = "5531987584930"; // troque pelo número da Mara (com DDI+DDD, só dígitos)

const grade = document.getElementById("grade-produtos");
const contagemEl = document.getElementById("contagem-produtos");
const buscaEl = document.getElementById("filtro-busca");
const categoriaEl = document.getElementById("filtro-categoria");
const tamanhoEl = document.getElementById("filtro-tamanho");

let todosProdutos = [];

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function linkWhatsapp(produto) {
  const msg = `Oi! Tenho interesse na peça "${produto.nome}" (${formatarPreco(produto.preco)}) do Brechó da Mara.`;
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function cartaoProduto(produto) {
  const foto = produto.imagem_url
    ? `<div class="cartao-foto" style="background-image:url('${produto.imagem_url}')"></div>`
    : `<div class="cartao-foto">sem foto</div>`;

  const selo = produto.status === "vendido"
    ? `<span class="cartao-selo-vendido">Vendido</span>`
    : "";

  const botao = produto.status === "vendido"
    ? `<button class="botao botao-secundario" disabled>Peça já vendida</button>`
    : `<a class="botao botao-primario" target="_blank" rel="noopener" href="${linkWhatsapp(produto)}">Tenho interesse</a>`;

  return `
    <article class="cartao-produto">
      ${selo}
      ${foto}
      <div class="cartao-corpo">
        <div class="cartao-categoria">${produto.categoria}</div>
        <h3 class="cartao-nome">${produto.nome}</h3>
        <div class="cartao-meta">
          <span>Tam. ${produto.tamanho}</span>
        </div>
        <div class="cartao-preco">${formatarPreco(produto.preco)}</div>
        <div class="cartao-rodape">${botao}</div>
      </div>
    </article>
  `;
}

function popularFiltros(produtos) {
  const categorias = [...new Set(produtos.map(p => p.categoria))].sort();
  const tamanhos = [...new Set(produtos.map(p => p.tamanho))].sort();

  categoriaEl.innerHTML = `<option value="">Categoria</option>` +
    categorias.map(c => `<option value="${c}">${c}</option>`).join("");

  tamanhoEl.innerHTML = `<option value="">Tamanho</option>` +
    tamanhos.map(t => `<option value="${t}">${t}</option>`).join("");
}

function aplicarFiltros() {
  const busca = buscaEl.value.trim().toLowerCase();
  const categoria = categoriaEl.value;
  const tamanho = tamanhoEl.value;

  const filtrados = todosProdutos.filter(p => {
    if (categoria && p.categoria !== categoria) return false;
    if (tamanho && p.tamanho !== tamanho) return false;
    if (busca && !p.nome.toLowerCase().includes(busca) && !(p.descricao || "").toLowerCase().includes(busca)) return false;
    return true;
  });

  renderizar(filtrados);
}

function renderizar(produtos) {
  contagemEl.textContent = `${produtos.length} peça${produtos.length === 1 ? "" : "s"}`;

  if (produtos.length === 0) {
    grade.innerHTML = `<div class="vazio">Nenhuma peça encontrada com esses filtros.</div>`;
    return;
  }

  grade.innerHTML = produtos.map(cartaoProduto).join("");
}

async function carregarProdutos() {
  grade.innerHTML = `<div class="carregando">Carregando peças…</div>`;

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    grade.innerHTML = `<div class="vazio">Não foi possível carregar o catálogo agora. Verifique a configuração do Supabase em js/supabaseClient.js.</div>`;
    console.error(error);
    return;
  }

  todosProdutos = data || [];
  popularFiltros(todosProdutos);
  renderizar(todosProdutos);
}

buscaEl.addEventListener("input", aplicarFiltros);
categoriaEl.addEventListener("change", aplicarFiltros);
tamanhoEl.addEventListener("change", aplicarFiltros);

carregarProdutos();
