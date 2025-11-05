import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for viewing token information
 * Accepts FID and tokenAddress as query parameters or in the request body
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  const tokenAddress = searchParams.get('tokenAddress');

  console.log('FID:', fid);
  console.log('tokenAddress:', tokenAddress);

  if (!fid || !tokenAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: fid and tokenAddress are required' },
      { status: 400 }
    );
  }

  const zapperKey = process.env.ZAPPER_KEY;
  if (!zapperKey) {
    return NextResponse.json(
      { error: 'ZAPPER_KEY environment variable is not set' },
      { status: 500 }
    );
  }

  // Base chain (chainId 8453)
  const chainId = 8453;

  const query = `
    query FungibleTokenV2($address: Address!, $chainId: Int!) {
      fungibleTokenV2(address: $address, chainId: $chainId) {
        address
        symbol
        name
        decimals
        imageUrlV2
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

  const variables = {
    address: tokenAddress,
    chainId: chainId,
  };

  try {
    // Fetch from Zapper, DexScreener, and CoinGecko in parallel
    const [zapperResponse, dexScreenerResponse, coinGeckoResponse] = await Promise.all([
      fetch('https://public.zapper.xyz/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-zapper-api-key': zapperKey,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      }),
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`),
      fetch(`https://api.coingecko.com/api/v3/coins/base/contract/${tokenAddress}`)
    ]);

    if (!zapperResponse.ok) {
      const errorText = await zapperResponse.text();
      console.error('Zapper API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch token data from Zapper API', details: errorText },
        { status: zapperResponse.status }
      );
    }

    const zapperData = await zapperResponse.json();

    if (zapperData.errors) {
      console.error('GraphQL errors:', zapperData.errors);
      return NextResponse.json(
        { error: 'GraphQL errors from Zapper API', details: zapperData.errors },
        { status: 500 }
      );
    }

    const token = zapperData.data?.fungibleTokenV2;

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Parse DexScreener data
    let dexScreenerData = null;
    if (dexScreenerResponse.ok) {
      const dexData = await dexScreenerResponse.json();
      // Find the pair on Base chain (chainId: base)
      const basePair = dexData.pairs?.find((pair: any) => pair.chainId === 'base');
      if (basePair) {
        dexScreenerData = {
          website: basePair.info?.websites?.[0]?.url || null,
          telegram: basePair.info?.socials?.find((s: any) => s.type === 'telegram')?.url || null,
          twitter: basePair.info?.socials?.find((s: any) => s.type === 'twitter')?.url || null,
        };
      }
    }

    // Parse CoinGecko data
    let coinGeckoData = null;
    if (coinGeckoResponse.ok) {
      const cgData = await coinGeckoResponse.json();
      coinGeckoData = {
        description: cgData.description?.en || null,
      };
    }

    // Console log the requested fields
    console.log('address:', token.address);
    console.log('symbol:', token.symbol);
    console.log('name:', token.name);
    console.log('decimals:', token.decimals);
    console.log('imageUrlV2:', token.imageUrlV2);
    console.log('priceData:', JSON.stringify(token.priceData, null, 2));
    console.log('dexScreenerData:', JSON.stringify(dexScreenerData, null, 2));
    console.log('coinGeckoData:', JSON.stringify(coinGeckoData, null, 2));

    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        priceData: token.priceData,
        description: coinGeckoData?.description,
        website: dexScreenerData?.website,
        telegram: dexScreenerData?.telegram,
        twitter: dexScreenerData?.twitter,
      },
    });
  } catch (error) {
    console.error('Error fetching token data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    // JSON parsing errors are client errors (400), not server errors (500)
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    const { fid, tokenAddress } = body;

    console.log('FID:', fid);
    console.log('tokenAddress:', tokenAddress);

    if (!fid || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: fid and tokenAddress are required' },
        { status: 400 }
      );
    }

    const zapperKey = process.env.ZAPPER_KEY;
    if (!zapperKey) {
      return NextResponse.json(
        { error: 'ZAPPER_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Base chain (chainId 8453)
    const chainId = 8453;

    const query = `
      query FungibleTokenV2($address: Address!, $chainId: Int!) {
        fungibleTokenV2(address: $address, chainId: $chainId) {
          address
          symbol
          name
          decimals
          imageUrlV2
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

    const variables = {
      address: tokenAddress,
      chainId: chainId,
    };

    // Fetch from Zapper, DexScreener, and CoinGecko in parallel
    const [zapperResponse, dexScreenerResponse, coinGeckoResponse] = await Promise.all([
      fetch('https://public.zapper.xyz/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-zapper-api-key': zapperKey,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      }),
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`),
      fetch(`https://api.coingecko.com/api/v3/coins/base/contract/${tokenAddress}`)
    ]);

    if (!zapperResponse.ok) {
      const errorText = await zapperResponse.text();
      console.error('Zapper API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch token data from Zapper API', details: errorText },
        { status: zapperResponse.status }
      );
    }

    const zapperData = await zapperResponse.json();

    if (zapperData.errors) {
      console.error('GraphQL errors:', zapperData.errors);
      return NextResponse.json(
        { error: 'GraphQL errors from Zapper API', details: zapperData.errors },
        { status: 500 }
      );
    }

    const token = zapperData.data?.fungibleTokenV2;

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Parse DexScreener data
    let dexScreenerData = null;
    if (dexScreenerResponse.ok) {
      const dexData = await dexScreenerResponse.json();
      // Find the pair on Base chain (chainId: base)
      const basePair = dexData.pairs?.find((pair: any) => pair.chainId === 'base');
      if (basePair) {
        dexScreenerData = {
          website: basePair.info?.websites?.[0]?.url || null,
          telegram: basePair.info?.socials?.find((s: any) => s.type === 'telegram')?.url || null,
          twitter: basePair.info?.socials?.find((s: any) => s.type === 'twitter')?.url || null,
        };
      }
    }

    // Parse CoinGecko data
    let coinGeckoData = null;
    if (coinGeckoResponse.ok) {
      const cgData = await coinGeckoResponse.json();
      coinGeckoData = {
        description: cgData.description?.en || null,
      };
    }

    // Console log the requested fields
    console.log('address:', token.address);
    console.log('symbol:', token.symbol);
    console.log('name:', token.name);
    console.log('decimals:', token.decimals);
    console.log('imageUrlV2:', token.imageUrlV2);
    console.log('priceData:', JSON.stringify(token.priceData, null, 2));
    console.log('dexScreenerData:', JSON.stringify(dexScreenerData, null, 2));
    console.log('coinGeckoData:', JSON.stringify(coinGeckoData, null, 2));

    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        priceData: token.priceData,
        description: coinGeckoData?.description,
        website: dexScreenerData?.website,
        telegram: dexScreenerData?.telegram,
        twitter: dexScreenerData?.twitter,
      },
    });
  } catch (error) {
    console.error('Error fetching token data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

