// Verificação da fase 0: o banco responde, o schema está no ar e o RLS
// está barrando a chave anônima.
//
//   npm run smoke

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
  const [chave, ...resto] = linha.split("=");
  if (chave && !chave.startsWith("#") && resto.length) {
    process.env[chave.trim()] ??= resto.join("=").trim();
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local");
  process.exit(1);
}

let falhou = false;

const anon = createClient(url, anonKey);
const { data: comoAnon, error: erroAnon } = await anon.from("v_demandas").select("id");

if (erroAnon) {
  console.log(`[ok]    anon bloqueado pelo RLS (${erroAnon.message})`);
} else if (comoAnon.length > 0) {
  console.error(
    `[FALHA] anon leu ${comoAnon.length} demanda(s) de v_demandas. ` +
      "Rode: alter view v_demandas set (security_invoker = on);",
  );
  falhou = true;
} else {
  console.log("[ok]    anon não enxerga nenhuma demanda");
}

if (serviceKey) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  for (const tabela of ["clientes", "pessoas", "demandas"]) {
    const { count, error } = await admin.from(tabela).select("*", { count: "exact", head: true });
    if (error) {
      console.error(`[FALHA] ${tabela}: ${error.message}`);
      falhou = true;
    } else {
      console.log(`[ok]    ${tabela}: ${count} linha(s)`);
    }
  }

  const { data: view, error: erroView } = await admin.from("v_demandas").select("*").limit(1);
  if (erroView) {
    console.error(`[FALHA] v_demandas: ${erroView.message}`);
    falhou = true;
  } else {
    console.log(`[ok]    v_demandas responde: ${JSON.stringify(view[0] ?? null)}`);
  }
} else {
  console.log("[pular] SUPABASE_SERVICE_ROLE_KEY ausente — contagem de linhas não verificada");
}

process.exit(falhou ? 1 : 0);
