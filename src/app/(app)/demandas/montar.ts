"use server";

import { STATUS, type Status } from "@/lib/types";

export type RascunhoDemanda = {
  titulo: string;
  descricao: string | null;
  status: Status;
  data_inicio: string | null;
  data_fim: string | null;
  cliente_nome: string | null;
  responsavel_nome: string | null;
};

export type ResultadoMontagem =
  | { ok: true; rascunho: RascunhoDemanda }
  | { ok: false; erro: string };

type Contexto = {
  clientes: string[];
  pessoas: string[];
};

export async function montarDemandaPorTexto(
  texto: string,
  contexto: Contexto,
): Promise<ResultadoMontagem> {
  const pedido = texto.trim();
  if (!pedido) return { ok: false, erro: "Escreva o que precisa ser feito." };
  if (pedido.length > 2000) return { ok: false, erro: "Texto muito longo (máx. 2000 caracteres)." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      erro:
        "Falta ANTHROPIC_API_KEY no ambiente (Vercel → Environment Variables). Pegue em https://console.anthropic.com/settings/keys",
    };
  }

  const modelo = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
  const hoje = new Date().toISOString().slice(0, 10);

  const system = `Você extrai campos de uma demanda de trabalho a partir de texto em português.
Responda APENAS com JSON válido, sem markdown, neste formato:
{
  "titulo": string,
  "descricao": string|null,
  "status": "backlog"|"fazendo"|"revisao"|"entregue",
  "data_inicio": "YYYY-MM-DD"|null,
  "data_fim": "YYYY-MM-DD"|null,
  "cliente_nome": string|null,
  "responsavel_nome": string|null
}

Regras:
- titulo curto e claro.
- descricao pode expandir o pedido; null se não houver detalhe útil.
- status padrão "backlog", a menos que o texto diga o contrário.
- datas relativas ("amanhã", "semana que vem", "até sexta") devem virar YYYY-MM-DD. Hoje é ${hoje}.
- cliente_nome e responsavel_nome devem preferir nomes da lista abaixo (match aproximado). Se não houver match, use o nome citado ou null.
- Clientes conhecidos: ${JSON.stringify(contexto.clientes)}
- Pessoas conhecidas: ${JSON.stringify(contexto.pessoas)}`;

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 1024,
        temperature: 0.2,
        system,
        messages: [{ role: "user", content: pedido }],
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      return {
        ok: false,
        erro: `Claude falhou (${resposta.status}): ${corpo.slice(0, 240)}`,
      };
    }

    const json = (await resposta.json()) as {
      content?: { type: string; text?: string }[];
    };
    const bruto =
      json.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("") ?? "";
    if (!bruto) return { ok: false, erro: "O Claude não devolveu conteúdo." };

    const parseado = JSON.parse(limparJson(bruto)) as Partial<RascunhoDemanda>;
    const status = (STATUS as readonly string[]).includes(String(parseado.status))
      ? (parseado.status as Status)
      : "backlog";

    return {
      ok: true,
      rascunho: {
        titulo: String(parseado.titulo ?? "").trim() || pedido.slice(0, 80),
        descricao: parseado.descricao ? String(parseado.descricao).trim() : null,
        status,
        data_inicio: normalizarData(parseado.data_inicio),
        data_fim: normalizarData(parseado.data_fim),
        cliente_nome: parseado.cliente_nome ? String(parseado.cliente_nome).trim() : null,
        responsavel_nome: parseado.responsavel_nome
          ? String(parseado.responsavel_nome).trim()
          : null,
      },
    };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Falha ao montar a demanda.",
    };
  }
}

function limparJson(bruto: string) {
  const t = bruto.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return t;
}

function normalizarData(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}
