import { NextResponse } from "next/server";
import { fetchExchangeRates, BASE_PRICE_PKR } from "@/lib/countries";

/**
 * GET /api/exchange-rates
 * Returns current exchange rates from PKR to all supported currencies.
 * Used by the frontend to display subscription prices in the user's local currency.
 */
export async function GET() {
  const rates = await fetchExchangeRates();
  return NextResponse.json({
    base: "PKR",
    basePrice: BASE_PRICE_PKR,
    rates,
    // Converted prices for convenience
    prices: Object.entries(rates).map(([currency, rate]) => ({
      currency,
      amount: Math.round(BASE_PRICE_PKR * rate),
    })),
  });
}
