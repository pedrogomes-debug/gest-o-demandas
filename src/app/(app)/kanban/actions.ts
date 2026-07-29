"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUS, type Status } from "@/lib/types";

export async function moverDemanda(input: {
  id: string;
  status: Status;
  ordem: number;
}): Promise<{ erro?: string }> {
  if (!(STATUS as readonly string[]).includes(input.status)) {
    return { erro: "Status inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("demandas")
    .update({ status: input.status, ordem: input.ordem })
    .eq("id", input.id);

  if (error) return { erro: error.message };

  revalidatePath("/kanban");
  revalidatePath("/demandas");
  revalidatePath("/gantt");
  return {};
}
