"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUS, type Status } from "@/lib/types";

export type EstadoForm = { erro?: string };

function vazioParaNulo(valor: string) {
  const t = valor.trim();
  return t.length ? t : null;
}

function lerDemanda(formData: FormData) {
  const statusBruto = String(formData.get("status") ?? "backlog");
  const status = (STATUS as readonly string[]).includes(statusBruto)
    ? (statusBruto as Status)
    : "backlog";

  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: vazioParaNulo(String(formData.get("descricao") ?? "")),
    cliente_id: vazioParaNulo(String(formData.get("cliente_id") ?? "")),
    responsavel_id: vazioParaNulo(String(formData.get("responsavel_id") ?? "")),
    status,
    data_inicio: vazioParaNulo(String(formData.get("data_inicio") ?? "")),
    data_fim: vazioParaNulo(String(formData.get("data_fim") ?? "")),
  };
}

export async function criarDemanda(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const dados = lerDemanda(formData);
  if (!dados.titulo) return { erro: "Informe o título." };

  if (dados.data_inicio && dados.data_fim && dados.data_fim < dados.data_inicio) {
    return { erro: "A data fim precisa ser igual ou depois da data início." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("demandas").insert(dados);

  if (error) return { erro: error.message };

  revalidatePath("/demandas");
  return {};
}

export async function salvarDemanda(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const id = String(formData.get("id") ?? "");
  const dados = lerDemanda(formData);
  if (!dados.titulo) return { erro: "Informe o título." };

  if (dados.data_inicio && dados.data_fim && dados.data_fim < dados.data_inicio) {
    return { erro: "A data fim precisa ser igual ou depois da data início." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("demandas").update(dados).eq("id", id);

  if (error) return { erro: error.message };

  revalidatePath("/demandas");
  return {};
}

export async function excluirDemanda(
  _estadoAnterior: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("demandas")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { erro: error.message };

  revalidatePath("/demandas");
  return {};
}
