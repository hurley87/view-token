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

  return NextResponse.json({
    success: true,
    message: 'Parameters received',
    fid,
    tokenAddress,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, tokenAddress } = body;

    console.log('FID:', fid);
    console.log('tokenAddress:', tokenAddress);

    if (!fid || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: fid and tokenAddress are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Parameters received',
      fid,
      tokenAddress,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
}

