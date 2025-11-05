/**
 * DexScreener API utility functions
 */

interface DexScreenerPair {
  chainId: string;
  url?: string;
  info?: {
    websites?: Array<{ url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

export interface ParsedDexScreenerData {
  website: string | null;
  telegram: string | null;
  twitter: string | null;
  dexscreenerUrl: string | null;
}

/**
 * Fetches and parses DexScreener data for a token
 */
export async function fetchDexScreenerData(
  tokenAddress: string
): Promise<ParsedDexScreenerData | null> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );

    if (!response.ok) {
      return null;
    }

    const data: DexScreenerResponse = await response.json();
    
    // Find the pair on Base chain (chainId: base)
    const basePair = data.pairs?.find((pair) => pair.chainId === 'base');
    
    if (!basePair) {
      return null;
    }

    return {
      website: basePair.info?.websites?.[0]?.url || null,
      telegram:
        basePair.info?.socials?.find((s) => s.type === 'telegram')?.url || null,
      twitter:
        basePair.info?.socials?.find((s) => s.type === 'twitter')?.url || null,
      dexscreenerUrl: basePair.url || null,
    };
  } catch (error) {
    console.error('Error fetching DexScreener data:', error);
    return null;
  }
}

