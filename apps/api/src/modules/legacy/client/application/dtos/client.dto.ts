export type PersonType = 'INDIVIDUAL' | 'COMPANY';

export interface Client {
  omieClientCode: bigint;

  legalName: string;
  tradeName?: string | null;
  document: string;

  personType: PersonType;

  email?: string | null;
  phone?: string | null;

  isActive: boolean;
  isBlocked: boolean;
  isBillingBlocked: boolean;

  createdAtOmie?: Date | null;
  updatedAtOmie?: Date | null;
}
``