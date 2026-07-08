export type CallType = "domestic" | "international";

export type CountryOption = {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
};

export const COUNTRIES: CountryOption[] = [
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳", minDigits: 10, maxDigits: 10 },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸", minDigits: 10, maxDigits: 10 },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦", minDigits: 10, maxDigits: 10 },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧", minDigits: 10, maxDigits: 11 },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺", minDigits: 9, maxDigits: 9 },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪", minDigits: 10, maxDigits: 11 },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷", minDigits: 9, maxDigits: 9 },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪", minDigits: 9, maxDigits: 9 },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬", minDigits: 8, maxDigits: 8 },
  { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵", minDigits: 10, maxDigits: 10 },
];

export const DEFAULT_COUNTRY =
  COUNTRIES.find((c) => c.code === "IN") ?? COUNTRIES[0];

export function getCountryByCode(code: string): CountryOption {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}

export function formatDomesticNumber(digits: string, country: CountryOption = DEFAULT_COUNTRY): string {
  const d = digits.replace(/\D/g, "").slice(0, country.maxDigits);
  if (d.length === 0) return "";

  if (country.code === "IN") {
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)} ${d.slice(5)}`;
  }

  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function formatInternationalNumber(digits: string, country: CountryOption): string {
  const d = digits.replace(/\D/g, "").slice(0, country.maxDigits);
  if (d.length === 0) return country.dialCode;
  return `${country.dialCode} ${d}`;
}

export function getFullNumber(
  callType: CallType,
  nationalDigits: string,
  country: CountryOption
): string {
  const digits = nationalDigits.replace(/\D/g, "");
  return `${country.dialCode.replace("+", "")}${digits}`;
}

export function formatDisplayNumber(
  callType: CallType,
  nationalDigits: string,
  country: CountryOption
): string {
  const digits = nationalDigits.replace(/\D/g, "");
  if (digits.length === 0) {
    return `${country.dialCode} `;
  }
  if (callType === "domestic") {
    return `${country.dialCode} ${formatDomesticNumber(digits, country)}`;
  }
  return formatInternationalNumber(digits, country);
}

export function isValidNumber(
  callType: CallType,
  nationalDigits: string,
  country: CountryOption
): boolean {
  const len = nationalDigits.replace(/\D/g, "").length;
  return len >= country.minDigits && len <= country.maxDigits;
}

export function getCallTypeLabel(callType: CallType, country: CountryOption): string {
  if (callType === "domestic") return `Domestic (${country.name})`;
  return `International (${country.name})`;
}

export function getMaxDigits(callType: CallType, country: CountryOption): number {
  return country.maxDigits;
}
