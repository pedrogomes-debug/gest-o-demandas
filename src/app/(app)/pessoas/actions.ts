"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string };

function mensagem(codigo: string | undefined, padrao: string) {
  return codigo === "23505" ? "Já existe uma pessoa com esse e-mail." : padrao;
}

function ler(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    papel: String(formData.get("papel") ?? "").trim() || null,
  };
}

export async function criarPessoa(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { nome, email, papel } = ler(formData);
  if (!nome || !email) return { erro: "Nome e e-mail são obrigatórios." };

  const supabase = await createClient();
  const { error } = await supabase.from("pessoas").insert({ nome, email, papel });

  if (error) return { erro: mensagem(error.code, error.message) };

  revalidatePath("/pessoas");
  return {};
}

export async function salvarPessoa(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { nome, email, papel } = ler(formData);
  if (!nome || !email) return { erro: "Nome e e-mail são obrigatórios." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pessoas")
    .update({ nome, email, papel, ativo: formData.get("ativo") === "on" })
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { erro: mensagem(error.code, error.message) };

  revalidatePath("/pessoas");
  return {};
}

export async function excluirPessoa(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pessoas")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { erro: error.message };

  revalidatePath("/pessoas");
  return {};
}
