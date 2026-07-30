"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { botao, botaoDiscreto, campo } from "@/components/estilos";
import {
  STATUS,
  STATUS_LABEL,
  type Cliente,
  type DemandaView,
  type Pessoa,
  type Status,
} from "@/lib/types";
import { excluirDemanda, salvarDemanda } from "../demandas/actions";

type Opcoes = {
  clientes: Pick<Cliente, "id" | "nome" | "cor">[];
  pessoas: Pick<Pessoa, "id" | "nome">[];
};

function lerFormulario(
  formData: FormData,
  demanda: DemandaView,
  clientes: Opcoes["clientes"],
  pessoas: Opcoes["pessoas"],
): DemandaView {
  const clienteId = String(formData.get("cliente_id") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || null;
  const statusBruto = String(formData.get("status") ?? demanda.status);
  const status = (STATUS as readonly string[]).includes(statusBruto)
    ? (statusBruto as Status)
    : demanda.status;
  const cliente = clientes.find((c) => c.id === clienteId);
  const pessoa = pessoas.find((p) => p.id === responsavelId);

  return {
    ...demanda,
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    cliente_id: clienteId,
    responsavel_id: responsavelId,
    status,
    data_inicio: String(formData.get("data_inicio") ?? "") || null,
    data_fim: String(formData.get("data_fim") ?? "") || null,
    cliente_nome: cliente?.nome ?? null,
    cliente_cor: cliente?.cor ?? null,
    responsavel_nome: pessoa?.nome ?? null,
  };
}

export function ModalDemanda({
  demanda,
  clientes,
  pessoas,
  onFechar,
  onSalvou,
  onExcluiu,
}: Opcoes & {
  demanda: DemandaView;
  onFechar: () => void;
  onSalvou: (demanda: DemandaView) => void;
  onExcluiu: (id: string) => void;
}) {
  const tituloId = useId();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);

  function aoSalvar(formData: FormData) {
    setErro(null);
    const atualizada = lerFormulario(formData, demanda, clientes, pessoas);
    if (!atualizada.titulo) {
      setErro("Informe o título.");
      return;
    }

    startTransition(async () => {
      const resultado = await salvarDemanda({}, formData);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      onSalvou(atualizada);
      onFechar();
    });
  }

  function aoExcluir(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const resultado = await excluirDemanda({}, formData);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      onExcluiu(demanda.id);
      onFechar();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={tituloId} className="text-lg font-semibold text-neutral-900">
            Detalhes da demanda
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="text-sm text-neutral-400 hover:text-neutral-700"
          >
            Fechar
          </button>
        </div>

        <form action={aoSalvar} className="space-y-3">
          <input type="hidden" name="id" value={demanda.id} />

          <div className="space-y-1">
            <label htmlFor="titulo" className="block text-xs font-medium text-neutral-500">
              Título
            </label>
            <input
              id="titulo"
              name="titulo"
              required
              defaultValue={demanda.titulo}
              className={campo}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="descricao" className="block text-xs font-medium text-neutral-500">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={4}
              defaultValue={demanda.descricao ?? ""}
              className={campo}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="cliente_id" className="block text-xs font-medium text-neutral-500">
                Cliente
              </label>
              <select
                id="cliente_id"
                name="cliente_id"
                defaultValue={demanda.cliente_id ?? ""}
                className={campo}
              >
                <option value="">—</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="responsavel_id"
                className="block text-xs font-medium text-neutral-500"
              >
                Responsável
              </label>
              <select
                id="responsavel_id"
                name="responsavel_id"
                defaultValue={demanda.responsavel_id ?? ""}
                className={campo}
              >
                <option value="">—</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="status" className="block text-xs font-medium text-neutral-500">
                Status
              </label>
              <select id="status" name="status" defaultValue={demanda.status} className={campo}>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="data_inicio" className="block text-xs font-medium text-neutral-500">
                Início
              </label>
              <input
                id="data_inicio"
                name="data_inicio"
                type="date"
                defaultValue={demanda.data_inicio ?? ""}
                className={campo}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="data_fim" className="block text-xs font-medium text-neutral-500">
                Fim
              </label>
              <input
                id="data_fim"
                name="data_fim"
                type="date"
                defaultValue={demanda.data_fim ?? ""}
                className={campo}
              />
            </div>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              formAction={aoExcluir}
              type="submit"
              disabled={pendente}
              className={`${botaoDiscreto} hover:text-red-600`}
              onClick={(e) => {
                if (!confirm("Excluir esta demanda?")) e.preventDefault();
              }}
            >
              Excluir
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={onFechar} className={botaoDiscreto} disabled={pendente}>
                Cancelar
              </button>
              <button type="submit" disabled={pendente} className={botao}>
                {pendente ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
