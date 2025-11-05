import { NextRequest, NextResponse } from 'next/server';
import { validateEnvVars } from '@/lib/utils/env';
import { fetchTokenFromZapper } from '@/lib/api/zapper';
import { fetchRelevantHolders } from '@/lib/api/neynar';
import { fetchTokenAge } from '@/lib/api/alchemy';
import { fetchDexScreenerData } from '@/lib/api/dexscreener';
import { fetchCoinGeckoData } from '@/lib/api/coingecko';
import {
  extractCreatorInfoFromZapper,
  enrichCreatorInfo,
} from '@/lib/api/token';
import { BASE_CHAIN_ID } from '@/lib/constants/chain';

/**
 * API route handler for viewing token information
 * Accepts FID and tokenAddress as query parameters
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  const tokenAddress = searchParams.get('tokenAddress');

  // Validate required query parameters
  if (!fid || !tokenAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: fid and tokenAddress are required' },
      { status: 400 }
    );
  }

  // Validate environment variables
  const envResult = validateEnvVars([
    'ZAPPER_KEY',
    'NEYNAR_KEY',
    'ALCHEMY_KEY',
  ]);

  if (envResult.error) {
    return NextResponse.json(
      { error: envResult.error.message },
      { status: envResult.error.status }
    );
  }

  const { ZAPPER_KEY, NEYNAR_KEY, ALCHEMY_KEY } = envResult.value;

  try {
    // Fetch token data from Zapper, DexScreener, and CoinGecko in parallel
    const [zapperResult, dexScreenerData, coinGeckoData] = await Promise.all([
      fetchTokenFromZapper(tokenAddress, BASE_CHAIN_ID, ZAPPER_KEY),
      fetchDexScreenerData(tokenAddress),
      fetchCoinGeckoData(tokenAddress),
    ]);

    // Handle Zapper API errors
    if ('error' in zapperResult) {
      return NextResponse.json(
        { error: zapperResult.error },
        { status: zapperResult.status }
      );
    }

    const { token } = zapperResult;

    // Extract initial creator info from Zapper data
    const initialCreatorInfo = extractCreatorInfoFromZapper(token);

    // Fetch additional data in parallel: relevant holders, token age, and enrich creator info
    const [relevantHolders, tokenAge, creatorInfo] = await Promise.all([
      fetchRelevantHolders(tokenAddress, fid, NEYNAR_KEY),
      fetchTokenAge(tokenAddress, ALCHEMY_KEY),
      enrichCreatorInfo(initialCreatorInfo, NEYNAR_KEY),
    ]);

    // Build response object
    return NextResponse.json({
      success: true,
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        imageUrlV2: token.imageUrlV2,
        creator: creatorInfo,
        relevantHolders,
        holderCount: token.holders?.totalCount || null,
        age: tokenAge,
        priceData: token.priceData,
        description: coinGeckoData.description,
        website: dexScreenerData?.website,
        telegram: dexScreenerData?.telegram,
        twitter: dexScreenerData?.twitter,
        dexscreenerUrl: dexScreenerData?.dexscreenerUrl,
        coinGeckoUrl: coinGeckoData.url,
      },
    });
  } catch (error) {
    console.error('Error fetching token data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
