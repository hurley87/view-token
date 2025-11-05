/**
 * Alchemy API utility functions for fetching blockchain data
 */

interface TokenAge {
  createdAt: number;
  ageInDays: number;
  ageInHours: number;
  ageInMinutes: number;
}

/**
 * Fetches token creation timestamp using Alchemy API
 */
export async function fetchTokenAge(
  contractAddress: string,
  alchemyKey: string
): Promise<TokenAge | null> {
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

