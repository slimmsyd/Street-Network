import { arweave } from './masterWallet';

export interface ArweaveKeyfile {
    kty: string;
    n: string;
    e: string;
    d: string;
    p: string;
    q: string;
    dp: string;
    dq: string;
    qi: string;
}

export class WalletUtils {
    static async generateWallet(): Promise<{
        address: string;
        key: ArweaveKeyfile;
    }> {
        try {
            // Generate a new JWK wallet
            const key = await arweave.wallets.generate();
            
            // Get the wallet address
            const address = await arweave.wallets.jwkToAddress(key);
            
            return {
                address,
                key: key as ArweaveKeyfile
            };
        } catch (error) {
            throw new Error('Failed to generate wallet: ' + error);
        }
    }

    static async getWalletBalance(address: string): Promise<string> {
        try {
            const balance = await arweave.wallets.getBalance(address);
            return arweave.ar.winstonToAr(balance);
        } catch (error) {
            throw new Error('Failed to get wallet balance: ' + error);
        }
    }

    static async getWalletAddress(key: ArweaveKeyfile): Promise<string> {
        try {
            return await arweave.wallets.jwkToAddress(key);
        } catch (error) {
            throw new Error('Failed to get wallet address: ' + error);
        }
    }
} 