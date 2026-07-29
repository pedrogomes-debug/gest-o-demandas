"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoAuth = { erro?: string; aviso?: string };

function lerCredenciais(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  return { email, senha };
}

export async function entrar(
  _estadoAnterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCredenciais(formData);
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return { erro: error.message };

  redirect("/");
}

export async function cadastrar(
  _estadoAnterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCredenciais(formData);
  if (!email || !senha) return { erro: "Informe e-mail e senha." };
  if (senha.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password: senha });

  if (error) return { erro: error.message };

  // Com confirmação de e-mail ligada no Supabase, a sessão ainda não existe.
  if (!data.session) {
    return {
      aviso: "Conta criada. Confirme o e-mail (se o Supabase pedir) e depois entre.",
    };
  }

  redirect("/");
}
