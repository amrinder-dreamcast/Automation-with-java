import { z } from 'zod';
export declare const TargetScopeSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    projectId: z.ZodString;
    primaryUrl: z.ZodString;
    allowedDomains: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allowSubdomains: z.ZodDefault<z.ZodBoolean>;
    allowExternalLinks: z.ZodDefault<z.ZodBoolean>;
    maxCrawlDepth: z.ZodDefault<z.ZodNumber>;
    maxPages: z.ZodDefault<z.ZodNumber>;
    crawlTimeoutMs: z.ZodDefault<z.ZodNumber>;
    allowLocalTargets: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    projectId: string;
    primaryUrl: string;
    allowedDomains: string[];
    allowSubdomains: boolean;
    allowExternalLinks: boolean;
    maxCrawlDepth: number;
    maxPages: number;
    crawlTimeoutMs: number;
    allowLocalTargets: boolean;
}, {
    projectId: string;
    primaryUrl: string;
    id?: string | undefined;
    allowedDomains?: string[] | undefined;
    allowSubdomains?: boolean | undefined;
    allowExternalLinks?: boolean | undefined;
    maxCrawlDepth?: number | undefined;
    maxPages?: number | undefined;
    crawlTimeoutMs?: number | undefined;
    allowLocalTargets?: boolean | undefined;
}>;
export declare const CreateProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    primaryUrl: z.ZodString;
    allowedDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allowSubdomains: z.ZodDefault<z.ZodBoolean>;
    maxPages: z.ZodDefault<z.ZodNumber>;
    allowLocalTargets: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    primaryUrl: string;
    allowSubdomains: boolean;
    maxPages: number;
    allowLocalTargets: boolean;
    name: string;
    allowedDomains?: string[] | undefined;
    description?: string | undefined;
}, {
    primaryUrl: string;
    name: string;
    allowedDomains?: string[] | undefined;
    allowSubdomains?: boolean | undefined;
    maxPages?: number | undefined;
    allowLocalTargets?: boolean | undefined;
    description?: string | undefined;
}>;
export declare const TriggerTestRunSchema: z.ZodObject<{
    projectId: z.ZodString;
    primaryUrl: z.ZodOptional<z.ZodString>;
    engines: z.ZodDefault<z.ZodObject<{
        functional: z.ZodDefault<z.ZodBoolean>;
        visual: z.ZodDefault<z.ZodBoolean>;
        accessibility: z.ZodDefault<z.ZodBoolean>;
        performance: z.ZodDefault<z.ZodBoolean>;
        security: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        functional: boolean;
        visual: boolean;
        accessibility: boolean;
        performance: boolean;
        security: boolean;
    }, {
        functional?: boolean | undefined;
        visual?: boolean | undefined;
        accessibility?: boolean | undefined;
        performance?: boolean | undefined;
        security?: boolean | undefined;
    }>>;
    maxPages: z.ZodOptional<z.ZodNumber>;
    allowLocalTargets: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    engines: {
        functional: boolean;
        visual: boolean;
        accessibility: boolean;
        performance: boolean;
        security: boolean;
    };
    primaryUrl?: string | undefined;
    maxPages?: number | undefined;
    allowLocalTargets?: boolean | undefined;
}, {
    projectId: string;
    primaryUrl?: string | undefined;
    maxPages?: number | undefined;
    allowLocalTargets?: boolean | undefined;
    engines?: {
        functional?: boolean | undefined;
        visual?: boolean | undefined;
        accessibility?: boolean | undefined;
        performance?: boolean | undefined;
        security?: boolean | undefined;
    } | undefined;
}>;
export declare const UpdateDefectStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "INVESTIGATING", "RESOLVED", "IGNORED"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED";
    notes?: string | undefined;
}, {
    status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED";
    notes?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map