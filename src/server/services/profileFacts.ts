// Port of backend/studio/services/profile_facts.py — business profile fact
// extraction for generation services.
export function businessFacts(profile: Record<string, unknown> | null | undefined): string {
  const business = (isPlainObject(profile?.business) ? profile!.business : {}) as Record<string, unknown>;
  const facts: string[] = [];
  if (business.type) facts.push(`- Business type: ${business.type}`);
  if (business.description) facts.push(`- Description: ${business.description}`);
  const services = business.services;
  if (Array.isArray(services) && services.length > 0) {
    facts.push(`- Services: ${services.slice(0, 6).join(", ")}`);
  }
  if (business.targetAudience) facts.push(`- Target audience: ${business.targetAudience}`);
  return facts.join("\n");
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
