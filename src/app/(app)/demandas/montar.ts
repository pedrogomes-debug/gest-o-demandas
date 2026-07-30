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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      erro:
        "Falta OPENAI_API_KEY no ambiente (Vercel → Environment Variables, e .env.local no seu Mac).",
    };
  }

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
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: pedido },
        ],
      }),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      return {
        ok: false,
        erro: `OpenAI falhou (${resposta.status}): ${corpo.slice(0, 200)}`,
      };
    }

    const json = (await resposta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const bruto = json.choices?.[0]?.message?.content;
    if (!bruto) return { ok: false, erro: "A IA não devolveu conteúdo." };

    const parseado = JSON.parse(bruto) as Partial<RascunhoDemanda>;
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

function normalizarData(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}
