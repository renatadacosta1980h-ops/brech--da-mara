# Brechó da Mara

Site do brechó com catálogo público de roupas e uma área administrativa
separada (mas conectada ao mesmo banco de dados) para a Mara cadastrar,
editar e vender as peças. Tema azul-jeans e preto.

Feito em HTML, CSS e JavaScript puro (sem build/compilação) + [Supabase](https://supabase.com)
como banco de dados, autenticação e armazenamento de imagens.

```
brecho-da-mara/
├── index.html          → catálogo público
├── admin.html           → área administrativa (login + gestão)
├── css/style.css        → visual do site (tema azul e preto)
├── js/supabaseClient.js → configuração de conexão com o Supabase
├── js/catalog.js        → lógica do catálogo público
├── js/admin.js          → lógica do painel (login, cadastrar, editar, excluir)
├── sql/schema.sql        → script para criar a tabela e as regras de segurança
└── render.yaml           → configuração de deploy no Render
```

---

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**.
2. Espere o projeto terminar de ser criado (leva 1–2 minutos).
3. No menu lateral, vá em **SQL Editor** → **New query**, cole todo o
   conteúdo do arquivo `sql/schema.sql` deste projeto e clique em **Run**.
   Isso cria a tabela `produtos` e as regras de segurança (RLS).
4. Ainda no menu lateral, vá em **Storage** → **New bucket**, crie um bucket
   chamado `produtos` e marque **Public bucket**. (O script do passo 3 já
   libera as permissões desse bucket, então basta criá-lo com esse nome.)
5. Crie o usuário da Mara (quem vai logar na área admin): vá em
   **Authentication** → **Users** → **Add user** → **Create new user**,
   preencha e-mail e senha, e deixe **Auto Confirm User** marcado.
6. Vá em **Project Settings** → **API** e copie:
   - **Project URL**
   - a chave **anon public**

## 2. Configurar o site com esses dados

Abra `js/supabaseClient.js` e substitua as duas linhas:

```js
const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC_DO_SUPABASE";
```

pelos valores copiados no passo anterior. Essa chave "anon" é feita para
ficar exposta no navegador — quem protege os dados são as regras de
segurança já criadas pelo `schema.sql` (só o login da Mara pode editar).

Se quiser testar localmente antes de publicar, dê duplo clique em
`index.html` para abrir no navegador, ou use a extensão "Live Server" do
VS Code.

## 3. Publicar no GitHub

```bash
cd brecho-da-mara
git init
git add .
git commit -m "Primeira versão do Brechó da Mara"
```

Crie um repositório novo (vazio, sem README) em [github.com/new](https://github.com/new),
depois:

```bash
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/brecho-da-mara.git
git push -u origin main
```

## 4. Publicar no Render

1. Entre em [render.com](https://render.com) e clique em **New** → **Static Site**.
2. Conecte sua conta do GitHub e escolha o repositório `brecho-da-mara`.
3. Configure:
   - **Build Command**: deixe em branco (ou `echo "sem build"`)
   - **Publish directory**: `.`
4. Clique em **Create Static Site**. Em cerca de 1 minuto o Render publica
   uma URL como `https://brecho-da-mara.onrender.com`.

O arquivo `render.yaml` já vem com essas configurações prontas — se você
usar **Blueprints** no Render (New → Blueprint), ele detecta esse arquivo
automaticamente.

O catálogo fica em `/` e a área da Mara em `/admin` (ou `/admin.html`).

## 5. Usar no dia a dia

- **Catálogo** (`index.html`): qualquer visitante vê as peças, filtra por
  categoria, tamanho ou busca, e clica em "Tenho interesse" para chamar no
  WhatsApp. Antes de publicar, troque o número em `js/catalog.js`
  (constante `NUMERO_WHATSAPP`, formato `55DDDNUMERO`, só dígitos).
- **Área da Mara** (`admin.html`): login com o e-mail/senha criados no
  passo 1.5. De lá dá para cadastrar peça nova (com foto), editar, marcar
  como vendida ou excluir. Tudo aparece no catálogo público na hora.

## Próximos passos possíveis

- Domínio próprio (ex. `brechodamara.com.br`) apontando para o Render.
- Mais de um usuário admin (repita o passo 1.5 no Supabase).
- Categorias fixas em vez de texto livre, se o catálogo crescer muito.
