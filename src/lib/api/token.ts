/**
 * Token data aggregation and transformation utilities
 */

import { ZapperToken } from './zapper';
import { fetchFarcasterUserByAddress } from './neynar';

export interface CreatorInfo {
  address: string | null;
  farcasterUsername: string | null;
  farcasterFid: string | null;
  farcasterPfp: string | null;
}

/**
 * Extracts creator information from Zapper token data
 */
export function extractCreatorInfoFromZapper(
  token: ZapperToken
): CreatorInfo {
  const creatorAddress = token.deployer?.address || null;
  
  return {
    address: creatorAddress,
    farcasterUsername: token.deployer?.farcasterProfile?.username || null,
    farcasterFid: token.deployer?.farcasterProfile?.fid || null,
    farcasterPfp: token.deployer?.farcasterProfile?.metadata?.imageUrl || null,
  };
}

/**
 * Enriches creator info by fetching from Neynar if Farcaster profile is missing
 */
export async function enrichCreatorInfo(
  creatorInfo: CreatorInfo,
  neynarKey: string
): Promise<CreatorInfo> {
  // If we have a creator address but no Farcaster profile, try Neynar
  if (creatorInfo.address && !creatorInfo.farcasterUsername) {
    const neynarCreator = await fetchFarcasterUserByAddress(
      creatorInfo.address,
      neynarKey
    );
    
    if (neynarCreator) {
      return {
        address: creatorInfo.address,
        farcasterUsername: neynarCreator.farcasterUsername,
        farcasterFid: neynarCreator.farcasterFid,
        farcasterPfp: neynarCreator.farcasterPfp,
      };
    }
  }
  
  return creatorInfo;
}

