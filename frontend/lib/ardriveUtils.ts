import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Update to use root folder ID instead of drive ID
const FAMILY_LEGACY_ROOT_FOLDER_ID = '6f505f65-7c99-4af3-9889-f7dbd7240046';

// Use absolute path for wallet
const WALLET_PATH = path.join(process.cwd(), 'wallet.json');

export async function testArDriveUpload(filePath: string): Promise<boolean> {
  try {
    const command = `ardrive upload-file --local-path "${filePath}" --parent-folder-id "${FAMILY_LEGACY_ROOT_FOLDER_ID}" -w "${WALLET_PATH}"`;
    
    console.log('Executing command:', command);
    console.log('Checking if files exist:');
    console.log('- Wallet exists:', fs.existsSync(WALLET_PATH));
    console.log('- File exists:', fs.existsSync(filePath));
    
    // Execute command synchronously to get direct output
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true as any
    });
    
    console.log('Command output:', output);
    return true;
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      // Try to execute ardrive version to check if CLI is installed
      try {
        const ardriveVersion = execSync('ardrive --version', { encoding: 'utf8' });
        console.log('ArDrive CLI version:', ardriveVersion);
      } catch (versionError) {
        console.error('ArDrive CLI might not be installed or not in PATH');
      }
    }
    throw error;
  }
}

// Test function with more logging
export async function runUploadTest() {
  try {
    const testFilePath = path.join(process.cwd(), 'public', 'assets', 'chatSend.svg');
    
    // Verification logs
    console.log('Environment details:');
    console.log('- Current working directory:', process.cwd());
    console.log('- Wallet path:', WALLET_PATH);
    console.log('- Test file path:', testFilePath);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    // Check if files exist
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test file not found at: ${testFilePath}`);
    }
    if (!fs.existsSync(WALLET_PATH)) {
      throw new Error(`Wallet file not found at: ${WALLET_PATH}`);
    }
    
    // Check file permissions
    try {
      fs.accessSync(WALLET_PATH, fs.constants.R_OK);
      fs.accessSync(testFilePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error('Permission denied accessing files');
    }
    
    // Try to read wallet file to verify it's valid
    try {
      const walletContent = fs.readFileSync(WALLET_PATH, 'utf8');
      console.log('Wallet file is readable and contains data');
    } catch (error) {
      throw new Error('Failed to read wallet file');
    }
    
    console.log('Starting upload test...');
    const result = await testArDriveUpload(testFilePath);
    console.log('Upload test result:', result);
    return result;
  } catch (error) {
    console.error('Test upload failed:', error);
    throw error;
  }
}

export async function uploadMilestoneToArDrive(milestoneData: any): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Create a temporary JSON file with the milestone data
    const safeTitle = milestoneData.title.replace(/[^a-zA-Z0-9-_]/g, '_');
    const tempFilePath = path.join(process.cwd(), `${safeTitle}.json`);
    
    // Enhanced metadata structure
    const enhancedMetadata = {
      type: 'milestone',
      userId: milestoneData.user.id,
      milestone: {
        title: milestoneData.title,
        description: milestoneData.description,
        date: milestoneData.date
      },
      creator: {
        id: milestoneData.user.id,
        email: milestoneData.user.email,
        name: milestoneData.user.name
      },
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(tempFilePath, JSON.stringify(enhancedMetadata, null, 2));
    
    console.log('=== Milestone Upload Process ===');
    console.log('1. Creating milestone file:', tempFilePath);
    console.log('2. Metadata:', enhancedMetadata);

    // Step 1: Upload to Arweave with tags for querying
    const gqlTags = [
      'app', 'Kinnected',
      'type', 'milestone',
      'userId', milestoneData.user.id,
      'userEmail', milestoneData.user.email,
      'userName', milestoneData.user.name,
      'milestoneDate', milestoneData.date,
      'milestoneTitle', milestoneData.title
    ].map(t => `"${t}"`).join(' ');
    
    console.log('3. Uploading to Arweave with tags:', gqlTags.split(' ').map(t => t.replace(/"/g, '')));
    
    const arweaveCommand = `arweave deploy "${tempFilePath}" --data-gql-tags ${gqlTags}`;
    console.log('Executing Arweave command:', arweaveCommand);
    const arweaveOutput = execSync(arweaveCommand, { encoding: 'utf8' });
    console.log('4. Arweave upload response:', arweaveOutput);

    // Parse Arweave transaction ID
    const arweaveTxId = arweaveOutput.match(/Transaction ID: ([a-zA-Z0-9_-]+)/)?.[1];
    if (!arweaveTxId) {
      throw new Error('Could not find Arweave transaction ID in output');
    }

    // Step 2: Upload to ArDrive for organized storage
    console.log('5. Uploading to ArDrive...');
    const ardriveCommand = `ardrive upload-file --add-ipfs-tag --local-path "${tempFilePath}" --parent-folder-id "${FAMILY_LEGACY_ROOT_FOLDER_ID}" -w "${WALLET_PATH}"`;
    
    console.log('Executing ArDrive command:', ardriveCommand);
    const ardriveOutput = execSync(ardriveCommand, { encoding: 'utf8' });
    console.log('6. ArDrive upload response:', ardriveOutput);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    console.log('7. Cleaned up temporary file');
    
    try {
      const ardriveResult = JSON.parse(ardriveOutput);
      const fileInfo = ardriveResult.created.find((item: any) => item.type === 'file');
      
      console.log('8. Upload Success:', {
        arweaveTxId,
        ardrive: {
          entityId: fileInfo?.entityId,
          dataTxId: fileInfo?.dataTxId,
          metadataTxId: fileInfo?.metadataTxId,
          bundleId: fileInfo?.bundledIn
        }
      });

      return {
        success: true,
        transactionId: arweaveTxId // Return the Arweave transaction ID for MongoDB
      };
    } catch (parseError: any) {
      console.error('Failed to parse ArDrive output:', ardriveOutput);
      throw new Error(`Failed to parse ArDrive output: ${parseError?.message || 'Unknown parse error'}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

interface ArweaveMilestone {
  id: string;
  tags: { name: string; value: string }[];
  data: any;
  timestamp: string;
}

interface ArweaveEdge {
  node: {
    id: string;
    tags: { name: string; value: string }[];
    data: {
      size: number;
      type: string;
    };
    block?: {
      timestamp: string;
    };
    metadata: {
      app: string;
      type: string
      userEmail: string;
      userId: string;
      milestoneDate: string;
      title: string;
      description: string;
    };
  };
}

// Example queries for different scenarios
const MILESTONE_QUERIES = {
  // Get all milestones for a specific user
  userMilestones: (userEmail: string) => `{
    transactions(
      tags: [
        { name: "App-Name", values: ["Kinnected"] }
        { name: "Milestone-Content-Type", values: ["milestone"] }
        { name: "Kinnected-User-Email", values: ["${userEmail}"] }
      ]
      first: 100
    ) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          data {
            size
            type
          }
          block {
            timestamp
          }
        }
      }
    }
  }`,

  // Get all milestones for a specific family
  familyMilestones: (familyId: string) => `{
    transactions(
      tags: [
        { name: "App-Name", values: ["Kinnected"] }
        { name: "Milestone-Content-Type", values: ["milestone"] }
        { name: "Kinnected-Family-Folder", values: ["${familyId}"] }
      ]
      first: 100
    ) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          data {
            size
            type
          }
          block {
            timestamp
          }
        }
      }
    }
  }`,

  // Get milestones for a specific year
  yearMilestones: (familyId: string, year: string) => `{
    transactions(
      tags: [
        { name: "App-Name", values: ["Kinnected"] }
        { name: "Milestone-Content-Type", values: ["milestone"] }
        { name: "Kinnected-Family-Folder", values: ["${familyId}"] }
        { name: "Kinnected-Milestone-Year", values: ["${year}"] }
      ]
      first: 100
    ) {
      edges {
        node {
          id
          tags {
            name
            value
          }
          data {
            size
            type
          }
          block {
            timestamp
          }
        }
      }
    }
  }`
};

export async function fetchUserMilestones(userEmail: string): Promise<ArweaveMilestone[]> {
  try {
    console.log('Fetching milestones for user:', userEmail);
    
    // Use the userMilestones query
    const query = MILESTONE_QUERIES.userMilestones(userEmail);
    
    // Execute GraphQL query
    const response = await fetch('https://arweave.net/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    
    if (!result.data || !result.data.transactions || !result.data.transactions.edges) {
      throw new Error('Invalid GraphQL response format');
    }

    // Transform and validate the results
    const milestones = result.data.transactions.edges.map((edge: any) => {
      const tags = edge.node.tags.reduce((acc: any, tag: any) => {
        acc[tag.name] = tag.value;
        return acc;
      }, {});

      return {
        id: edge.node.id,
        timestamp: edge.node.block?.timestamp || new Date().toISOString(),
        tags,
        data: {
          type: tags['Milestone-Type'],
          year: tags['Milestone-Year'],
          date: tags['Milestone-Date'],
          userId: tags['User-Id'],
          userEmail: tags['User-Email'],
          userRole: tags['User-Role']
        }
      };
    });

    console.log('Found milestones:', {
      count: milestones.length,
      years: Array.from(new Set(milestones.map((m: ArweaveMilestone) => m.data.year))),
      types: Array.from(new Set(milestones.map((m: ArweaveMilestone) => m.data.type)))
    });

    return milestones;

  } catch (error) {
    console.error('Failed to fetch milestones:', error);
    throw error;
  }
}

// Example: Fetch all family milestones
export async function fetchFamilyMilestones(familyId: string): Promise<ArweaveMilestone[]> {
  try {
    const query = MILESTONE_QUERIES.familyMilestones(familyId);
    // ... similar implementation to fetchUserMilestones
    // You can implement this when needed
    throw new Error('Not implemented yet');
  } catch (error) {
    console.error('Failed to fetch family milestones:', error);
    throw error;
  }
}

// Example: Fetch year's milestones
export async function fetchYearMilestones(familyId: string, year: string): Promise<ArweaveMilestone[]> {
  try {
    const query = MILESTONE_QUERIES.yearMilestones(familyId, year);
    // ... similar implementation to fetchUserMilestones
    // You can implement this when needed
    throw new Error('Not implemented yet');
  } catch (error) {
    console.error('Failed to fetch year milestones:', error);
    throw error;
  }
} 