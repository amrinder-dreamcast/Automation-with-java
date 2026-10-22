import { TargetScope } from './types.js';
export interface SecurityValidationResult {
    allowed: boolean;
    reason?: string;
    resolvedIps?: string[];
    canonicalUrl?: string;
}
/**
 * Checks whether an IPv4 address belongs to private, loopback, link-local,
 * or cloud metadata IP ranges.
 */
export declare function isPrivateIPv4(ip: string): boolean;
/**
 * Checks whether an IPv6 address is loopback, unique local, link-local, or IPv4 mapped.
 */
export declare function isPrivateIPv6(ip: string): boolean;
/**
 * Inspects any IP string (v4 or v6) for reserved/private allocations.
 */
export declare function isPrivateOrReservedIp(ip: string): boolean;
/**
 * Normalizes hostnames and determines if a candidate hostname matches allowed domain boundaries.
 */
export declare function isDomainAllowed(candidateHostname: string, allowedDomains: string[], allowSubdomains: boolean): boolean;
/**
 * Comprehensive SSRF validator for prospective target URLs and redirection hops.
 */
export declare function validateTargetUrl(rawUrl: string, scope: TargetScope): Promise<SecurityValidationResult>;
//# sourceMappingURL=ssrf-guard.d.ts.map