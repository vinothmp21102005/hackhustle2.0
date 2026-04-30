import axios from 'axios';
import CryptoJS from 'crypto-js';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export async function uploadToIPFS(file) {
    // 1. Calculate REAL SHA-256 hash of the file first
    const hash = await calculateFileHash(file);
    const trueHash = 'SHA256:' + hash;

    // Check for authentication credentials
    const hasJWT = !!PINATA_JWT;
    const hasKeys = !!(PINATA_API_KEY && PINATA_SECRET_KEY);

    if (!hasJWT && !hasKeys) {
        console.warn("Pinata API keys are missing in .env file. Falling back to mock IPFS CID for demo purposes, but using real file hash.");
        return {
            cid: 'ipfs://mockCID_' + hash.substring(0, 16),
            hash: trueHash
        };
    }

    // 2. Upload to Pinata IPFS
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata for tracking
    const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
            sha256: hash,
            uploader: 'ColdChain-DApp'
        }
    });
    formData.append('pinataMetadata', metadata);
    
    const pinataOptions = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    const headers = {};
    if (hasJWT) {
        headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else {
        headers['pinata_api_key'] = PINATA_API_KEY;
        headers['pinata_secret_api_key'] = PINATA_SECRET_KEY;
    }

    try {
        const res = await axios.post(url, formData, {
            maxBodyLength: "Infinity", // needed for large files
            headers: headers // Let browser set Content-Type with proper boundary
        });
        
        return {
            cid: res.data.IpfsHash,
            hash: trueHash
        };
    } catch (error) {
        console.error("Error uploading file to Pinata:", error);
        
        // Final fallback for hackathon/demo stability if keys are invalid/expired
        if (error.response?.status === 401) {
            console.warn("Authentication failed (401). Falling back to local hashing simulation for continuity.");
            return {
                cid: 'ipfs://local-anchor-' + hash.substring(0, 12),
                hash: trueHash
            };
        }
        throw error;
    }
}

// Utility to calculate SHA-256 of a File object
function calculateFileHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            const wordArray = CryptoJS.lib.WordArray.create(data);
            const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
            resolve(hash);
        };
        reader.onerror = function(e) {
            reject(new Error("Failed to read file for hashing."));
        };
        reader.readAsArrayBuffer(file);
    });
}
