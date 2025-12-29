/**
 * Blockchain Service for AI Healthcare
 * 
 * Provides integration with Ethereum blockchain for:
 * - Health record verification (tamper-proof hashes)
 * - Patient consent management
 * - Immutable audit trails
 * 
 * Uses ethers.js v6 for Ethereum interaction
 */

import { ethers, Contract, Wallet, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';
import crypto from 'crypto';

// Contract ABI (Application Binary Interface) - simplified for key functions
const HEALTH_RECORD_ABI = [
    // Record Management
    "function registerRecord(string recordId, bytes32 recordHash) external",
    "function registerRecordForPatient(address patient, string recordId, bytes32 recordHash) external",
    "function verifyRecord(address patient, string recordId, bytes32 recordHash) view returns (bool isValid, uint256 registeredAt, bool isRevoked)",
    "function getRecord(address patient, string recordId) view returns (bytes32 hash, uint256 timestamp, address registeredBy, bool isRevoked)",
    "function revokeRecord(string recordId) external",
    
    // Consent Management
    "function grantConsent(address provider, string scope, uint256 durationInDays) external",
    "function revokeConsent(address provider) external",
    "function hasValidConsent(address patient, address provider) view returns (bool)",
    "function getConsent(address patient, address provider) view returns (uint256 grantedAt, uint256 expiresAt, bool isActive, string scope)",
    
    // Access Logging
    "function logAccess(address patient, string recordId, string action) external",
    "function getAccessLogs(string recordId) view returns (tuple(address accessor, uint256 timestamp, string action)[])",
    
    // Provider Management
    "function authorizedProviders(address) view returns (bool)",
    "function setProviderAuthorization(address provider, bool status) external",
    
    // Utility
    "function getPatientRecordIds(address patient) view returns (string[])",
    "function getRecordCount(address patient) view returns (uint256)",
    
    // Events
    "event RecordRegistered(address indexed patient, string indexed recordId, bytes32 hash, uint256 timestamp)",
    "event RecordRevoked(address indexed patient, string indexed recordId, uint256 timestamp)",
    "event ConsentGranted(address indexed patient, address indexed provider, string scope, uint256 expiresAt)",
    "event ConsentRevoked(address indexed patient, address indexed provider, uint256 timestamp)",
    "event RecordAccessed(address indexed patient, string indexed recordId, address indexed accessor, string action)"
];

// Types
export interface BlockchainConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
}

export interface RecordVerificationResult {
    isValid: boolean;
    registeredAt: Date | null;
    isRevoked: boolean;
    transactionHash?: string;
}

export interface ConsentDetails {
    grantedAt: Date;
    expiresAt: Date | null;
    isActive: boolean;
    scope: string;
}

export interface AccessLogEntry {
    accessor: string;
    timestamp: Date;
    action: string;
}

export interface BlockchainRecordMetadata {
    txHash: string;
    blockNumber: number;
    blockHash: string;
    timestamp: Date;
    recordHash: string;
    patientAddress: string;
}

// Singleton instance
let blockchainService: BlockchainService | null = null;

export class BlockchainService {
    private provider!: JsonRpcProvider;
    private wallet!: Wallet;
    private contract!: Contract;
    private isInitialized: boolean = false;

    constructor(config: BlockchainConfig) {
        if (!config.rpcUrl || !config.privateKey || !config.contractAddress) {
            console.warn('Blockchain service: Missing configuration, running in mock mode');
            this.isInitialized = false;
            return;
        }

        try {
            this.provider = new JsonRpcProvider(config.rpcUrl);
            this.wallet = new Wallet(config.privateKey, this.provider);
            this.contract = new Contract(config.contractAddress, HEALTH_RECORD_ABI, this.wallet);
            this.isInitialized = true;
            console.log('Blockchain service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize blockchain service:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Check if blockchain service is available
     */
    isAvailable(): boolean {
        return this.isInitialized;
    }

    /**
     * Generate SHA-256 hash of health record data
     */
    static generateRecordHash(record: {
        title: string;
        type: string;
        description: string;
        date: string | Date;
        provider?: string;
        notes?: string;
    }): string {
        const dataString = JSON.stringify({
            title: record.title,
            type: record.type,
            description: record.description,
            date: new Date(record.date).toISOString(),
            provider: record.provider || '',
            notes: record.notes || ''
        });
        
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Convert hex string to bytes32 for Solidity
     */
    private toBytes32(hexString: string): string {
        // Remove 0x prefix if present
        const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
        // Pad to 64 characters (32 bytes)
        return '0x' + cleanHex.padStart(64, '0');
    }

    /**
     * Register a health record hash on the blockchain
     */
    async registerRecord(
        recordId: string,
        recordData: {
            title: string;
            type: string;
            description: string;
            date: string | Date;
            provider?: string;
            notes?: string;
        }
    ): Promise<BlockchainRecordMetadata | null> {
        if (!this.isInitialized) {
            console.log('Blockchain service not available, skipping registration');
            return null;
        }

        try {
            const recordHash = BlockchainService.generateRecordHash(recordData);
            const bytes32Hash = this.toBytes32(recordHash);

            console.log(`Registering record ${recordId} with hash ${recordHash}`);

            const tx = await this.contract.registerRecord(recordId, bytes32Hash);
            const receipt = await tx.wait();

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                timestamp: new Date(),
                recordHash: recordHash,
                patientAddress: this.wallet.address
            };
        } catch (error) {
            console.error('Failed to register record on blockchain:', error);
            throw error;
        }
    }

    /**
     * Verify a health record against blockchain
     */
    async verifyRecord(
        patientAddress: string,
        recordId: string,
        recordData: {
            title: string;
            type: string;
            description: string;
            date: string | Date;
            provider?: string;
            notes?: string;
        }
    ): Promise<RecordVerificationResult> {
        if (!this.isInitialized) {
            return {
                isValid: false,
                registeredAt: null,
                isRevoked: false
            };
        }

        try {
            const recordHash = BlockchainService.generateRecordHash(recordData);
            const bytes32Hash = this.toBytes32(recordHash);

            const result = await this.contract.verifyRecord(patientAddress, recordId, bytes32Hash);
            
            return {
                isValid: result.isValid,
                registeredAt: result.registeredAt > 0 
                    ? new Date(Number(result.registeredAt) * 1000) 
                    : null,
                isRevoked: result.isRevoked
            };
        } catch (error) {
            console.error('Failed to verify record:', error);
            return {
                isValid: false,
                registeredAt: null,
                isRevoked: false
            };
        }
    }

    /**
     * Get record details from blockchain
     */
    async getRecordDetails(
        patientAddress: string,
        recordId: string
    ): Promise<{
        hash: string;
        timestamp: Date;
        registeredBy: string;
        isRevoked: boolean;
    } | null> {
        if (!this.isInitialized) return null;

        try {
            const result = await this.contract.getRecord(patientAddress, recordId);
            
            return {
                hash: result.hash,
                timestamp: new Date(Number(result.timestamp) * 1000),
                registeredBy: result.registeredBy,
                isRevoked: result.isRevoked
            };
        } catch (error) {
            console.error('Failed to get record details:', error);
            return null;
        }
    }

    /**
     * Revoke a health record on blockchain
     */
    async revokeRecord(recordId: string): Promise<string | null> {
        if (!this.isInitialized) return null;

        try {
            const tx = await this.contract.revokeRecord(recordId);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error('Failed to revoke record:', error);
            throw error;
        }
    }

    /**
     * Grant consent to a healthcare provider
     */
    async grantConsent(
        providerAddress: string,
        scope: string = 'read',
        durationInDays: number = 30
    ): Promise<string | null> {
        if (!this.isInitialized) return null;

        try {
            const tx = await this.contract.grantConsent(providerAddress, scope, durationInDays);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error('Failed to grant consent:', error);
            throw error;
        }
    }

    /**
     * Revoke consent from a provider
     */
    async revokeConsent(providerAddress: string): Promise<string | null> {
        if (!this.isInitialized) return null;

        try {
            const tx = await this.contract.revokeConsent(providerAddress);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error('Failed to revoke consent:', error);
            throw error;
        }
    }

    /**
     * Check if provider has valid consent
     */
    async hasValidConsent(patientAddress: string, providerAddress: string): Promise<boolean> {
        if (!this.isInitialized) return false;

        try {
            return await this.contract.hasValidConsent(patientAddress, providerAddress);
        } catch (error) {
            console.error('Failed to check consent:', error);
            return false;
        }
    }

    /**
     * Get consent details
     */
    async getConsentDetails(
        patientAddress: string,
        providerAddress: string
    ): Promise<ConsentDetails | null> {
        if (!this.isInitialized) return null;

        try {
            const result = await this.contract.getConsent(patientAddress, providerAddress);
            
            return {
                grantedAt: new Date(Number(result.grantedAt) * 1000),
                expiresAt: result.expiresAt > 0 
                    ? new Date(Number(result.expiresAt) * 1000) 
                    : null,
                isActive: result.isActive,
                scope: result.scope
            };
        } catch (error) {
            console.error('Failed to get consent details:', error);
            return null;
        }
    }

    /**
     * Get access logs for a record
     */
    async getAccessLogs(recordId: string): Promise<AccessLogEntry[]> {
        if (!this.isInitialized) return [];

        try {
            const logs = await this.contract.getAccessLogs(recordId);
            
            return logs.map((log: { accessor: string; timestamp: bigint; action: string }) => ({
                accessor: log.accessor,
                timestamp: new Date(Number(log.timestamp) * 1000),
                action: log.action
            }));
        } catch (error) {
            console.error('Failed to get access logs:', error);
            return [];
        }
    }

    /**
     * Get all record IDs for a patient
     */
    async getPatientRecordIds(patientAddress: string): Promise<string[]> {
        if (!this.isInitialized) return [];

        try {
            return await this.contract.getPatientRecordIds(patientAddress);
        } catch (error) {
            console.error('Failed to get patient record IDs:', error);
            return [];
        }
    }

    /**
     * Get wallet address
     */
    getWalletAddress(): string | null {
        if (!this.isInitialized) return null;
        return this.wallet.address;
    }

    /**
     * Get network information
     */
    async getNetworkInfo(): Promise<{
        name: string;
        chainId: bigint;
    } | null> {
        if (!this.isInitialized) return null;

        try {
            const network = await this.provider.getNetwork();
            return {
                name: network.name,
                chainId: network.chainId
            };
        } catch (error) {
            console.error('Failed to get network info:', error);
            return null;
        }
    }

    /**
     * Get wallet balance
     */
    async getBalance(): Promise<string | null> {
        if (!this.isInitialized) return null;

        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Failed to get balance:', error);
            return null;
        }
    }
}

/**
 * Get or create singleton blockchain service instance
 */
export function getBlockchainService(): BlockchainService {
    if (!blockchainService) {
        blockchainService = new BlockchainService({
            rpcUrl: process.env.ETHEREUM_RPC_URL || '',
            privateKey: process.env.PRIVATE_KEY || '',
            contractAddress: process.env.HEALTH_RECORD_CONTRACT_ADDRESS || 
                            process.env.PRODUCT_NFT_CONTRACT_ADDRESS || ''
        });
    }
    return blockchainService;
}

/**
 * Generate a deterministic wallet address from user ID
 * (For demo purposes - in production, users would connect their own wallets)
 */
export function generateUserWalletAddress(userId: string): string {
    const hash = crypto.createHash('sha256').update(userId + process.env.PRIVATE_KEY).digest('hex');
    return '0x' + hash.slice(0, 40);
}

export default BlockchainService;
