"use client";

import { useActionState } from "react";
import { enviarLink, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const [estado, acao, pendente] = useActionState(enviarLink, ESTADO_INICIAL);
  const erro = estado.erro ?? erroInicial;

  if (estado.enviado) {
    return (
      <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Link enviado. Abra o e-mail neste mesmo navegador para entrar.
      </p>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="voce@empresa.com"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pendente ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
