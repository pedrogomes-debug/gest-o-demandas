// Verificação: o banco responde e a chave anônima consegue ler (app sem login).
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
const { error: erroAnon } = await anon.from("v_demandas").select("id").limit(1);

if (erroAnon) {
  console.error(`[FALHA] anon não consegue ler v_demandas: ${erroAnon.message}`);
  falhou = true;
} else {
  console.log("[ok]    anon lê v_demandas (app sem login)");
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
} else {
  console.log("[pular] SUPABASE_SERVICE_ROLE_KEY ausente — contagem de linhas não verificada");
}

process.exit(falhou ? 1 : 0);
