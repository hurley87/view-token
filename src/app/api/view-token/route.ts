import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetches relevant token holders from user's social graph using Neynar API
 */
async function fetchRelevantHolders(tokenAddress: string, fid: string, neynarKey: string) {
  try {
    // Base network only
    const url = new URL('https://api.neynar.com/v2/farcaster/fungible/owner/relevant');
    url.searchParams.append('contract_address', tokenAddress);
    url.searchParams.append('network', 'base');
    url.searchParams.append('viewer_fid', fid);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': neynarKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.top_relevant_fungible_owners_hydrated && data.top_relevant_fungible_owners_hydrated.length > 0) {
        // Return the top relevant holders with their Farcaster profiles
        return data.top_relevant_fungible_owners_hydrated.slice(0, 10).map((owner: any) => ({
          address: owner.custody_address || owner.verified_addresses?.eth_addresses?.[0] || null,
          farcasterUsername: owner.username || null,
          farcasterFid: owner.fid || null,
          farcasterPfp: owner.pfp_url || null,
          displayName: owner.display_name || null,
          followerCount: owner.follower_count || null,
          powerBadge: owner.power_badge || false,
        }));
      }
    } else {
      console.error('Neynar API error:', await response.text());
    }
  } catch (error) {
    console.error('Error fetching relevant holders from Neynar:', error);
  }
  return null;
}

/**
 * Fetches token creation timestamp using Alchemy API
 */
async function fetchTokenAge(contractAddress: string, alchemyKey: string) {
  try {
    // Get the first transaction to the contract (deployment)
    const response = await fetch(
      `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [
            {
              fromBlock: '0x0',
              toBlock: 'latest',
              toAddress: contractAddress,
              category: ['external'],
              maxCount: '0x1',
              order: 'asc',
            },
          ],
          id: 1,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.result?.transfers && data.result.transfers.length > 0) {
        const blockNum = data.result.transfers[0].blockNum;

        // Get block details to get timestamp
        const blockResponse = await fetch(
          `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBlockByNumber',
              params: [blockNum, false],
              id: 2,
            }),
          }
        );

        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          if (blockData.result?.timestamp) {
            // Convert hex timestamp to decimal
            const timestamp = parseInt(blockData.result.timestamp, 16) * 1000;
            const age = Date.now() - timestamp;

            return {
              createdAt: timestamp,
              ageInDays: Math.floor(age / (1000 * 60 * 60 * 24)),
              ageInHours: Math.floor(age / (1000 * 60 * 60)),
              ageInMinutes: Math.floor(age / (1000 * 60)),
            };
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching token age from Alchemy:', error);
  }
  return null;
}

/**
 * Fetches Farcaster user information from Neynar API using an Ethereum address
 */
async function fetchFarcasterUserByAddress(address: string, neynarKey: string) {
  try {
    const neynarResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'api_key': neynarKey,
        },
      }
    );

    if (neynarResponse.ok) {
      const neynarData = await neynarResponse.json();
      // Neynar returns an object with address as key
      const usersByAddress = neynarData[address];
      if (usersByAddress && usersByAddress.length > 0) {
        const user = usersByAddress[0]; // Take the first user if multiple
        return {
          address: address,
          farcasterUsername: user.username || null,
          farcasterFid: user.fid || null,
          farcasterPfp: user.pfp_url || null,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching from Neynar:', error);
  }
  return null;
}

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

  const neynarKey = process.env.NEYNAR_KEY;
  if (!neynarKey) {
    return NextResponse.json(
      { error: 'NEYNAR_KEY environment variable is not set' },
      { status: 500 }
    );
  }

  const alchemyKey = process.env.ALCHEMY_KEY;
  if (!alchemyKey) {
    return NextResponse.json(
      { error: 'ALCHEMY_KEY environment variable is not set' },
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
          dexscreenerUrl: basePair.url || null,
        };
      }
    }

    // Parse CoinGecko data
    let coinGeckoData = null;
    let coinGeckoUrl = null;
    if (coinGeckoResponse.ok) {
      const cgData = await coinGeckoResponse.json();
      coinGeckoData = {
        description: cgData.description?.en || null,
      };
      // Construct CoinGecko URL
      if (cgData.id) {
        coinGeckoUrl = `https://www.coingecko.com/en/coins/${cgData.id}`;
      }
    }

    // Get creator info with multiple fallbacks
    let creatorAddress = token.deployer?.address || null;
    let creatorInfo = {
      address: creatorAddress,
      farcasterUsername: token.deployer?.farcasterProfile?.username || null,
      farcasterFid: token.deployer?.farcasterProfile?.fid || null,
      farcasterPfp: token.deployer?.farcasterProfile?.metadata?.imageUrl || null,
    };

    // Get relevant holders from user's social graph
    const relevantHolders = await fetchRelevantHolders(tokenAddress, fid, neynarKey);

    // Get token age
    const tokenAge = await fetchTokenAge(tokenAddress, alchemyKey);

    // If we have a creator address but no Farcaster profile from Zapper, try Neynar
    if (creatorAddress && !token.deployer?.farcasterProfile) {
      const neynarCreator = await fetchFarcasterUserByAddress(creatorAddress, neynarKey);
      if (neynarCreator) {
        creatorInfo = neynarCreator;
      }
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
    console.log('coinGeckoUrl:', coinGeckoUrl);

    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        creator: creatorInfo,
        relevantHolders: relevantHolders,
        age: tokenAge,
        priceData: token.priceData,
        description: coinGeckoData?.description,
        website: dexScreenerData?.website,
        telegram: dexScreenerData?.telegram,
        twitter: dexScreenerData?.twitter,
        dexscreenerUrl: dexScreenerData?.dexscreenerUrl,
        coinGeckoUrl: coinGeckoUrl,
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

    const neynarKey = process.env.NEYNAR_KEY;
    if (!neynarKey) {
      return NextResponse.json(
        { error: 'NEYNAR_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const alchemyKey = process.env.ALCHEMY_KEY;
    if (!alchemyKey) {
      return NextResponse.json(
        { error: 'ALCHEMY_KEY environment variable is not set' },
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
          dexscreenerUrl: basePair.url || null,
        };
      }
    }

    // Parse CoinGecko data
    let coinGeckoData = null;
    let coinGeckoUrl = null;
    if (coinGeckoResponse.ok) {
      const cgData = await coinGeckoResponse.json();
      coinGeckoData = {
        description: cgData.description?.en || null,
      };
      // Construct CoinGecko URL
      if (cgData.id) {
        coinGeckoUrl = `https://www.coingecko.com/en/coins/${cgData.id}`;
      }
    }

    // Get creator info with multiple fallbacks
    let creatorAddress = token.deployer?.address || null;
    let creatorInfo = {
      address: creatorAddress,
      farcasterUsername: token.deployer?.farcasterProfile?.username || null,
      farcasterFid: token.deployer?.farcasterProfile?.fid || null,
      farcasterPfp: token.deployer?.farcasterProfile?.metadata?.imageUrl || null,
    };

    // Get relevant holders from user's social graph
    const relevantHolders = await fetchRelevantHolders(tokenAddress, fid, neynarKey);

    // Get token age
    const tokenAge = await fetchTokenAge(tokenAddress, alchemyKey);

    // If we have a creator address but no Farcaster profile from Zapper, try Neynar
    if (creatorAddress && !token.deployer?.farcasterProfile) {
      const neynarCreator = await fetchFarcasterUserByAddress(creatorAddress, neynarKey);
      if (neynarCreator) {
        creatorInfo = neynarCreator;
      }
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
    console.log('coinGeckoUrl:', coinGeckoUrl);

    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        creator: creatorInfo,
        relevantHolders: relevantHolders,
        age: tokenAge,
        priceData: token.priceData,
        description: coinGeckoData?.description,
        website: dexScreenerData?.website,
        telegram: dexScreenerData?.telegram,
        twitter: dexScreenerData?.twitter,
        dexscreenerUrl: dexScreenerData?.dexscreenerUrl,
        coinGeckoUrl: coinGeckoUrl,
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

