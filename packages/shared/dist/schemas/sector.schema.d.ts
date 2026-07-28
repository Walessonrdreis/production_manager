import { z } from 'zod';
export declare const SectorSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    order: z.ZodNumber;
    active: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    order: number;
    active: boolean;
}, {
    id: string;
    name: string;
    order: number;
    active: boolean;
}>;
export type Sector = z.infer<typeof SectorSchema>;
export declare const CreateSectorInputSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
}, {
    name: string;
    order?: number | undefined;
}>;
export declare const UpdateSectorInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    order?: number | undefined;
    active?: boolean | undefined;
}, {
    name?: string | undefined;
    order?: number | undefined;
    active?: boolean | undefined;
}>;
