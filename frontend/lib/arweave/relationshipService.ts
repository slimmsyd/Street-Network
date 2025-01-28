import { TransactionManager, TransactionMetadata } from './transaction';
import { QuotaManager } from './quotaManager';
import { masterWallet } from './masterWallet';

export interface RelationshipData {
  fromUserId: string;
  toUserId: string;
  relationType: string;
  timestamp: number;
  verificationProof?: string;
  metadata?: {
    fromUserName: string;
    toUserName: string;
    createdBy: string;
    notes?: string;
  }
}

export interface RelationshipTransactionResult {
  transactionId: string;
  status: 'success' | 'error';
  message?: string;
}

export class RelationshipService {
  static async createRelationship(
    relationshipData: RelationshipData
  ): Promise<RelationshipTransactionResult> {
    try {
      // Check wallet status
      const walletState = await masterWallet.getWalletState();
      if (!walletState) {
        throw new Error('Master wallet not initialized');
      }

      // Prepare metadata
      const metadata: TransactionMetadata = {
        userId: relationshipData.fromUserId,
        familyId: 'SYSTEM_RELATIONSHIP',
        contentType: 'application/json',
        accessControl: ['public'],
        originalOwner: relationshipData.fromUserId
      };

      // Create and upload transaction
      const result = await TransactionManager.createTransaction(
        Buffer.from(JSON.stringify(relationshipData)),
        metadata
      );

      if (result.status === 'success') {
        return {
          transactionId: result.id,
          status: 'success'
        };
      }

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

  static async getRelationship(transactionId: string): Promise<RelationshipData | null> {
    try {
      const transaction = await TransactionManager.getTransaction(transactionId);
      if (!transaction) return null;

      // Decode the data from the transaction
      const decoder = new TextDecoder();
      const relationshipData = JSON.parse(decoder.decode(transaction.data));

      return relationshipData as RelationshipData;
    } catch (error) {
      console.error('Failed to fetch relationship:', error);
      return null;
    }
  }

  static async getUserRelationships(userId: string): Promise<string[]> {
    // This would query Arweave for all relationships where userId is either fromUserId or toUserId
    // For now, returning empty array as implementation would require GraphQL query to Arweave
    return [];
  }

  static async verifyRelationship(transactionId: string): Promise<boolean> {
    try {
      const transaction = await TransactionManager.getTransaction(transactionId);
      return !!transaction;
    } catch {
      return false;
    }
  }
} 