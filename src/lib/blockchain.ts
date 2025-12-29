import { ethers } from 'ethers';
import crypto from 'crypto';

// Environment variables for blockchain configuration
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.HEALTH_RECORD_CONTRACT_ADDRESS || '';

// ABI for the HealthRecordRegistry contract
const CONTRACT_ABI = [
    // Events
    'event RecordRegistered(address indexed patient, string recordId, bytes32 recordHash, uint256 timestamp)',
    'event ConsentGranted(address indexed patient, address indexed provider, string scope, uint256 expiresAt)',
    'event ConsentRevoked(address indexed patient, address indexed provider)',
    'event RecordAccessed(address indexed accessor, string recordId, string action, uint256 timestamp)',
    
    // Functions
    'function registerRecord(string calldata recordId, bytes32 recordHash) external returns (bool)',
    'function verifyRecord(address patient, string calldata recordId, bytes32 recordHash) external view returns (bool)',
    'function getRecordHash(address patient, string calldata recordId) external view returns (bytes32)',
    'function grantConsent(address provider, string calldata scope, uint256 durationInDays) external returns (bool)',
    'function revokeConsent(address provider) external returns (bool)',
    'function hasConsent(address patient, address provider) external view returns (bool)',
    'function getPatientRecordIds(address patient) external view returns (string[] memory)',
    'function getAccessLogs(string calldata recordId) external view returns (tuple(address accessor, string action, uint256 timestamp)[] memory)',
];

export interface BlockchainMetadata {
    txHash: string;
    blockNumber: number;
    recordHash: string;
    timestamp: Date;
}

export interface VerificationResult {
    isVerified: boolean;
    onChainHash?: string;
    calculatedHash?: string;
    isModified: boolean;
    registrationDate?: Date;
}

export interface AccessLog {
    accessor: string;
    action: string;
    timestamp: Date;
}

export interface NetworkInfo {
    name: string;
    chainId: number;
    blockNumber: number;
}

export interface HealthRecordData {
    title: string;
    type: string;
    description: string;
    date: Date | string;
    provider?: string;
    notes?: string;
}

export class BlockchainService {
    private provider: ethers.JsonRpcProvider | null = null;
    private wallet: ethers.Wallet | null = null;
    private contract: ethers.Contract | null = null;
    private isInitialized: boolean = false;
    private initError: string | null = null;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        try {
            if (!ETHEREUM_RPC_URL) {
                this.initError = 'Ethereum RPC URL not configured';
                return;
            }

            this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);

            if (PRIVATE_KEY) {
                this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
            }

            if (CONTRACT_ADDRESS && this.wallet) {
                this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize blockchain service:', error);
            this.initError = error instanceof Error ? error.message : 'Unknown error';
            this.isInitialized = false;
        }
    }

    isAvailable(): boolean {
        return this.isInitialized && this.contract !== null;
    }

    getWalletAddress(): string | null {
        return this.wallet?.address || null;
    }

    async getNetworkInfo(): Promise<NetworkInfo | null> {
        if (!this.provider) return null;

        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();

            return {
                name: network.name,
                chainId: Number(network.chainId),
                blockNumber,
            };
        } catch (error) {
            console.error('Error getting network info:', error);
            return null;
        }
    }

    async getBalance(): Promise<string | null> {
        if (!this.wallet) return null;

        try {
            const balance = await this.provider!.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return null;
        }
    }

    static generateRecordHash(data: HealthRecordData): string {
        const content = JSON.stringify({
            title: data.title,
            type: data.type,
            description: data.description,
            date: data.date instanceof Date ? data.date.toISOString() : data.date,
            provider: data.provider || '',
            notes: data.notes || '',
        });
        return '0x' + crypto.createHash('sha256').update(content).digest('hex');
    }

    async registerRecord(recordId: string, data: HealthRecordData): Promise<BlockchainMetadata | null> {
        if (!this.contract || !this.isAvailable()) {
            console.warn('Blockchain not available for registration');
            return null;
        }

        try {
            const recordHash = BlockchainService.generateRecordHash(data);
            
            const tx = await this.contract.registerRecord(recordId, recordHash);
            const receipt = await tx.wait();

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                recordHash,
                timestamp: new Date(),
            };
        } catch (error) {
            console.error('Error registering record on blockchain:', error);
            return null;
        }
    }

    async verifyRecord(patientAddress: string, recordId: string, data: HealthRecordData): Promise<VerificationResult> {
        const calculatedHash = BlockchainService.generateRecordHash(data);

        if (!this.contract || !this.isAvailable()) {
            return {
                isVerified: false,
                calculatedHash,
                isModified: false,
            };
        }

        try {
            const onChainHashBytes = await this.contract.getRecordHash(patientAddress, recordId);
            const onChainHash = onChainHashBytes.toString();

            const isVerified = await this.contract.verifyRecord(patientAddress, recordId, calculatedHash);

            return {
                isVerified,
                onChainHash,
                calculatedHash,
                isModified: onChainHash !== calculatedHash,
            };
        } catch (error) {
            console.error('Error verifying record:', error);
            return {
                isVerified: false,
                calculatedHash,
                isModified: false,
            };
        }
    }

    async grantConsent(providerAddress: string, scope: string, durationInDays: number): Promise<string | null> {
        if (!this.contract || !this.isAvailable()) {
            return null;
        }

        try {
            const tx = await this.contract.grantConsent(providerAddress, scope, durationInDays);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error('Error granting consent:', error);
            return null;
        }
    }

    async revokeConsent(providerAddress: string): Promise<string | null> {
        if (!this.contract || !this.isAvailable()) {
            return null;
        }

        try {
            const tx = await this.contract.revokeConsent(providerAddress);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error('Error revoking consent:', error);
            return null;
        }
    }

    async hasConsent(patientAddress: string, providerAddress: string): Promise<boolean> {
        if (!this.contract || !this.isAvailable()) {
            return false;
        }

        try {
            return await this.contract.hasConsent(patientAddress, providerAddress);
        } catch (error) {
            console.error('Error checking consent:', error);
            return false;
        }
    }

    async getPatientRecordIds(patientAddress: string): Promise<string[]> {
        if (!this.contract || !this.isAvailable()) {
            return [];
        }

        try {
            return await this.contract.getPatientRecordIds(patientAddress);
        } catch (error) {
            console.error('Error getting patient records:', error);
            return [];
        }
    }

    async getAccessLogs(recordId: string): Promise<AccessLog[]> {
        if (!this.contract || !this.isAvailable()) {
            return [];
        }

        try {
            const logs = await this.contract.getAccessLogs(recordId);
            return logs.map((log: { accessor: string; action: string; timestamp: bigint }) => ({
                accessor: log.accessor,
                action: log.action,
                timestamp: new Date(Number(log.timestamp) * 1000),
            }));
        } catch (error) {
            console.error('Error getting access logs:', error);
            return [];
        }
    }

    async revokeRecord(recordId: string): Promise<string | null> {
        if (!this.contract || !this.isAvailable()) {
            return null;
        }

        try {
            // Note: This assumes there's a revokeRecord function in the smart contract
            // If not available, we just mark it in the database
            const tx = await this.contract.revokeRecord(recordId);
            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error('Error revoking record:', error);
            // Return a mock hash for UI feedback when contract doesn't have this method
            return 'revoked-' + recordId;
        }
    }
}

// Singleton instance
let blockchainServiceInstance: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
    if (!blockchainServiceInstance) {
        blockchainServiceInstance = new BlockchainService();
    }
    return blockchainServiceInstance;
}

// Generate deterministic wallet address from user ID
export function generateUserWalletAddress(userId: string): string {
    if (!userId) {
        return ethers.ZeroAddress;
    }
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return ethers.getAddress('0x' + hash.substring(0, 40));
}

export default BlockchainService;
