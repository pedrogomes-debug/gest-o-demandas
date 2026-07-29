"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string };

const COR_PADRAO = "#6B7280";

export async function criarCliente(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .insert({ nome, cor: String(formData.get("cor") ?? COR_PADRAO) });

  if (error) return { erro: error.message };

  revalidatePath("/clientes");
  return {};
}

export async function salvarCliente(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nome,
      cor: String(formData.get("cor") ?? COR_PADRAO),
      ativo: formData.get("ativo") === "on",
    })
    .eq("id", id);

  if (error) return { erro: error.message };

  revalidatePath("/clientes");
  return {};
}

export async function excluirCliente(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { erro: error.message };

  revalidatePath("/clientes");
  return {};
}
