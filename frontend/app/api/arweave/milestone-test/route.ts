import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '../../../../models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../lib/authOptions';
import { uploadMilestoneToArDrive } from '../../../../lib/ardriveUtils';
import { fetchArweaveData } from '../../../../utils/arweave';

/**
 * Milestone Test API Endpoints
 * 
 * These endpoints provide testing functionality for milestone creation and verification
 * between MongoDB and Arweave/ArDrive storage.
 */

// Type definitions for Arweave data structures
interface ArweaveTag {
  name: string;
  value: string;
}

interface ArweaveBlock {
  id: string;
  timestamp: number;
  height: number;
}

interface ArweaveNode {
  id: string;
  data: {
    size: number;
    type: string;
  };
  block: ArweaveBlock;
  tags: ArweaveTag[];
}

interface ArweaveEdge {
  node: ArweaveNode;
}

interface ArweaveMilestone {
  transactionId: string;
  block: ArweaveBlock;
  tags: Record<string, string>;
  data: {
    type: string;
    userId: string;
    milestone: {
      title: string;
      description: string;
      date: string;
    };
    timestamp: string;
  };
}

interface VerificationResult {
  total_mongodb: number;
  total_arweave: number;
  mongodb_with_tx: number;
  arweave_tx_ids: Set<string>;
  mongodb_tx_ids: Set<string>;
  matches: Array<{
    mongodb: any;
    arweave: ArweaveMilestone;
    tx_id: string;
  }>;
  mismatches: Array<{
    source: 'mongodb' | 'arweave';
    data: any;
    tx_id: string;
  }>;
}

/**
 * POST /api/arweave/milestone-test
 * 
 * Creates a test milestone and stores it in both MongoDB and Arweave/ArDrive.
 * The milestone is first uploaded to Arweave, then the transaction ID is stored in MongoDB.
 */
export async function POST(req: Request) {
  try {
    console.log('=== Starting Milestone Test Post ===');
    
    // Get the logged-in user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('No authenticated user found');
    }
    console.log('✓ Found user session:', { email: session.user.email });

    // Connect and get user from MongoDB
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new Error('User not found in database');
    }
    console.log('✓ Found user in MongoDB:', { id: user._id, name: user.name });

    // Create test milestone
    const testMilestone = {
      title: `Testing Milestone Ardrive again ${new Date().toISOString()}`,
      description: "Ardrive test milestone",
      date: new Date().toISOString(),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    };
    console.log('Created test milestone:', testMilestone);

    // 1. First upload to ArDrive
    console.log('1. Uploading to ArDrive...');
    const ardriveResult = await uploadMilestoneToArDrive(testMilestone);
    
    if (!ardriveResult.success) {
      throw new Error(`ArDrive upload failed: ${ardriveResult.error}`);
    }
    
    console.log('✓ ArDrive upload successful:', {
      transactionId: ardriveResult.transactionId
    });

    // 2. Then save to MongoDB
    console.log('2. Saving to MongoDB...');
    const updateOperation = {
      $push: {
        milestones: {
          ...testMilestone,
          arweave_tx_id: ardriveResult.transactionId
        }
      }
    };

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateOperation,
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user with new milestone');
    }

    console.log('✓ MongoDB update successful:', {
      totalMilestones: updatedUser.milestones.length,
      latestMilestone: updatedUser.milestones[updatedUser.milestones.length - 1]
    });

    console.log('=== Test Post Completed Successfully ===');

    return NextResponse.json({
      success: true,
      message: 'Milestone test post completed',
      milestone: testMilestone,
      storage: {
        ardrive: {
          transactionId: ardriveResult.transactionId,
          explorerUrl: `https://viewblock.io/arweave/tx/${ardriveResult.transactionId}`
        },
        mongodb: {
          userId: user._id,
          totalMilestones: updatedUser.milestones.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Milestone test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/arweave/milestone-test
 * 
 * Fetches and verifies milestone data from both MongoDB and Arweave/ArDrive.
 * Performs detailed verification to ensure data consistency between both storage systems.
 */
export async function GET(req: Request) {
  try {
    console.log('Starting milestone fetch and verification...');
    
    // Get the logged-in user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('No authenticated user found');
    }
    console.log('User session:', { email: session.user.email });

    await dbConnect();
    
    // 1. Fetch from MongoDB (from user's milestones)
    console.log('Fetching from MongoDB...');
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new Error('User not found in database');
    }
    
    const userMilestones = user.milestones || [];
    console.log('MongoDB results:', {
      count: userMilestones.length,
      milestones: userMilestones.map(m => ({
        title: m.title,
        date: m.date,
        arweave_tx_id: m.arweave_tx_id
      }))
    });

    // 2. Fetch from Arweave (only this user's milestones)
    console.log('Fetching from Arweave...');
    
    // First, let's try a broader query to see if we get any results
    const initialQuery = `{
      transactions(
        tags: [
          { name: "app", values: ["Kinnected"] },
          { name: "type", values: ["milestone"] },
          { name: "userId", values: ["${user._id.toString()}"] }
        ]
        first: 100
      ) {
        edges {
          node {
            id
            data {
              size
              type
            }
            block {
              id
              timestamp
              height
            }
            tags {
              name
              value
            }
          }
        }
      }
    }`;

    console.log('Executing initial query:', initialQuery);
    
    // Execute initial query
    const response = await fetch('https://arweave.net/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: initialQuery })
    });

    const result = await response.json();
    console.log('Raw GraphQL Response:', result);

    // Extract transactions from the GraphQL response
    const transactions = result.data?.transactions?.edges || [];
    console.log('Found transactions:', transactions.length);

    // Fetch actual data for each transaction
    const arweaveMilestones = await Promise.all(transactions.map(async (edge: ArweaveEdge) => {
      try {
        // Fetch the actual data content
        const dataResponse = await fetch(`https://arweave.net/${edge.node.id}`);
        const milestoneData = await dataResponse.json();
        
        return {
          transactionId: edge.node.id,
          block: edge.node.block,
          tags: edge.node.tags.reduce((acc: Record<string, string>, tag: ArweaveTag) => {
            acc[tag.name] = tag.value;
            return acc;
          }, {}),
          data: milestoneData
        };
      } catch (error) {
        console.error(`Error fetching data for transaction ${edge.node.id}:`, error);
        return null;
      }
    }));

    // Filter out any failed fetches and type the result
    const validMilestones = arweaveMilestones.filter((m): m is ArweaveMilestone => m !== null);

    // Log each transaction's data and tags for debugging
    validMilestones.forEach(m => {
      console.log(`\nTransaction ${m.transactionId}:`);
      console.log('Tags:', m.tags);
      console.log('Milestone Data:', m.data);
      console.log('Block Info:', m.block);
    });

    // If we have MongoDB transactions with Arweave IDs, let's check one directly
    const sampleTx = userMilestones.find(m => m.arweave_tx_id);
    if (sampleTx) {
      console.log('Checking sample transaction:', sampleTx.arweave_tx_id);
      try {
        const txResponse = await fetch(`https://arweave.net/${sampleTx.arweave_tx_id}`);
        console.log('Transaction Status:', txResponse.status);
        if (txResponse.ok) {
          const txData = await txResponse.json();
          console.log('Transaction Data:', txData);
        } else {
          console.log('Transaction not found or still pending');
        }
      } catch (txError) {
        console.error('Error fetching transaction:', txError);
      }
    }

    // Log all MongoDB transactions that should be on Arweave
    console.log('MongoDB transactions that should be on Arweave:', 
      userMilestones
        .filter(m => m.arweave_tx_id)
        .map(m => ({
          tx_id: m.arweave_tx_id,
          title: m.title,
          date: m.date,
          viewBlock: `https://viewblock.io/arweave/tx/${m.arweave_tx_id}`
        }))
    );

    // Log detailed milestone comparison
    console.log('Detailed Milestone Comparison:');
    console.log('MongoDB Milestones:', userMilestones.map(m => ({
      title: m.title,
      date: m.date,
      description: m.description,
      tx_id: m.arweave_tx_id,
      user: (m as any).user  // Type assertion for now
    })));
    
    // Enhanced verification between MongoDB and Arweave data
    console.log('\n=== Starting Data Verification ===');
    
    const verification: VerificationResult = {
      total_mongodb: userMilestones.length,
      total_arweave: validMilestones.length,
      mongodb_with_tx: userMilestones.filter(m => m.arweave_tx_id).length,
      arweave_tx_ids: new Set(validMilestones.map(m => m.transactionId)),
      mongodb_tx_ids: new Set(userMilestones
        .filter(m => m.arweave_tx_id) // Filter out milestones without tx_id
        .map(m => m.arweave_tx_id!)   // Non-null assertion is safe after filter
      ),
      matches: [],
      mismatches: []
    };

    // Check each MongoDB milestone against Arweave
    userMilestones.forEach(mongoMilestone => {
      if (!mongoMilestone.arweave_tx_id) {
        console.log(`MongoDB milestone without Arweave TX:`, {
          title: mongoMilestone.title,
          date: mongoMilestone.date
        });
        return;
      }

      const arweaveMilestone = validMilestones.find(
        am => am.transactionId === mongoMilestone.arweave_tx_id
      );

      if (arweaveMilestone) {
        // Found matching records
        verification.matches.push({
          mongodb: mongoMilestone,
          arweave: arweaveMilestone,
          tx_id: mongoMilestone.arweave_tx_id
        });
        console.log(`✓ Found matching milestone:`, {
          title: mongoMilestone.title,
          tx_id: mongoMilestone.arweave_tx_id,
          mongodb_date: mongoMilestone.date,
          arweave_date: arweaveMilestone.data.milestone.date
        });
      } else {
        // MongoDB has TX ID but not found in Arweave
        verification.mismatches.push({
          source: 'mongodb',
          data: mongoMilestone,
          tx_id: mongoMilestone.arweave_tx_id
        });
        console.warn(`⚠ MongoDB milestone not found in Arweave:`, {
          title: mongoMilestone.title,
          tx_id: mongoMilestone.arweave_tx_id
        });
      }
    });

    // Check for Arweave transactions not in MongoDB
    validMilestones.forEach(arweaveMilestone => {
      const mongoMilestone = userMilestones.find(
        mm => mm.arweave_tx_id === arweaveMilestone.transactionId
      );

      if (!mongoMilestone) {
        verification.mismatches.push({
          source: 'arweave',
          data: arweaveMilestone,
          tx_id: arweaveMilestone.transactionId
        });
        console.warn(`⚠ Arweave milestone not found in MongoDB:`, {
          title: arweaveMilestone.data.milestone.title,
          tx_id: arweaveMilestone.transactionId
        });
      }
    });

    console.log('\n=== Verification Summary ===');
    console.log('Total MongoDB milestones:', verification.total_mongodb);
    console.log('Total Arweave milestones:', verification.total_arweave);
    console.log('Matching milestones:', verification.matches.length);
    console.log('Mismatched milestones:', verification.mismatches.length);
    console.log('===========================\n');

    return NextResponse.json({
      success: true,
      data: {
        mongodb: userMilestones.map(m => ({
          title: m.title,
          date: m.date,
          description: m.description,
          tx_id: m.arweave_tx_id,
          user: (m as any).user,
          viewBlock: m.arweave_tx_id ? `https://viewblock.io/arweave/tx/${m.arweave_tx_id}` : null
        })),
        arweave: validMilestones.map(m => ({
          id: m.transactionId,
          blockId: m.block?.id,
          blockHeight: m.block?.height,
          timestamp: m.block?.timestamp,
          tags: m.tags,
          data: m.data,
          viewBlock: `https://viewblock.io/arweave/tx/${m.transactionId}`,
          viewBlock_block: m.block?.id ? `https://viewblock.io/arweave/block/${m.block.id}` : null
        }))
      },
      verification: {
        total_mongodb: verification.total_mongodb,
        total_arweave: verification.total_arweave,
        matches: verification.matches.length,
        mismatches: verification.mismatches.map(mm => ({
          source: mm.source,
          tx_id: mm.tx_id,
          title: mm.source === 'mongodb' ? mm.data.title : mm.data.data.milestone.title
        }))
      },
      user: {
        email: user.email,
        id: user._id
      }
    });

  } catch (error) {
    console.error('Milestone fetch failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    }, { status: 500 });
  }
} 