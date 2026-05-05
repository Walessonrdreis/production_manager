export interface OmieClientRaw {
  codigo_cliente_omie: number;
  razao_social: string;
  nome_fantasia?: string;
  cnpj_cpf: string;
  pessoa_fisica: 'S' | 'N';
  email?: string;
  telefone1_ddd?: string;
  telefone1_numero?: string;
  bloqueado: 'S' | 'N';
  bloquear_faturamento: 'S' | 'N';
  inativo: 'S' | 'N';
  info?: {
    dInc?: string;
    hInc?: string;
    dAlt?: string;
    hAlt?: string;
  };
}

export interface OmieClientGateway {
  listClients(page: number): Promise<OmieClientRaw[]>;
}
``