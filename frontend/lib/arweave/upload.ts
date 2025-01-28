import { arweave, FILE_UPLOAD_SETTINGS, createFileTags } from './config';

export interface UploadResult {
    transactionId: string;
    status: 'success' | 'error';
    message?: string;
}

export interface FileUploadProgress {
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    message?: string;
}

export class ArweaveUploader {
    private wallet: any;

    constructor(wallet: any) {
        this.wallet = wallet;
    }

    private validateFile(file: File): string | null {
        if (file.size > FILE_UPLOAD_SETTINGS.maxFileSize) {
            return `File size exceeds maximum allowed size of ${FILE_UPLOAD_SETTINGS.maxFileSize / (1024 * 1024)}MB`;
        }

        if (!FILE_UPLOAD_SETTINGS.allowedFileTypes.includes(file.type)) {
            return 'File type not supported';
        }

        return null;
    }

    async uploadFile(
        file: File, 
        userId: string, 
        familyId: string,
        onProgress?: (progress: FileUploadProgress) => void
    ): Promise<UploadResult> {
        try {
            // Validate file
            const validationError = this.validateFile(file);
            if (validationError) {
                return {
                    transactionId: '',
                    status: 'error',
                    message: validationError
                };
            }

            // Create file buffer
            const buffer = await file.arrayBuffer();
            
            // Prepare transaction
            const transaction = await arweave.createTransaction({
                data: buffer
            }, this.wallet);

            // Add tags
            const tags = createFileTags(file.type, userId, familyId);
            tags.forEach(({ name, value }) => {
                transaction.addTag(name, value);
            });

            // Sign transaction
            await arweave.transactions.sign(transaction, this.wallet);

            // Get uploader
            const uploader = await arweave.transactions.getUploader(transaction);

            // Upload
            while (!uploader.isComplete) {
                await uploader.uploadChunk();
                
                if (onProgress) {
                    onProgress({
                        progress: uploader.pctComplete,
                        status: 'uploading',
                        message: `Uploading: ${uploader.pctComplete}%`
                    });
                }
            }

            return {
                transactionId: transaction.id,
                status: 'success'
            };

        } catch (error) {
            return {
                transactionId: '',
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async getUploadStatus(transactionId: string): Promise<string> {
        try {
            const status = await arweave.transactions.getStatus(transactionId);
            return status.status === 200 ? 'confirmed' : 'pending';
        } catch (error) {
            return 'error';
        }
    }
} 