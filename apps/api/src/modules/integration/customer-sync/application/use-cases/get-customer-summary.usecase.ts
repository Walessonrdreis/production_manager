import { prisma } from "@/shared/db/prisma";
import { mapOmieCustomerToSummary } from "../mappers/map-omie-customer-to-summary";

export class GetCustomerSummaryUseCase {
    async execute() {
        const rows = await prisma.omieCustomer.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                legalName: "asc",
            },
            select: {
                omieCode: true,
                legalName: true,
                tradeName: true,
                document: true,
                personType: true,
                email: true,
                phone: true,
                isActive: true,
                isBlocked: true,
                lastSyncAt: true,
                rawPayload: true,
            },
        });

        return rows.map(mapOmieCustomerToSummary);
    }
}
