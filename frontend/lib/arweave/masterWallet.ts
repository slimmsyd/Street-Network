import TestWeave from 'testweave-sdk';
import Arweave from 'arweave';

// Initialize Arweave instance
const arweave = Arweave.init({
    host: 'localhost',
    port: 1984,
    protocol: 'http',
    timeout: 20000,
    logging: false,
});

let testWeaveInstance: any = null;

// Initialize TestWeave
export const initTestWeave = async () => {
    try {
        if (!testWeaveInstance) {
            console.log('Initializing TestWeave...');
            testWeaveInstance = await TestWeave.init(arweave);
            console.log('TestWeave initialized');
        }
        
        return {
            testWeave: testWeaveInstance,
            wallet: testWeaveInstance.rootJWK
        };
    } catch (error) {
        console.error('TestWeave initialization failed:', error);
        throw error;
    }
};

// Master wallet interface
export interface MasterWalletConfig {
    address: string;
    balance: string;
    lastChecked: Date;
}

// Master wallet state management
class MasterWalletManager {
    private static instance: MasterWalletManager;
    private testWeaveInstance: any = null;
    private walletState: MasterWalletConfig | null = null;

    private constructor() {}

    static getInstance(): MasterWalletManager {
        if (!MasterWalletManager.instance) {
            MasterWalletManager.instance = new MasterWalletManager();
        }
        return MasterWalletManager.instance;
    }

    async getTestWeave() {
        if (!this.testWeaveInstance) {
            const { testWeave, wallet } = await initTestWeave();
            this.testWeaveInstance = testWeave;
        }
        return {
            testWeave: this.testWeaveInstance,
            wallet: this.testWeaveInstance.rootJWK
        };
    }

    async getWalletState(): Promise<MasterWalletConfig | null> {
        if (!this.testWeaveInstance) {
            const { testWeave } = await this.getTestWeave();
            const address = await arweave.wallets.getAddress(testWeave.rootJWK);
            this.walletState = {
                address,
                balance: '100000000000000',
                lastChecked: new Date()
            };
        }
        return this.walletState;
    }
}

export const masterWallet = MasterWalletManager.getInstance();
export { arweave }; 