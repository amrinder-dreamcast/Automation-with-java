"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrivateIPv4 = isPrivateIPv4;
exports.isPrivateIPv6 = isPrivateIPv6;
exports.isPrivateOrReservedIp = isPrivateOrReservedIp;
exports.isDomainAllowed = isDomainAllowed;
exports.validateTargetUrl = validateTargetUrl;
const dns = __importStar(require("node:dns/promises"));
const net = __importStar(require("node:net"));
/**
 * Checks whether an IPv4 address belongs to private, loopback, link-local,
 * or cloud metadata IP ranges.
 */
function isPrivateIPv4(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
        return true; // Malformed IPv4 treated as blocked
    }
    const [p0, p1] = parts;
    // 0.0.0.0/8 (Current network)
    if (p0 === 0)
        return true;
    // 10.0.0.0/8 (Private RFC 1918)
    if (p0 === 10)
        return true;
    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127)
        return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127)
        return true;
    // 169.254.0.0/16 (Link-Local & Cloud Metadata e.g. 169.254.169.254)
    if (p0 === 169 && p1 === 254)
        return true;
    // 172.16.0.0/12 (Private RFC 1918)
    if (p0 === 172 && p1 >= 16 && p1 <= 31)
        return true;
    // 192.168.0.0/16 (Private RFC 1918)
    if (p0 === 192 && p1 === 168)
        return true;
    // 224.0.0.0/4 (Multicast)
    if (p0 >= 224 && p0 <= 239)
        return true;
    // 240.0.0.0/4 (Reserved / Future)
    if (p0 >= 240)
        return true;
    return false;
}
/**
 * Checks whether an IPv6 address is loopback, unique local, link-local, or IPv4 mapped.
 */
function isPrivateIPv6(ip) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::')
        return true;
    // IPv4-mapped IPv6: ::ffff:127.0.0.1 or ::ffff:7f00:1
    if (lower.startsWith('::ffff:')) {
        const v4Part = lower.replace('::ffff:', '');
        if (net.isIPv4(v4Part)) {
            return isPrivateIPv4(v4Part);
        }
        return true;
    }
    // Unique local addresses fc00::/7 (fc00:: to fdff::)
    if (lower.startsWith('fc') || lower.startsWith('fd'))
        return true;
    // Link-local unicast fe80::/10
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
        return true;
    }
    return false;
}
/**
 * Inspects any IP string (v4 or v6) for reserved/private allocations.
 */
function isPrivateOrReservedIp(ip) {
    const version = net.isIP(ip);
    if (version === 4)
        return isPrivateIPv4(ip);
    if (version === 6)
        return isPrivateIPv6(ip);
    return true; // Not a valid IP -> block
}
/**
 * Normalizes hostnames and determines if a candidate hostname matches allowed domain boundaries.
 */
function isDomainAllowed(candidateHostname, allowedDomains, allowSubdomains) {
    const targetHost = candidateHostname.toLowerCase();
    // If no allowed domains defined, only matching is not possible
    if (allowedDomains.length === 0)
        return false;
    for (const domain of allowedDomains) {
        const cleanDomain = domain.toLowerCase().trim();
        const rootDomain = cleanDomain.replace(/^www\./, '');
        const targetRoot = targetHost.replace(/^www\./, '');
        if (targetHost === cleanDomain || targetHost === rootDomain || targetRoot === rootDomain) {
            return true;
        }
        if (allowSubdomains && (targetHost.endsWith(`.${cleanDomain}`) || targetHost.endsWith(`.${rootDomain}`))) {
            return true;
        }
    }
    return false;
}
/**
 * Comprehensive SSRF validator for prospective target URLs and redirection hops.
 */
async function validateTargetUrl(rawUrl, scope) {
    try {
        const parsed = new URL(rawUrl);
        // Protocol check: strictly http and https
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return {
                allowed: false,
                reason: `Unsupported protocol '${parsed.protocol}'. Only 'http:' and 'https:' are permitted.`,
            };
        }
        const hostname = parsed.hostname;
        // Check for direct IP literal in target
        if (net.isIP(hostname)) {
            const isPrivate = isPrivateOrReservedIp(hostname);
            if (isPrivate && !scope.allowLocalTargets) {
                return {
                    allowed: false,
                    reason: `Access to private, loopback, or link-local IP '${hostname}' is prohibited.`,
                    resolvedIps: [hostname],
                };
            }
            return {
                allowed: true,
                resolvedIps: [hostname],
                canonicalUrl: parsed.origin + parsed.pathname,
            };
        }
        // Check domain boundary against permitted domains
        const domainsToCheck = scope.allowedDomains.length > 0
            ? scope.allowedDomains
            : [new URL(scope.primaryUrl).hostname];
        const domainMatches = isDomainAllowed(hostname, domainsToCheck, scope.allowSubdomains);
        if (!domainMatches && !scope.allowExternalLinks) {
            return {
                allowed: false,
                reason: `Target hostname '${hostname}' is outside the authorized project scope (${domainsToCheck.join(', ')}).`,
            };
        }
        // Resolve DNS to verify no DNS rebinding or private IP redirection
        try {
            const records = await dns.lookup(hostname, { all: true });
            const ips = records.map((r) => r.address);
            for (const ip of ips) {
                if (isPrivateOrReservedIp(ip)) {
                    if (!scope.allowLocalTargets) {
                        return {
                            allowed: false,
                            reason: `Host '${hostname}' resolved to prohibited private IP address ${ip}.`,
                            resolvedIps: ips,
                        };
                    }
                }
            }
            return {
                allowed: true,
                resolvedIps: ips,
                canonicalUrl: parsed.origin + parsed.pathname,
            };
        }
        catch (dnsErr) {
            return {
                allowed: false,
                reason: `DNS resolution failed for host '${hostname}': ${dnsErr.message}`,
            };
        }
    }
    catch (parseErr) {
        return {
            allowed: false,
            reason: `Malformed target URL: ${parseErr.message}`,
        };
    }
}
//# sourceMappingURL=ssrf-guard.js.map