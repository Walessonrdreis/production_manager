export type CustomerView = "summary" | "data";

export type GetCustomerQueryDTO = {
    view?: CustomerView;
    q?: string | null;
    activeOnly?: boolean;
    customerCodes?: string[] | null;
    document?: string | null;
    limit?: number;
    offset?: number;
    sort?: "legalName" | "customerCode" | "document" | "lastSyncAt";
    order?: "asc" | "desc";
    since?: string | null;
    fields?: string[] | null;
    includeRaw?: boolean;
};

export type CustomerItemDTO = {
    customerCode: string;
    legalName: string;
    tradeName: string | null;
    document: string;
    personType: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    isBlocked: boolean;
    isBillingBlocked: boolean;
    createdAtOmie: Date | null;
    updatedAtOmie: Date | null;
    lastSyncAt: Date;
};

export type CustomerSummaryDTO = {
    total: number;
    active: number;
    inactive: number;
};

export type GetCustomerResponseDTO = {
    summary?: CustomerSummaryDTO;
    data?: CustomerItemDTO[];
    meta?: {
        pageSize: number;
        pageCount: number;
        offset: number;
    };
};
