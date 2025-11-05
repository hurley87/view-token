/**
 * Zapper API utility functions
 */

export const ZAPPER_GRAPHQL_QUERY = `
  query FungibleTokenV2($address: Address!, $chainId: Int!) {
    fungibleTokenV2(address: $address, chainId: $chainId) {
      address
      symbol
      name
      decimals
      imageUrlV2
      deployer {
        address
        farcasterProfile {
          username
          fid
          metadata {
            imageUrl
          }
        }
      }
      holders(first: 1) {
        totalCount
      }
      priceData {
        price
        marketCap
        priceChange5m
        priceChange1h
        priceChange24h
        volume24h
        totalGasTokenLiquidity
        totalLiquidity
        priceTicks(currency: USD, timeFrame: HOUR) {
          id
          median
          open
          close
          high
          low
          timestamp
        }
      }
    }
  }
`;

interface ZapperTokenResponse {
  data?: {
    fungibleTokenV2?: ZapperToken;
  };
  errors?: Array<{ message: string }>;
}

export interface ZapperToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  imageUrlV2: string | null;
  deployer?: {
    address: string;
    farcasterProfile?: {
      username: string | null;
      fid: string | null;
      metadata?: {
        imageUrl: string | null;
      };
    };
  };
  holders?: {
    totalCount: number;
  };
  priceData?: {
    price: number | null;
    marketCap: number | null;
    priceChange5m: number | null;
    priceChange1h: number | null;
    priceChange24h: number | null;
    volume24h: number | null;
    totalGasTokenLiquidity: number | null;
    totalLiquidity: number | null;
    priceTicks?: Array<{
      id: string;
      median: number;
      open: number;
      close: number;
      high: number;
      low: number;
      timestamp: number;
    }>;
  };
}

/**
 * Fetches token data from Zapper API
 */
export async function fetchTokenFromZapper(
  tokenAddress: string,
  chainId: number,
  zapperKey: string
): Promise<{ token: ZapperToken } | { error: string; status: number }> {
  const variables = {
    address: tokenAddress,
    chainId,
  };

  const response = await fetch('https://public.zapper.xyz/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-zapper-api-key': zapperKey,
    },
    body: JSON.stringify({
      query: ZAPPER_GRAPHQL_QUERY,
      variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zapper API error:', errorText);
    return {
      error: 'Failed to fetch token data from Zapper API',
      status: response.status,
    };
  }

  const data: ZapperTokenResponse = await response.json();

  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    return {
      error: 'GraphQL errors from Zapper API',
      status: 500,
    };
  }

  const token = data.data?.fungibleTokenV2;

  if (!token) {
    return {
      error: 'Token not found',
      status: 404,
    };
  }

  return { token };
}

