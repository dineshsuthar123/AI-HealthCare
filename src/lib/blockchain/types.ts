/**
 * Blockchain Types and Interfaces
 * 
 * Type definitions for blockchain-related functionality in AI Healthcare
 */

export interface BlockchainConfig {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
    networkName?: string;
    chainId?: number;
}

export interface RecordVerificationResult {
    isValid: boolean;
    registeredAt: Date | null;
    isRevoked: boolean;
    transactionHash?: string;
    blockNumber?: number;
}

export interface BlockchainRecordMetadata {
    txHash: string;
    blockNumber: number;
    blockHash: string;
    timestamp: Date;
    recordHash: string;
    patientAddress: string;
    verified?: boolean;
}

export interface ConsentGrant {
    providerAddress: string;
    patientAddress: string;
    scope: ConsentScope;
    grantedAt: Date;
    expiresAt: Date | null;
    isActive: boolean;
    transactionHash?: string;
}

export type ConsentScope = 'read' | 'write' | 'full';

export interface AccessLogEntry {
    accessor: string;
    accessorName?: string;
    timestamp: Date;
    action: AccessAction;
    recordId: string;
    transactionHash?: string;
}

export type AccessAction = 'view' | 'create' | 'update' | 'delete' | 'share' | 'download';

export interface BlockchainTransaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    blockNumber: number;
    timestamp: Date;
    status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletInfo {
    address: string;
    balance: string;
    network: string;
    chainId: number;
}

export interface HealthRecordForBlockchain {
    _id: string;
    title: string;
    type: string;
    description: string;
    date: string | Date;
    provider?: string;
    notes?: string;
    userId: string;
}

export interface BlockchainVerificationStatus {
    isOnChain: boolean;
    isValid: boolean;
    registeredAt: Date | null;
    lastVerified: Date;
    txHash?: string;
    blockNumber?: number;
}

export interface BlockchainStats {
    totalRecordsOnChain: number;
    verifiedRecords: number;
    activeConsents: number;
    totalTransactions: number;
    lastActivity: Date | null;
}

// API Response types
export interface BlockchainApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    txHash?: string;
}

export interface RegisterRecordResponse {
    txHash: string;
    blockNumber: number;
    recordHash: string;
    timestamp: Date;
}

export interface VerifyRecordResponse {
    isValid: boolean;
    registeredAt: Date | null;
    isRevoked: boolean;
    recordHash: string;
}

export interface ConsentResponse {
    txHash: string;
    grantedAt: Date;
    expiresAt: Date | null;
    scope: ConsentScope;
}

// Smart contract event types
export interface RecordRegisteredEvent {
    patient: string;
    recordId: string;
    hash: string;
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
}

export interface ConsentGrantedEvent {
    patient: string;
    provider: string;
    scope: string;
    expiresAt: number;
    transactionHash: string;
    blockNumber: number;
}

export interface RecordAccessedEvent {
    patient: string;
    recordId: string;
    accessor: string;
    action: string;
    transactionHash: string;
    blockNumber: number;
}
