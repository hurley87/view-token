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
    const response = await fetch('https://public.zapper.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': zapperKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zapper API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch token data from Zapper API', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL errors from Zapper API', details: data.errors },
        { status: 500 }
      );
    }

    const token = data.data?.fungibleTokenV2;

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Console log the requested fields
    console.log('address:', token.address);
    console.log('symbol:', token.symbol);
    console.log('name:', token.name);
    console.log('decimals:', token.decimals);
    console.log('imageUrlV2:', token.imageUrlV2);
    console.log('priceData:', JSON.stringify(token.priceData, null, 2));

    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        priceData: token.priceData,
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

    const response = await fetch('https://public.zapper.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': zapperKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zapper API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch token data from Zapper API', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL errors from Zapper API', details: data.errors },
        { status: 500 }
      );
    }

    const token = data.data?.fungibleTokenV2;

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Console log the requested fields
    console.log('address:', token.address);
    console.log('symbol:', token.symbol);
    console.log('name:', token.name);
    console.log('decimals:', token.decimals);
    console.log('imageUrlV2:', token.imageUrlV2);
    console.log('priceData:', JSON.stringify(token.priceData, null, 2));

    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        priceData: token.priceData,
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

