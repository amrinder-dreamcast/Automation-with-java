"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDefectStatusSchema = exports.TriggerTestRunSchema = exports.CreateProjectSchema = exports.TargetScopeSchema = void 0;
const zod_1 = require("zod");
exports.TargetScopeSchema = zod_1.z.object({
    id: zod_1.z.string().default(() => Math.random().toString(36).substring(2, 11)),
    projectId: zod_1.z.string(),
    primaryUrl: zod_1.z.string().url(),
    allowedDomains: zod_1.z.array(zod_1.z.string()).default([]),
    allowSubdomains: zod_1.z.boolean().default(true),
    allowExternalLinks: zod_1.z.boolean().default(false),
    maxCrawlDepth: zod_1.z.number().int().min(1).max(10).default(3),
    maxPages: zod_1.z.number().int().min(1).max(100).default(25),
    crawlTimeoutMs: zod_1.z.number().int().min(5000).max(120000).default(30000),
    allowLocalTargets: zod_1.z.boolean().default(false),
});
exports.CreateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().max(500).optional(),
    primaryUrl: zod_1.z.string().url(),
    allowedDomains: zod_1.z.array(zod_1.z.string()).optional(),
    allowSubdomains: zod_1.z.boolean().default(true),
    maxPages: zod_1.z.number().int().min(1).max(50).default(15),
    allowLocalTargets: zod_1.z.boolean().default(false),
});
exports.TriggerTestRunSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    primaryUrl: zod_1.z.string().url().optional(),
    engines: zod_1.z.object({
        functional: zod_1.z.boolean().default(true),
        visual: zod_1.z.boolean().default(true),
        accessibility: zod_1.z.boolean().default(true),
        performance: zod_1.z.boolean().default(true),
        security: zod_1.z.boolean().default(true),
    }).default({
        functional: true,
        visual: true,
        accessibility: true,
        performance: true,
        security: true,
    }),
    maxPages: zod_1.z.number().int().min(1).max(50).optional(),
    allowLocalTargets: zod_1.z.boolean().optional(),
});
exports.UpdateDefectStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED']),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map