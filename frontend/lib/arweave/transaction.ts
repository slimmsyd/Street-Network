import { arweave, masterWallet } from './masterWallet';

export interface TransactionMetadata {
    userId: string;
    familyId: string;
    contentType: string;
    accessControl: string[];
    originalOwner: string;
}

export interface TransactionResult {
    id: string;
    status: 'success' | 'error';
    message?: string;
}

export class TransactionManager {
    static async createTransaction(
        data: Buffer | ArrayBuffer,
        metadata: TransactionMetadata,
        onProgress?: (progress: number) => void
    ): Promise<TransactionResult> {
        try {
            console.log('Starting transaction creation...');

            // Get TestWeave instance
            const { testWeave } = await masterWallet.getTestWeave();
            console.log('TestWeave instance retrieved');

            // Convert data to proper format
            let formattedData: Uint8Array;
            if (data instanceof Buffer) {
                formattedData = new Uint8Array(data);
            } else if (data instanceof ArrayBuffer) {
                formattedData = new Uint8Array(data);
            } else {
                throw new Error('Invalid data format. Must be Buffer or ArrayBuffer');
            }

            console.log('Data format check:', {
                originalType: data.constructor.name,
                isBuffer: data instanceof Buffer,
                isArrayBuffer: data instanceof ArrayBuffer,
                byteLength: data.byteLength,
                formattedLength: formattedData.length
            });

            // Create transaction with TestWeave's wallet
            const tx = await arweave.createTransaction({
                data: formattedData
            }, testWeave.rootJWK);

            console.log('Transaction created:', tx.id);

            // Add metadata tags
            tx.addTag('App-Name', 'Lineage');
            tx.addTag('Content-Type', metadata.contentType);
            tx.addTag('User-Id', metadata.userId);
            tx.addTag('Family-Id', metadata.familyId);
            tx.addTag('Original-Owner', metadata.originalOwner);
            tx.addTag('Access-Control', JSON.stringify(metadata.accessControl));
            tx.addTag('Upload-Date', new Date().toISOString());

            // Follow exact sequence from docs
            await arweave.transactions.sign(tx, testWeave.rootJWK);
            
            const statusBeforePost = await arweave.transactions.getStatus(tx.id);
            console.log('Status before post:', statusBeforePost); // Should be 404
            
            await arweave.transactions.post(tx);
            
            const statusAfterPost = await arweave.transactions.getStatus(tx.id);
            console.log('Status after post:', statusAfterPost); // Should be 202
            
            await testWeave.mine();
            
            const statusAfterMine = await arweave.transactions.getStatus(tx.id);
            console.log('Status after mine:', statusAfterMine); // Should be 200

            return {
                id: tx.id,
                status: 'success'
            };

        } catch (error) {
            console.error('Transaction creation failed:', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
            });
            return {
                id: '',
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    static async getTransaction(id: string): Promise<any> {
        try {
            console.log('Fetching transaction:', id);
            const { testWeave } = await masterWallet.getTestWeave();
            const transaction = await arweave.transactions.get(id);
            console.log('Transaction fetched:', {
                id: transaction.id,
                hasData: !!transaction.data,
                tags: transaction.tags
            });
            return {
                id: transaction.id,
                data: transaction.data,
                tags: transaction.tags
            };
        } catch (error) {
            console.error('Failed to fetch transaction:', {
                id,
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Failed to fetch transaction: ${error}`);
        }
    }

    static async getUserTransactions(userId: string): Promise<string[]> {
        console.log('Getting user transactions:', userId);
        return [];
    }

    static async getFamilyTransactions(familyId: string): Promise<string[]> {
        console.log('Getting family transactions:', familyId);
        return [];
    }
} 