This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Get your API keys and add them to `.env.local`:
   - Zapper API key: [https://build.zapper.xyz/](https://build.zapper.xyz/)
   - Neynar API key: [https://dev.neynar.com/](https://dev.neynar.com/)
   - Alchemy API key: [https://www.alchemy.com/](https://www.alchemy.com/) (Enable Base network)

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API Endpoints

### Fetch Token

Get token information by providing FID and tokenAddress.

**GET Request:**
```bash
curl "http://localhost:3000/api/fetch-token?fid=7988&tokenAddress=0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb"
```

**Example Response (CLANKER Token):**
```json
{
  "success": true,
  "token": {
    "address": "0x1bc0c42215582d5a085795f4badbac3ff36d1bcb",
    "symbol": "CLANKER",
    "name": "tokenbot",
    "decimals": 18,
    "imageUrlV2": "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x1bc0c42215582d5a085795f4badbac3ff36d1bcb.png",
    "creator": {
      "address": null,
      "farcasterUsername": null,
      "farcasterFid": null,
      "farcasterPfp": null
    },
    "relevantHolders": [
      {
        "address": "0x2c4832db7f6eccbb4d32ee29456d0caa20673200",
        "farcasterUsername": "coopahtroopa.eth",
        "farcasterFid": 206,
        "farcasterPfp": "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/517f8009-3082-4ee0-11dd-32e666ff0700/original",
        "displayName": "Coop",
        "followerCount": 247939,
        "powerBadge": true
      }
    ],
    "holderCount": 522094,
    "age": {
      "createdAt": 1732476935000,
      "ageInDays": 345,
      "ageInHours": 8303,
      "ageInMinutes": 498183
    },
    "priceData": {
      "price": 96.45391670256252,
      "marketCap": 96453916.70256253,
      "priceChange5m": 0.2835770914926039,
      "priceChange1h": 0.9012902644845111,
      "priceChange24h": 33.48196399105263,
      "volume24h": 13994416,
      "totalGasTokenLiquidity": 1011.1353878840569,
      "totalLiquidity": 3495267.4293393716,
      "priceTicks": [
        {
          "id": "T25jaGFpbk1hcmtldERhdGFQcmljZVRpY2stMTJzOmJhc2U6MHgxYmMwYzQyMjE1NTgyZDVhMDg1Nzk1ZjRiYWRiYWMzZmYzNmQxYmNiOjE3NjIzNjQzNDAwMDA=",
          "median": 95.01797021381122,
          "open": 96.06526023808092,
          "close": 95.33461288350819,
          "high": 96.06526023808092,
          "low": 93.99942020356256,
          "timestamp": 1762364340000
        }
      ]
    },
    "description": "Clanker is an autonomous agent for deploying tokens. Currently, users may request clanker to deploy an ERC-20 token on Base by tagging it @clanker on Farcaster.",
    "website": "https://clanker.world",
    "telegram": "https://t.me/clankerfc",
    "twitter": "https://x.com/clankeronbase",
    "dexscreenerUrl": "https://dexscreener.com/base/0xc1a6fbedae68e1472dbb91fe29b51f7a0bd44f97",
    "coinGeckoUrl": "https://www.coingecko.com/en/coins/clanker"
  }
}
```

**Response Fields:**
- `holderCount`: Total number of token holders
- `age`: Token creation timestamp and age in days/hours/minutes
- `relevantHolders`: Array of token holders from your Farcaster social graph (includes displayName, followerCount, and powerBadge status)
- `description`: Token description from CoinGecko
- `website`: Official token website from DexScreener
- `telegram`: Telegram community link from DexScreener
- `twitter`: Twitter/X account from DexScreener
- `dexscreenerUrl`: DexScreener chart URL
- `coinGeckoUrl`: CoinGecko token page URL

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
