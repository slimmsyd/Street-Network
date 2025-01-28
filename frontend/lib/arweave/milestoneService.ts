import { TransactionManager, TransactionMetadata } from './transaction';
import { masterWallet } from './masterWallet';

export interface MilestoneData {
  userId: string;
  date: string;
  title: string;
  description: string;
  timestamp: number;
  type: 'milestone';
  metadata?: {
    userName: string;
    familyId?: string;
  }
}

export interface MilestoneTransactionResult {
  transactionId: string;
  status: 'success' | 'error';
  message?: string;
}

export class MilestoneService {
  static async createMilestone(
    milestoneData: MilestoneData
  ): Promise<MilestoneTransactionResult> {
    try {
      // Check wallet status
      const walletState = await masterWallet.getWalletState();
      if (!walletState) {
        throw new Error('Master wallet not initialized');
      }

      // Prepare metadata
      const metadata: TransactionMetadata = {
        userId: milestoneData.userId,
        familyId: 'SYSTEM_MILESTONE',
        contentType: 'application/json',
        accessControl: ['public'],
        originalOwner: milestoneData.userId
      };

      // Create and upload transaction
      const result = await TransactionManager.createTransaction(
        Buffer.from(JSON.stringify(milestoneData)),
        metadata
      );

      return {
        transactionId: result.id || '',
        status: result.status,
        message: result.message
      };

    } catch (error) {
      return {
        transactionId: '',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getMilestone(transactionId: string): Promise<MilestoneData | null> {
    try {
      const transaction = await TransactionManager.getTransaction(transactionId);
      if (!transaction) return null;

      // Decode the data from the transaction
      const decoder = new TextDecoder();
      const milestoneData = JSON.parse(decoder.decode(transaction.data));

      return milestoneData as MilestoneData;
    } catch (error) {
      console.error('Failed to fetch milestone:', error);
      return null;
    }
  }

  static async getUserMilestones(userId: string): Promise<string[]> {
    // This would query Arweave for all milestones where userId matches
    // For now, returning empty array as implementation would require GraphQL query to Arweave
    return [];
  }
} 