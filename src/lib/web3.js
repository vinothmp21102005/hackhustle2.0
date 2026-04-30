import { ethers } from "ethers";
import ColdChainArtifact from "../artifacts/contracts/ColdChain.sol/ColdChain.json";

// The contract address from Hardhat deployment
export const CONTRACT_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

// Default Hardhat Private Key (Account #0) - ONLY FOR LOCAL DEVELOPMENT
const DEV_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const CHAIN_ID = "0x7a69"; // 31337 in hex

export async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN_ID }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: CHAIN_ID,
                            chainName: 'Hardhat Localhost',
                            rpcUrls: [LOCAL_RPC_URL],
                            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                        },
                    ],
                });
            } catch (addError) {
                console.error("Failed to add network:", addError);
            }
        }
    }
}

export async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });

            // Auto-switch to Hardhat Localhost if on wrong chain
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== CHAIN_ID) {
                console.warn(`Wrong network detected: ${chainId}. Switching to ${CHAIN_ID}...`);
                await switchNetwork();
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            return { provider, signer, address, type: "metamask" };
        } catch (error) {
            console.error("User rejected request or error occurred", error);
            throw error;
        }
    } else {
        console.warn("MetaMask not found. Falling back to Local Dev Wallet...");
        try {
            const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
            const signer = new ethers.Wallet(DEV_PRIVATE_KEY, provider);
            const address = await signer.getAddress();
            return { provider, signer, address, type: "dev-wallet" };
        } catch (error) {
            console.error("Failed to connect to local node. Is 'npx hardhat node' running?", error);
            throw new Error("Could not connect to local blockchain. Please ensure 'npx hardhat node' is running.");
        }
    }
}

export async function getContract(signerOrProvider) {
    return new ethers.Contract(CONTRACT_ADDRESS, ColdChainArtifact.abi, signerOrProvider);
}
