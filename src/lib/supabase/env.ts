import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Remove /rest/v1 e barra final — erro comum ao copiar a URL da Data API. */
export function supabaseUrl() {
  const bruto = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (!bruto) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada. Na Vercel use https://SEU_REF.supabase.co (sem /rest/v1).",
    );
  }
  return bruto.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function supabaseAnonKey() {
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!chave) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada na Vercel.");
  }
  return chave;
}

export function createSupabase() {
  return createSupabaseClient(supabaseUrl(), supabaseAnonKey());
}
