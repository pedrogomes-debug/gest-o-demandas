export const STATUS = ["backlog", "fazendo", "revisao", "entregue"] as const;

export type Status = (typeof STATUS)[number];

export const STATUS_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  fazendo: "Fazendo",
  revisao: "Revisão",
  entregue: "Entregue",
};

export type Cliente = {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  created_at: string;
};

export type Pessoa = {
  id: string;
  nome: string;
  email: string;
  papel: string | null;
  ativo: boolean;
  user_id: string | null;
  created_at: string;
};

export type Demanda = {
  id: string;
  titulo: string;
  descricao: string | null;
  cliente_id: string | null;
  responsavel_id: string | null;
  status: Status;
  data_inicio: string | null;
  data_fim: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
};

/** Linha de `v_demandas`: demanda já com nome e cor do cliente resolvidos. */
export type DemandaView = Pick<
  Demanda,
  | "id"
  | "titulo"
  | "descricao"
  | "status"
  | "data_inicio"
  | "data_fim"
  | "ordem"
  | "updated_at"
  | "cliente_id"
  | "responsavel_id"
> & {
  cliente_nome: string | null;
  cliente_cor: string | null;
  responsavel_nome: string | null;
};
