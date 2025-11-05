This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Get your Zapper API key at [https://build.zapper.xyz/](https://build.zapper.xyz/) and add it to `.env.local`

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

### View Token

Get token information by providing FID and tokenAddress.

**GET Request:**
```bash
curl "http://localhost:3000/api/view-token?fid=123&tokenAddress=0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb"
```

**POST Request:**
```bash
curl -X POST http://localhost:3000/api/view-token \
  -H "Content-Type: application/json" \
  -d '{"fid": "123", "tokenAddress": "0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb"}'
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
