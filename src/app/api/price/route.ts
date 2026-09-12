import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tokenAddress = process.env.BOOSTR_CONTRACT_ADDRESS || "0x4ed4e862860bed51a9570b96d89af5e1b0efefed";
    const dexApiUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    const response = await fetch(dexApiUrl);
    
    if (!response.ok) {
      throw new Error("Failed to fetch price");
    }
    
    const data = await response.json();
    
    if (data && data.pairs && data.pairs.length > 0) {
      // DexScreener returns pairs sorted by volume/liquidity, so the first one is the best reference
      const bestPair = data.pairs[0];
      return NextResponse.json({
        price: parseFloat(bestPair.priceUsd),
        priceChange1h: bestPair.priceChange?.h1 || 0,
        priceChange24h: bestPair.priceChange?.h24 || 0,
      });
    }
    
    return NextResponse.json({ price: 0, priceChange1h: 0, priceChange24h: 0 });
  } catch (error) {
    console.error("Error fetching price:", error);
    // Return fallback data if DexScreener is down or rate limited
    return NextResponse.json({ 
      price: 0, 
      priceChange1h: 0, 
      priceChange24h: 0 
    });
  }
}
