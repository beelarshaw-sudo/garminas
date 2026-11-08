// Countries with currencies for global Ismaili matrimonial platform
// Base subscription price: 5,000 PKR/month

export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string; // emoji
  callingCode: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "PK", name: "Pakistan", currency: "PKR", currencySymbol: "₨", flag: "🇵🇰", callingCode: "+92" },
  { code: "IN", name: "India", currency: "INR", currencySymbol: "₹", flag: "🇮🇳", callingCode: "+91" },
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", flag: "🇺🇸", callingCode: "+1" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$", flag: "🇨🇦", callingCode: "+1" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", flag: "🇬🇧", callingCode: "+44" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", flag: "🇦🇪", callingCode: "+971" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", currencySymbol: "﷼", flag: "🇸🇦", callingCode: "+966" },
  { code: "QA", name: "Qatar", currency: "QAR", currencySymbol: "﷼", flag: "🇶🇦", callingCode: "+974" },
  { code: "KW", name: "Kuwait", currency: "KWD", currencySymbol: "د.ك", flag: "🇰🇼", callingCode: "+965" },
  { code: "BH", name: "Bahrain", currency: "BHD", currencySymbol: ".د.ب", flag: "🇧🇭", callingCode: "+973" },
  { code: "OM", name: "Oman", currency: "OMR", currencySymbol: "﷼", flag: "🇴🇲", callingCode: "+968" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$", flag: "🇦🇺", callingCode: "+61" },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "NZ$", flag: "🇳🇿", callingCode: "+64" },
  { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "€", flag: "🇩🇪", callingCode: "+49" },
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "€", flag: "🇫🇷", callingCode: "+33" },
  { code: "PT", name: "Portugal", currency: "EUR", currencySymbol: "€", flag: "🇵🇹", callingCode: "+351" },
  { code: "ES", name: "Spain", currency: "EUR", currencySymbol: "€", flag: "🇪🇸", callingCode: "+34" },
  { code: "IT", name: "Italy", currency: "EUR", currencySymbol: "€", flag: "🇮🇹", callingCode: "+39" },
  { code: "NL", name: "Netherlands", currency: "EUR", currencySymbol: "€", flag: "🇳🇱", callingCode: "+31" },
  { code: "BE", name: "Belgium", currency: "EUR", currencySymbol: "€", flag: "🇧🇪", callingCode: "+32" },
  { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "CHF", flag: "🇨🇭", callingCode: "+41" },
  { code: "SE", name: "Sweden", currency: "SEK", currencySymbol: "kr", flag: "🇸🇪", callingCode: "+46" },
  { code: "NO", name: "Norway", currency: "NOK", currencySymbol: "kr", flag: "🇳🇴", callingCode: "+47" },
  { code: "DK", name: "Denmark", currency: "DKK", currencySymbol: "kr", flag: "🇩🇰", callingCode: "+45" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", flag: "🇿🇦", callingCode: "+27" },
  { code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh", flag: "🇰🇪", callingCode: "+254" },
  { code: "TZ", name: "Tanzania", currency: "TZS", currencySymbol: "TSh", flag: "🇹🇿", callingCode: "+255" },
  { code: "UG", name: "Uganda", currency: "UGX", currencySymbol: "USh", flag: "🇺🇬", callingCode: "+256" },
  { code: "MZ", name: "Mozambique", currency: "MZN", currencySymbol: "MT", flag: "🇲🇿", callingCode: "+258" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "S$", flag: "🇸🇬", callingCode: "+65" },
  { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM", flag: "🇲🇾", callingCode: "+60" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥", flag: "🇯🇵", callingCode: "+81" },
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", flag: "🇺🇸", callingCode: "+1" },
];

// Fallback exchange rates (PKR to target currency) — used if the exchange rate API fails.
// In production, these should be fetched from a reliable API like exchangerate-api.com
// or openexchangerates.org and updated regularly.
export const FALLBACK_RATES: Record<string, number> = {
  PKR: 1,
  USD: 0.0036,
  EUR: 0.0033,
  GBP: 0.0028,
  CAD: 0.0049,
  AUD: 0.0055,
  AED: 0.0132,
  SAR: 0.0135,
  QAR: 0.0131,
  KWD: 0.0011,
  BHD: 0.00136,
  OMR: 0.00139,
  NZD: 0.0060,
  CHF: 0.0032,
  SEK: 0.038,
  NOK: 0.040,
  DKK: 0.025,
  ZAR: 0.065,
  KES: 0.46,
  TZS: 9.2,
  UGX: 13.2,
  MZN: 0.23,
  SGD: 0.0048,
  MYR: 0.017,
  JPY: 0.56,
  INR: 0.30,
};

export const BASE_PRICE_PKR = 5000;

export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getCurrencyForCountry(code: string): string {
  return getCountryByCode(code)?.currency ?? "PKR";
}

export function formatPrice(amount: number, currency: string, symbol: string): string {
  if (currency === "PKR") {
    return `${amount.toLocaleString("en-PK")} ${symbol}`;
  }
  const converted = Math.round(amount * (FALLBACK_RATES[currency] ?? FALLBACK_RATES.USD));
  return `${symbol}${converted.toLocaleString("en-US")}`;
}

/**
 * Fetch live exchange rates from a public API.
 * Falls back to static rates if the API is unavailable.
 * In production, use a reliable paid API with an API key.
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/PKR",
      { next: { revalidate: 3600 } } // cache for 1 hour
    );
    if (!res.ok) throw new Error("Exchange rate API failed");
    const data = await res.json();
    if (data.rates) {
      return { PKR: 1, ...data.rates };
    }
    throw new Error("No rates in response");
  } catch {
    // Fallback to static rates
    return FALLBACK_RATES;
  }
}
