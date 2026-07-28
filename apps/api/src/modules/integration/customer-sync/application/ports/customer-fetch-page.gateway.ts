import type { CustomerExternalCustomer } from "./customer-fetch.gateway";

export type CustomerFetchPageInput = {
    page: number;
    pageSize: number;
    updatedSince?: Date;
};

export type CustomerFetchPageResult = {
    items: CustomerExternalCustomer[];
    totalPages: number;
    currentPage: number;
    totalRecords: number;
    hasNext: boolean;
};

export interface CustomerFetchPageGateway {
    fetchPage(input: CustomerFetchPageInput): Promise<CustomerFetchPageResult>;
}
