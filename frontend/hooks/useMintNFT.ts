import { createNft, fetchDigitalAsset, verifyCollection } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, percentAmount, publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { COLLECTION_CONFIG } from "../app/config/collection";

// RPC endpoint constant
const RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=49c9ead2-a254-4550-b629-16a400348768';  // Replace with your Helius API key

// Use the pre-uploaded metadata URIs for each token number
const getMetadataUri = (nftNumber: number) => {
  // This should be replaced with your actual metadata URIs
  return `https://arweave.net/your-metadata-folder/metadata-${nftNumber}.json`;
};

// Replace file system based supply tracking with an API call or static value
const fetchCurrentSupply = async () => {
  try {
    // For now, return a static starting value
    // TODO: Replace with actual API call to your backend to get current supply
    return 0;
  } catch (error) {
    console.error("Error fetching supply:", error);
    return 0;
  }
};

export const useMintNFT = () => {
  // Function to estimate costs
  const estimateTransactionCosts = async (umi: any) => {
    const networkFee = 0.00016; // Standard network fee
    const rentExemption = 0.0149; // Rent exemption for account creation
    const totalCost = networkFee + rentExemption;

    // Get current SOL price
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      const solPrice = data.solana.usd;

      return {
        networkFee,
        rentExemption,
        totalCostSOL: totalCost,
        totalCostUSD: (totalCost * solPrice).toFixed(2),
        solPrice
      };
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return {
        networkFee,
        rentExemption,
        totalCostSOL: totalCost,
        totalCostUSD: null,
        solPrice: null
      };
    }
  };

  const mintNFT = async (wallet: any) => {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Initialize Umi with wallet
      const umi = createUmi(RPC_ENDPOINT)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet));

      // Check wallet balance and estimate costs
      const balance = await umi.rpc.getBalance(umi.identity.publicKey);
      const balanceInSol = Number(balance.basisPoints) / Math.pow(10, balance.decimals);
      
      // Get cost estimation
      const costs = await estimateTransactionCosts(umi);
      
      console.log('Estimated Transaction Costs:', {
        networkFee: `${costs.networkFee} SOL`,
        rentExemption: `${costs.rentExemption} SOL`,
        totalCost: `${costs.totalCostSOL} SOL`,
        totalCostUSD: costs.totalCostUSD ? `$${costs.totalCostUSD}` : 'Unknown',
        currentSOLPrice: costs.solPrice ? `$${costs.solPrice}` : 'Unknown',
        yourBalance: `${balanceInSol.toFixed(4)} SOL`
      });

      // Check if user has enough balance
      if (balanceInSol < costs.totalCostSOL) {
        throw new Error(`Insufficient balance. You need ${costs.totalCostSOL} SOL (${costs.totalCostUSD ? `$${costs.totalCostUSD}` : 'Unknown USD'}) for this transaction. Your balance: ${balanceInSol.toFixed(4)} SOL`);
      }

      // Return cost estimation first for user confirmation
      return {
        success: true,
        requiresConfirmation: true,
        costs: {
          networkFee: costs.networkFee,
          rentExemption: costs.rentExemption,
          totalCostSOL: costs.totalCostSOL,
          totalCostUSD: costs.totalCostUSD,
          solPrice: costs.solPrice
        }
      };

      // Rest of the minting code will be called after user confirms...

    } catch (error) {
      console.error("Error estimating costs:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  };

  // Separate function for actual minting after cost confirmation
  const executeMint = async (wallet: any) => {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Initialize Umi with wallet
      const umi = createUmi(RPC_ENDPOINT)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet));

      // First fetch the collection's metadata to use its URI
      const collectionNft = await fetchDigitalAsset(umi, publicKey(COLLECTION_CONFIG.address))
        .catch((error) => {
          console.error('Error fetching collection NFT:', error);
          return null;
        });
      
      if (!collectionNft) {
        throw new Error('Could not fetch collection data');
      }

      // Create new NFT mint
      const mint = generateSigner(umi);

      // Create NFT with collection linking
      const { signature } = await createNft(umi, {
        mint,
        name: "Street Economics",
        symbol: "SEC",
        uri: collectionNft.metadata.uri,
        sellerFeeBasisPoints: percentAmount(0),
        collection: {
          key: publicKey(COLLECTION_CONFIG.address),
          verified: true  // Set to true to properly link to collection
        },
        creators: [
          {
            address: umi.identity.publicKey,
            verified: true,
            share: 100
          }
        ],
        isCollection: false,
        isMutable: false,
        updateAuthority: umi.identity,
      }).sendAndConfirm(umi);

      // Verify the collection membership
      const metadata = findMetadataPda(umi, { mint: mint.publicKey });
      await verifyCollectionV1(umi, {
        metadata,
        collectionMint: publicKey(COLLECTION_CONFIG.address),
        authority: umi.identity,
      }).sendAndConfirm(umi);

      console.log('Transaction confirmed:', {
        signature,
        collection: COLLECTION_CONFIG.address,
        mint: mint.publicKey
      });

      return {
        signature,
        mintAddress: mint.publicKey,
        collectionAddress: COLLECTION_CONFIG.address,
        success: true
      };
    } catch (error) {
      console.error("Minting error:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  };

  return { mintNFT, executeMint };
}; 