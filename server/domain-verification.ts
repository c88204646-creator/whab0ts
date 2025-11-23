// Domain verification service for real-time validation

import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

export interface DomainVerificationResult {
  isValid: boolean;
  verified: boolean;
  error?: string;
  cname?: string;
  expectedCname: string;
}

const EXPECTED_CNAME = "api.surveys.app";
const VERIFICATION_TOKEN_PREFIX = "surveys-verify";

// Check if domain has valid CNAME record pointing to our service
export async function verifyDomainDNS(domain: string): Promise<DomainVerificationResult> {
  try {
    // Remove www or subdomain prefix if present
    const cleanDomain = domain.replace(/^(www|encuestas)\./, "");
    
    console.log(`[DNS Verify] Checking CNAME for: ${cleanDomain}`);
    
    try {
      const records = await resolveCname(cleanDomain);
      console.log(`[DNS Verify] CNAME records found:`, records);
      
      if (records && records.length > 0) {
        const foundCname = records[0];
        
        // Check if it matches our expected CNAME
        if (foundCname.includes("surveys.app") || foundCname === EXPECTED_CNAME) {
          console.log(`[DNS Verify] ✓ Valid CNAME found: ${foundCname}`);
          return {
            isValid: true,
            verified: true,
            cname: foundCname,
            expectedCname: EXPECTED_CNAME,
          };
        } else {
          return {
            isValid: false,
            verified: false,
            cname: foundCname,
            expectedCname: EXPECTED_CNAME,
            error: `CNAME incorrecto. Encontrado: ${foundCname}, Esperado: ${EXPECTED_CNAME}`,
          };
        }
      }
    } catch (cnameError: any) {
      console.log(`[DNS Verify] No CNAME found, checking TXT records...`);
      
      // Try TXT record verification as fallback
      try {
        const txtRecords = await resolveTxt(cleanDomain);
        console.log(`[DNS Verify] TXT records found:`, txtRecords);
        
        if (txtRecords && txtRecords.length > 0) {
          for (const record of txtRecords) {
            const txtValue = record.join("");
            if (txtValue.includes(VERIFICATION_TOKEN_PREFIX)) {
              console.log(`[DNS Verify] ✓ Valid TXT record found`);
              return {
                isValid: true,
                verified: true,
                expectedCname: EXPECTED_CNAME,
              };
            }
          }
        }
      } catch (txtError) {
        console.log(`[DNS Verify] TXT record check failed:`, txtError);
      }
    }
    
    return {
      isValid: false,
      verified: false,
      expectedCname: EXPECTED_CNAME,
      error: "No se encontró registro CNAME válido. Verifica tu configuración DNS.",
    };
  } catch (error: any) {
    console.error(`[DNS Verify] Error checking domain:`, error.message);
    return {
      isValid: false,
      verified: false,
      expectedCname: EXPECTED_CNAME,
      error: error.message || "Error verificando el dominio",
    };
  }
}

// Validate domain format
export function validateDomainFormat(domain: string): { valid: boolean; error?: string } {
  const trimmed = domain.trim().toLowerCase();
  
  // Basic domain validation
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  
  if (!domainRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Formato de dominio inválido. Usa: ejemplo.com",
    };
  }
  
  // Check for reserved TLDs
  const reservedTlds = [".local", ".localhost", ".test", ".example"];
  if (reservedTlds.some(tld => trimmed.endsWith(tld))) {
    return {
      valid: false,
      error: "Este dominio está reservado y no se puede usar",
    };
  }
  
  return { valid: true };
}

// Check if domain is already in use globally (quick check)
export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean;
  message?: string;
}> {
  try {
    // Try to resolve the domain - if it fails, it's available
    const cleanDomain = domain.replace(/^(www|encuestas)\./, "");
    
    try {
      // Quick DNS lookup to see if domain exists at all
      await resolveCname(cleanDomain).catch(() => null);
      // If we can resolve it, it might already be in use
      return {
        available: false,
        message: "Este dominio ya está en uso o tiene registros DNS activos",
      };
    } catch {
      // Domain doesn't resolve, which is good
      return { available: true };
    }
  } catch (error) {
    // On any error, we'll let the system proceed
    return { available: true };
  }
}
