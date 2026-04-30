import CryptoJS from 'crypto-js';
import env from '../config/env';

/**
 * Immutable Ledger Engine for Cold Chain
 * Simulates a blockchain with hashing and previous block linking
 */
export class ColdChainBlockchain {
  constructor() {
    this.storageKey = env.STORAGE_KEY;
    const savedChain = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    
    if (savedChain) {
      try {
        this.chain = JSON.parse(savedChain);
        console.log("Blockchain loaded from persistence layer.");
      } catch (e) {
        console.error("Failed to load chain, resetting...", e);
        this.chain = [this.createGenesisBlock()];
      }
    } else {
      this.chain = [this.createGenesisBlock()];
    }
    
    this.pendingData = [];
  }

  saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.chain));
    }
  }

  clearChain() {
    this.chain = [this.createGenesisBlock()];
    this.saveToLocalStorage();
    window.location.reload();
  }

  seedDemoData() {
    this.addBlock({
      shipmentId: 'BATCH-2024-ALPHA',
      productName: 'Epinephrine Injection',
      manufacturerName: 'BioPharma Global',
      status: env.STATUS.GENESIS,
      temperature: '4.5'
    }, env.DEFAULT_PRODUCER_ID);
    
    this.addBlock({
      shipmentId: 'BATCH-2024-ALPHA',
      status: env.STATUS.PICKUP,
      sealNumber: 'SEAL-771',
      temperature: '4.6'
    }, env.DEFAULT_CARRIER_ID);
  }

  createGenesisBlock() {
    return {
      index: 0,
      timestamp: Date.now(),
      data: { message: env.BLOCKCHAIN_GENESIS_MSG },
      previousHash: "0",
      hash: "GENESIS",
      actor: "SYSTEM",
      signature: "0x0"
    };
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  calculateHash(block) {
    const { index, timestamp, data, previousHash, actor } = block;
    return CryptoJS.SHA256(
      index + timestamp + JSON.stringify(data) + previousHash + actor
    ).toString();
  }

  addBlock(data, actor) {
    const previousBlock = this.getLatestBlock();
    const newBlock = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      data: data,
      previousHash: previousBlock.hash,
      actor: actor,
      signature: `sig_${Math.random().toString(36).substr(2, 9)}` // Simulated signature
    };
    newBlock.hash = this.calculateHash(newBlock);
    
    // Freeze block to prevent accidental mutation in memory
    Object.freeze(newBlock);
    this.chain.push(newBlock);
    this.saveToLocalStorage();
    return newBlock;
  }

  verifyChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if current block's hash is correct
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return { 
          isValid: false, 
          reason: "Data Tampered (Hash Mismatch)", 
          blockIndex: i,
          actor: currentBlock.actor,
          timestamp: currentBlock.timestamp
        };
      }

      // Check if current block links correctly to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return { 
          isValid: false, 
          reason: "Chain Broken (Linkage Error)", 
          blockIndex: i,
          actor: currentBlock.actor,
          timestamp: currentBlock.timestamp
        };
      }
    }
    return { isValid: true };
  }

  // Fraud Detection: Check if specific data in the UI matches the blockchain record
  verifyDataIntegrity(shipmentId, field, value) {
    const relevantBlocks = this.chain.filter(b => b.data.shipmentId === shipmentId);
    // Find the latest record for this field
    for (let i = relevantBlocks.length - 1; i >= 0; i--) {
      if (relevantBlocks[i].data[field] !== undefined) {
        return relevantBlocks[i].data[field] === value;
      }
    }
    return true; // No record found to mismatch against
  }
}

export const chainInstance = new ColdChainBlockchain();
