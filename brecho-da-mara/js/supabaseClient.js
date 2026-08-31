// ==========================================================================
// Configuração do Supabase
// ==========================================================================
// 1. Crie um projeto em https://supabase.com
// 2. Vá em "Project Settings" > "API"
// 3. Copie a "Project URL" e a chave "anon public" e cole abaixo.
//
// A chave "anon" é feita para ser pública (fica visível no navegador).
// A segurança dos dados é garantida pelas regras de RLS (Row Level Security)
// definidas em sql/schema.sql — sem elas, qualquer pessoa poderia editar
// o catálogo, então NÃO pule aquele passo do README.
// ==========================================================================

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC_DO_SUPABASE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
