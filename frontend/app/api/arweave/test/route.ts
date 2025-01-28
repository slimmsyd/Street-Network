import { NextResponse } from 'next/server';
import { inscribeToArweave } from '../../../../utils/arweave';
import fs from 'fs';
import path from 'path';
import Arweave from 'arweave';

// Initialize Arweave
const arweave = new Arweave({
  host: process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'arweave.net',
  port: Number(process.env.NEXT_PUBLIC_ARWEAVE_PORT) || 443,
  protocol: process.env.NEXT_PUBLIC_ARWEAVE_PROTOCOL || 'https',
});

export async function GET() {
  try {
    // First verify wallet file exists
    let walletPath = process.env.ARWEAVE_WALLET_FILE_PATH;
    if (!walletPath) {
      return NextResponse.json({
        success: false,
        error: 'ARWEAVE_WALLET_FILE_PATH not set'
      }, { status: 500 });
    }

    // Handle relative paths
    if (walletPath.startsWith('./')) {
      walletPath = path.join(process.cwd(), walletPath.slice(2));
    }

    if (!fs.existsSync(walletPath)) {
      return NextResponse.json({
        success: false,
        error: `Wallet file not found at ${walletPath}`,
        currentDirectory: process.cwd(),
        searchedPath: walletPath
      }, { status: 500 });
    }

    // Read wallet file for verification
    const walletContent = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const walletKeys = Object.keys(walletContent);

    // Create a smaller test message
    const testData = {
      type: 'test',
      message: 'Sydney DO BE TESTING',
      timestamp: new Date().toISOString()
    };

    // Try to inscribe it
    const result = await inscribeToArweave({
      data: testData,
      tags: [
        { name: 'Type', value: 'test' },
        { name: 'App-Version', value: '1.0' }
      ]
    });

    // Add a delay to allow for network propagation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to fetch the transaction data
    let transactionData = null;
    try {
      transactionData = await arweave.transactions.get(result.transactionId);
      console.log('Transaction data retrieved:', transactionData);
    } catch (fetchError) {
      console.log('Could not fetch transaction yet:', fetchError);
    }

    return NextResponse.json({
      success: true,
      message: 'Test inscription successful',
      transaction: {
        id: result.transactionId,
        walletAddress: result.walletAddress,
        data: transactionData ? {
          status: 'found',
          size: transactionData.data ? transactionData.data.length : 0
        } : {
          status: 'pending',
          message: 'Transaction is still being processed by the network'
        }
      },
      wallet: {
        path: walletPath,
        format: walletKeys,
        exists: true
      }
    });
  } catch (error) {
    console.error('Test inscription failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      walletPath: process.env.ARWEAVE_WALLET_FILE_PATH,
      currentDirectory: process.cwd(),
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    }, { status: 500 });
  }
} 