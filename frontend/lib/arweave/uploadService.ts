import { TransactionManager, TransactionMetadata, TransactionResult } from './transaction';
import { QuotaManager } from './quotaManager';
import { masterWallet } from './masterWallet';

export interface UploadOptions {
    file: File;
    userId: string;
    familyId: string;
    accessControl: string[];
    onProgress?: (progress: number) => void;
}

export interface UploadResponse extends TransactionResult {
    quotaRemaining?: number;
}

export class UploadService {
    static async upload(options: UploadOptions): Promise<UploadResponse> {
        try {
            // Check wallet status
            const walletState = await masterWallet.getWalletState();
            if (!walletState) {
                throw new Error('Master wallet not initialized');
            }

            // Check user quota
            const quotaCheck = await QuotaManager.checkQuota(options.userId, options.file.size);
            if (!quotaCheck.canUpload) {
                return {
                    id: '',
                    status: 'error',
                    message: quotaCheck.message,
                    quotaRemaining: quotaCheck.remainingStorage
                };
            }

            // Prepare file data
            const buffer = await options.file.arrayBuffer();

            // Prepare metadata
            const metadata: TransactionMetadata = {
                userId: options.userId,
                familyId: options.familyId,
                contentType: options.file.type,
                accessControl: options.accessControl,
                originalOwner: options.userId
            };

            // Create and upload transaction
            const result = await TransactionManager.createTransaction(
                buffer,
                metadata,
                options.onProgress
            );

            if (result.status === 'success') {
                // Update quota
                await QuotaManager.updateQuota(options.userId, options.file.size);

                return {
                    ...result,
                    quotaRemaining: quotaCheck.remainingStorage - options.file.size
                };
            }

            return result;

        } catch (error) {
            return {
                id: '',
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    static async getUploadStatus(transactionId: string): Promise<string> {
        try {
            const transaction = await TransactionManager.getTransaction(transactionId);
            return transaction ? 'completed' : 'pending';
        } catch (error) {
            return 'error';
        }
    }

    static async getUserUploads(userId: string): Promise<string[]> {
        return TransactionManager.getUserTransactions(userId);
    }

    static async getFamilyUploads(familyId: string): Promise<string[]> {
        return TransactionManager.getFamilyTransactions(familyId);
    }
} 