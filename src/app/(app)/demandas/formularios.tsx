"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { botao, botaoDiscreto, campo } from "@/components/estilos";
import {
  STATUS,
  STATUS_LABEL,
  type Cliente,
  type DemandaView,
  type Pessoa,
  type Status,
} from "@/lib/types";
import { criarDemanda, excluirDemanda, salvarDemanda, type EstadoForm } from "./actions";
import { montarDemandaPorTexto } from "./montar";

const ESTADO_INICIAL: EstadoForm = {};

type Opcoes = {
  clientes: Pick<Cliente, "id" | "nome">[];
  pessoas: Pick<Pessoa, "id" | "nome">[];
};

function acharIdPorNome(lista: { id: string; nome: string }[], nome: string | null) {
  if (!nome) return "";
  const alvo = nome.trim().toLowerCase();
  const exato = lista.find((item) => item.nome.toLowerCase() === alvo);
  if (exato) return exato.id;
  const parcial = lista.find(
    (item) =>
      item.nome.toLowerCase().includes(alvo) || alvo.includes(item.nome.toLowerCase()),
  );
  return parcial?.id ?? "";
}

export function NovaDemanda({ clientes, pessoas }: Opcoes) {
  const [estado, acao, pendente] = useActionState(criarDemanda, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  const [textoNatural, setTextoNatural] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [status, setStatus] = useState<Status>("backlog");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [erroIa, setErroIa] = useState<string | null>(null);
  const [montando, startMontar] = useTransition();

  function limparCampos() {
    setTextoNatural("");
    setTitulo("");
    setDescricao("");
    setClienteId("");
    setResponsavelId("");
    setStatus("backlog");
    setDataInicio("");
    setDataFim("");
    setErroIa(null);
  }

  function montar() {
    setErroIa(null);
    startMontar(async () => {
      const resultado = await montarDemandaPorTexto(textoNatural, {
        clientes: clientes.map((c) => c.nome),
        pessoas: pessoas.map((p) => p.nome),
      });

      if (!resultado.ok) {
        setErroIa(resultado.erro);
        return;
      }

      const { rascunho } = resultado;
      setTitulo(rascunho.titulo);
      setDescricao(rascunho.descricao ?? "");
      setStatus(rascunho.status);
      setDataInicio(rascunho.data_inicio ?? "");
      setDataFim(rascunho.data_fim ?? "");
      setClienteId(acharIdPorNome(clientes, rascunho.cliente_nome));
      setResponsavelId(acharIdPorNome(pessoas, rascunho.responsavel_nome));
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-2">
        <label htmlFor="texto-natural" className="block text-sm font-medium text-neutral-800">
          Criar por linguagem natural
        </label>
        <textarea
          id="texto-natural"
          value={textoNatural}
          onChange={(e) => setTextoNatural(e.target.value)}
          rows={3}
          placeholder='Ex.: "Landing page do Cliente Exemplo A, com Pedro, começando amanhã e entregando na sexta, em revisão"'
          className={campo}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={montar}
            disabled={montando || !textoNatural.trim()}
            className={botao}
          >
            {montando ? "Montando…" : "Montar tarefa"}
          </button>
          <span className="text-xs text-neutral-400">
            Preenche os campos abaixo. Você revisa e clica em Adicionar.
          </span>
        </div>
        {erroIa && <p className="text-sm text-red-600">{erroIa}</p>}
      </div>

      <form
        ref={formulario}
        action={async (formData) => {
          await acao(formData);
          // Limpa os campos controlados; se deu erro, o usuário digita de novo.
          limparCampos();
        }}
        className="grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          name="titulo"
          placeholder="Título da demanda"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={`${campo} sm:col-span-2`}
        />
        <select
          name="cliente_id"
          className={campo}
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
        >
          <option value="">Cliente (opcional)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          name="responsavel_id"
          className={campo}
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
        >
          <option value="">Responsável (opcional)</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <select
          name="status"
          className={campo}
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          name="data_inicio"
          type="date"
          className={campo}
          aria-label="Data início"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <input
          name="data_fim"
          type="date"
          className={campo}
          aria-label="Data fim"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
        <textarea
          name="descricao"
          placeholder="Descrição (opcional)"
          rows={2}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={`${campo} sm:col-span-2 lg:col-span-4`}
        />
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" disabled={pendente} className={botao}>
            Adicionar demanda
          </button>
          {estado.erro && <span className="text-sm text-red-600">{estado.erro}</span>}
        </div>
      </form>
    </div>
  );
}

export function LinhaDemanda({
  demanda,
  clientes,
  pessoas,
}: Opcoes & { demanda: DemandaView }) {
  const [estadoSalvar, salvar, salvando] = useActionState(salvarDemanda, ESTADO_INICIAL);
  const [estadoExcluir, excluir, excluindo] = useActionState(excluirDemanda, ESTADO_INICIAL);
  const erro = estadoSalvar.erro ?? estadoExcluir.erro;
  const formId = `salvar-${demanda.id}`;

  return (
    <tr className="border-t border-neutral-200 align-top">
      <td className="px-3 py-2">
        <form id={formId} action={salvar} className="space-y-2">
          <input type="hidden" name="id" value={demanda.id} />
          <input name="titulo" defaultValue={demanda.titulo} className={campo} />
          <textarea
            name="descricao"
            defaultValue={demanda.descricao ?? ""}
            rows={2}
            className={campo}
            placeholder="Descrição"
          />
        </form>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>

      <td className="px-3 py-2">
        <select
          form={formId}
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
      </td>

      <td className="px-3 py-2">
        <select
          form={formId}
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
      </td>

      <td className="px-3 py-2">
        <select form={formId} name="status" defaultValue={demanda.status} className={campo}>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <div className="space-y-2">
          <input
            form={formId}
            name="data_inicio"
            type="date"
            defaultValue={demanda.data_inicio ?? ""}
            className={campo}
          />
          <input
            form={formId}
            name="data_fim"
            type="date"
            defaultValue={demanda.data_fim ?? ""}
            className={campo}
          />
        </div>
      </td>

      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button form={formId} type="submit" disabled={salvando} className={botaoDiscreto}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <form action={excluir} className="inline">
          <input type="hidden" name="id" value={demanda.id} />
          <button
            type="submit"
            disabled={excluindo}
            className={`${botaoDiscreto} hover:text-red-600`}
          >
            Excluir
          </button>
        </form>
      </td>
    </tr>
  );
}
