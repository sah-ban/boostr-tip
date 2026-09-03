import { NextResponse } from "next/server";

export async function GET() {
  try {
    // For now, using DEGEN pair on Base as placeholder for BOOSTR
    const dexApiUrl = `https://api.dexscreener.com/latest/dex/pairs/base/0x54d281c7cc029a9dd71f9acb7487dd95b1eecf5a`;
    const response = await fetch(dexApiUrl);
    
    if (!response.ok) {
      throw new Error("Failed to fetch price");
    }
    
    const data = await response.json();
    
    if (data && data.pair) {
      return NextResponse.json({
        price: parseFloat(data.pair.priceUsd),
        priceChange1h: data.pair.priceChange.h1,
        priceChange24h: data.pair.priceChange.h24,
      });
    }
    
    return NextResponse.json({ price: 0, priceChange1h: 0, priceChange24h: 0 });
  } catch (error) {
    console.error("Error fetching price:", error);
    // Return mock data if DexScreener is down or rate limited
    return NextResponse.json({ 
      price: 0.0123, 
      priceChange1h: 1.5, 
      priceChange24h: 5.2 
    });
  }
}
