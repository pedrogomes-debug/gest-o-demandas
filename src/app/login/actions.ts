"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { erro?: string; enviado?: boolean };

export async function enviarLink(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) return { erro: "Informe o e-mail." };

  const cabecalhos = await headers();
  const origem =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${cabecalhos.get("x-forwarded-proto") ?? "http"}://${cabecalhos.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origem}/auth/callback`,
      // Cadastro é por convite no painel do Supabase. Sem isso, qualquer
      // e-mail digitado aqui viraria uma conta nova.
      shouldCreateUser: false,
    },
  });

  if (error) return { erro: error.message };

  return { enviado: true };
}
