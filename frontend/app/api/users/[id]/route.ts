import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import { uploadMilestoneToArDrive } from '../../../../lib/ardriveUtils';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import Arweave from 'arweave';

interface UpdateQuery {
  name?: any;
  occupation?: any;
  email?: any;
  phoneNumber?: any;
  birthDay?: any;
  maritalStatus?: any;
  location?: any;
  bio?: any;
  familyRole?: any;
  interests?: any;
  contributions?: any;
  settings?: any;
  profileImage?: any;
  milestones?: Array<{
    _id: string;
    date: string;
    title: string;
    description: string;
  }>;
}

interface Milestone {
  date: string;
  title: string;
  description: string;
  _id?: string;
  arweave_tx_id?: string;  // Optional since it might not exist for new milestones
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MongoDB URI is not configured'
      }, { status: 500 });
    }

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        birthDay: user.birthDay,
        maritalStatus: user.maritalStatus,
        location: user.location,
        bio: user.bio,
        interests: user.interests,
        milestones: user.milestones,
        familyRole: user.familyRole,
        contributions: user.contributions,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MongoDB URI is not configured'
      }, { status: 500 });
    }

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const body = await request.json();

    // Prepare the base update query without milestones
    const updateQuery: UpdateQuery = {
      name: body.name,
      occupation: body.occupation,
      email: body.email,
      phoneNumber: body.phoneNumber,
      birthDay: body.birthDay,
      maritalStatus: body.maritalStatus,
      location: body.location,
      bio: body.bio,
      familyRole: body.familyRole,
      interests: body.interests,
      contributions: body.contributions,
      settings: body.settings,
      profileImage: body.profileImage
    };

    let updateOperation;
    let arweaveTransaction = null;

    // Handle milestones update
    if (body.milestones) {
      console.log('\n=== Milestone Update Request ===');
      console.log('isAddingMilestone flag:', body.isAddingMilestone);
      console.log('Milestones in request:', body.milestones.length);
      console.log('Last milestone:', body.milestones[body.milestones.length - 1]);

      if (body.isAddingMilestone) {
        console.log('\n=== Adding New Milestone ===');
        const newMilestone = body.milestones[body.milestones.length - 1];
        const milestoneDate = new Date(newMilestone.date);
        
        // First, get current user data
        console.log('\nFetching current user data...');
        const currentUser = await User.findById(params.id);
        if (!currentUser) {
          console.error('❌ User not found in database');
          throw new Error('User not found');
        }
        console.log('✓ User found:', {
          id: currentUser._id,
          email: currentUser.email,
          name: currentUser.name
        });

        // Create temporary JSON file for the milestone
        const safeTitle = newMilestone.title.replace(/[^a-zA-Z0-9-_]/g, '_');
        const tempFilePath = path.join(process.cwd(), `${safeTitle}.json`);
        console.log('\nCreating temporary file:', tempFilePath);
        
        // Create milestone data
        const milestoneData = {
          title: newMilestone.title,
          description: newMilestone.description,
          date: milestoneDate.toISOString(),
          user: {
            id: params.id,
            email: currentUser.email,
            name: currentUser.name
          },
          timestamp: new Date().toISOString()
        };
        console.log('Milestone data:', milestoneData);

        // Write to temp file
        fs.writeFileSync(tempFilePath, JSON.stringify(milestoneData, null, 2));
        console.log('✓ Temporary file created');

        try {
          // 1. Upload to ArDrive folder
          console.log('\n=== ArDrive Upload Process ===');
          console.log('1. Checking environment variables...');
          console.log('- FAMILY_LEGACY_ROOT_FOLDER_ID:', process.env.FAMILY_LEGACY_ROOT_FOLDER_ID ? '✓ Set' : '❌ Missing');
          console.log('- WALLET_PATH:', process.env.WALLET_PATH ? '✓ Set' : '❌ Missing');
          
          console.log('\n2. Verifying wallet file...');
          if (!fs.existsSync(process.env.WALLET_PATH!)) {
            throw new Error('Wallet file not found at: ' + process.env.WALLET_PATH);
          }
          console.log('✓ Wallet file exists');

          const ardriveCommand = `ardrive upload-file --add-ipfs-tag --local-path "${tempFilePath}" --parent-folder-id "${process.env.FAMILY_LEGACY_ROOT_FOLDER_ID}" -w "${process.env.WALLET_PATH}" --content-type "milestone"`;
          console.log('\n3. Executing ArDrive command:', ardriveCommand);
          
          const ardriveOutput = execSync(ardriveCommand, { encoding: 'utf8' });
          console.log('4. ArDrive Upload Response:', ardriveOutput);
          console.log('✓ File uploaded to ArDrive folder');

          // 2. Create Arweave transaction
          console.log('\n=== Arweave Transaction Process ===');
          console.log('1. Initializing Arweave...');
          const arweave = Arweave.init({
            host: 'arweave.net',
            port: 443,
            protocol: 'https'
          });
          console.log('✓ Arweave initialized');

          // Read wallet
          console.log('\n2. Reading wallet for Arweave...');
          const wallet = JSON.parse(fs.readFileSync(process.env.WALLET_PATH!, 'utf8'));
          console.log('✓ Wallet loaded');
          
          // Create transaction
          console.log('\n3. Creating Arweave transaction...');
          const transaction = await arweave.createTransaction({ 
            data: Buffer.from(JSON.stringify(milestoneData)) 
          }, wallet);
          console.log('✓ Transaction created');

          // Add tags
          console.log('\n4. Adding tags to transaction...');
          transaction.addTag('App-Name', 'Kinnected');
          transaction.addTag('Content-Type', 'milestone');
          transaction.addTag('Type', 'milestone');
          transaction.addTag('User-Id', params.id);
          transaction.addTag('User-Email', currentUser.email);
          transaction.addTag('User-Name', currentUser.name);
          transaction.addTag('Milestone-Date', milestoneDate.toISOString());
          transaction.addTag('Milestone-Title', newMilestone.title);
          console.log('Transaction tags:', transaction.tags);

          // Sign and post transaction
          console.log('\n5. Signing transaction...');
          await arweave.transactions.sign(transaction, wallet);
          console.log('✓ Transaction signed');

          console.log('\n6. Posting transaction to Arweave...');
          const response = await arweave.transactions.post(transaction);
          console.log('Response status:', response.status);

          if (response.status !== 200) {
            console.error('❌ Failed to post transaction:', response);
            throw new Error('Failed to post Arweave transaction');
          }

          console.log('✓ Transaction posted successfully:', {
            id: transaction.id,
            status: response.status,
            viewBlock: `https://viewblock.io/arweave/tx/${transaction.id}`
          });

          // Clean up temp file
          console.log('\n7. Cleaning up...');
          fs.unlinkSync(tempFilePath);
          console.log('✓ Temporary file removed');

          // Update MongoDB with the transaction ID
          console.log('\n=== MongoDB Update Process ===');
          console.log('1. Preparing update operation...');
          updateOperation = {
            $set: updateQuery,
            $push: {
              milestones: {
                date: milestoneDate,
                title: newMilestone.title,
                description: newMilestone.description,
                arweave_tx_id: transaction.id
              }
            }
          };

          arweaveTransaction = {
            transactionId: transaction.id,
            viewBlock: `https://viewblock.io/arweave/tx/${transaction.id}`
          };

          console.log('2. Update operation prepared:', {
            milestone: updateOperation.$push.milestones,
            transaction: arweaveTransaction
          });

          console.log('\n3. Transaction IDs Summary:');
          console.log('- Arweave Transaction ID:', transaction.id);
          console.log('- MongoDB Milestone arweave_tx_id:', updateOperation.$push.milestones.arweave_tx_id);
          console.log('- ViewBlock URL:', arweaveTransaction.viewBlock);

        } catch (error) {
          console.error('\n❌ Upload Process Failed');
          console.error('Error details:', error);
          throw new Error(`Failed to upload milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

      } else {
        console.log('\n=== Updating Existing Milestones ===');
        // For milestone updates (not new additions)
        const formattedMilestones = body.milestones.map((milestone: Milestone) => ({
          date: new Date(milestone.date),
          title: milestone.title,
          description: milestone.description,
          arweave_tx_id: milestone.arweave_tx_id // Preserve existing transaction IDs
        }));
        
        console.log('Formatted milestones:', formattedMilestones);
        
        updateOperation = {
          $set: {
            ...updateQuery,
            milestones: formattedMilestones
          }
        };
      }
    } else {
      console.log('\n=== Non-Milestone Update ===');
      updateOperation = { $set: updateQuery };
    }

    const user = await User.findByIdAndUpdate(
      params.id,
      updateOperation,
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Add verification log after update
    console.log('\n=== Final Verification ===');
    console.log('Updated user milestones:', user.milestones);
    console.log('Latest milestone transaction ID:', user.milestones[user.milestones.length - 1]?.arweave_tx_id);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        birthDay: user.birthDay,
        maritalStatus: user.maritalStatus,
        location: user.location,
        bio: user.bio,
        interests: user.interests,
        milestones: user.milestones,
        familyRole: user.familyRole,
        contributions: user.contributions,
        settings: user.settings
      },
      arweaveTransaction: arweaveTransaction
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    }, { status: 500 });
  }
} 