import { NextResponse } from 'next/server';
import { fetchArweaveData } from '../../../../utils/arweave';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const transactionId = searchParams.get('transactionId');

    if (!userId && !type && !transactionId) {
      return NextResponse.json({
        success: false,
        error: 'At least one search parameter (userId, type, or transactionId) is required'
      }, { status: 400 });
    }

    // Construct GraphQL query based on provided parameters
    let query = `
      query {
        transactions(
          first: 100,
          tags: [
            ${userId ? `{ name: "User-ID", values: ["${userId}"] }` : ''}
            ${type ? `${userId ? ',' : ''} { name: "Type", values: ["${type}"] }` : ''}
          ]
          ${transactionId ? `ids: ["${transactionId}"]` : ''}
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `;

    const data = await fetchArweaveData(query);

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching Arweave data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Arweave data'
    }, { status: 500 });
  }
} 