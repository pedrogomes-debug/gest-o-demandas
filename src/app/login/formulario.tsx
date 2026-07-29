"use client";

import { useActionState, useState } from "react";
import { cadastrar, entrar, type EstadoAuth } from "./actions";

const ESTADO_INICIAL: EstadoAuth = {};

export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [estadoEntrar, acaoEntrar, entrando] = useActionState(entrar, ESTADO_INICIAL);
  const [estadoCadastrar, acaoCadastrar, cadastrando] = useActionState(
    cadastrar,
    ESTADO_INICIAL,
  );

  const pendente = entrando || cadastrando;
  const estado = modo === "entrar" ? estadoEntrar : estadoCadastrar;
  const erro = estado.erro ?? erroInicial;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setModo("entrar")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
            modo === "entrar" ? "bg-white font-medium text-neutral-900 shadow-sm" : "text-neutral-500"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setModo("cadastrar")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
            modo === "cadastrar"
              ? "bg-white font-medium text-neutral-900 shadow-sm"
              : "text-neutral-500"
          }`}
        >
          Cadastrar
        </button>
      </div>

      <form action={modo === "entrar" ? acaoEntrar : acaoCadastrar} className="space-y-4">
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

        <div className="space-y-1.5">
          <label htmlFor="senha" className="block text-sm font-medium text-neutral-700">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            placeholder="mínimo 6 caracteres"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {estado.aviso && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{estado.aviso}</p>
        )}

        <button
          type="submit"
          disabled={pendente}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pendente
            ? modo === "entrar"
              ? "Entrando…"
              : "Cadastrando…"
            : modo === "entrar"
              ? "Entrar"
              : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
