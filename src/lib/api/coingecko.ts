/**
 * CoinGecko API utility functions
 */

interface CoinGeckoResponse {
  id?: string;
  description?: {
    en?: string;
  };
}

export interface ParsedCoinGeckoData {
  description: string | null;
  url: string | null;
}

/**
 * Fetches and parses CoinGecko data for a token
 */
export async function fetchCoinGeckoData(
  tokenAddress: string
): Promise<ParsedCoinGeckoData> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/base/contract/${tokenAddress}`
    );

    if (!response.ok) {
      return {
        description: null,
        url: null,
      };
    }

    const data: CoinGeckoResponse = await response.json();

    return {
      description: data.description?.en || null,
      url: data.id
        ? `https://www.coingecko.com/en/coins/${data.id}`
        : null,
    };
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
    return {
      description: null,
      url: null,
    };
  }
}

