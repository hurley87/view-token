/**
 * Neynar API utility functions for fetching Farcaster-related data
 */

export interface RelevantHolder {
  address: string | null;
  farcasterUsername: string | null;
  farcasterFid: string | null;
  farcasterPfp: string | null;
  displayName: string | null;
  followerCount: number | null;
  powerBadge: boolean;
}

export interface FarcasterUser {
  address: string;
  farcasterUsername: string | null;
  farcasterFid: string | null;
  farcasterPfp: string | null;
}

interface NeynarOwnerResponse {
  custody_address?: string;
  verified_addresses?: {
    eth_addresses?: string[];
  };
  username?: string;
  fid?: string;
  pfp_url?: string;
  display_name?: string;
  follower_count?: number;
  power_badge?: boolean;
}

interface NeynarRelevantHoldersResponse {
  top_relevant_fungible_owners_hydrated?: NeynarOwnerResponse[];
}

interface NeynarUserResponse {
  username?: string;
  fid?: string;
  pfp_url?: string;
}

interface NeynarBulkUserResponse {
  [address: string]: NeynarUserResponse[];
}

/**
 * Fetches relevant token holders from user's social graph using Neynar API
 */
export async function fetchRelevantHolders(
  tokenAddress: string,
  fid: string,
  neynarKey: string
): Promise<RelevantHolder[] | null> {
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
      const data: NeynarRelevantHoldersResponse = await response.json();
      if (
        data.top_relevant_fungible_owners_hydrated &&
        data.top_relevant_fungible_owners_hydrated.length > 0
      ) {
        // Return the top relevant holders with their Farcaster profiles
        return data.top_relevant_fungible_owners_hydrated
          .slice(0, 10)
          .map((owner: NeynarOwnerResponse): RelevantHolder => ({
            address:
              owner.custody_address ||
              owner.verified_addresses?.eth_addresses?.[0] ||
              null,
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
 * Fetches Farcaster user information from Neynar API using an Ethereum address
 */
export async function fetchFarcasterUserByAddress(
  address: string,
  neynarKey: string
): Promise<FarcasterUser | null> {
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
      const neynarData: NeynarBulkUserResponse = await neynarResponse.json();
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

