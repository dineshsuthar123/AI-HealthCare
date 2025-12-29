/**
 * Blockchain Module Index
 * 
 * Re-exports all blockchain-related functionality
 */

export { 
    BlockchainService, 
    getBlockchainService,
    generateUserWalletAddress 
} from './blockchain-service';

export type {
    BlockchainConfig,
    RecordVerificationResult,
    BlockchainRecordMetadata,
    ConsentGrant,
    ConsentScope,
    AccessLogEntry,
    AccessAction,
    BlockchainTransaction,
    WalletInfo,
    HealthRecordForBlockchain,
    BlockchainVerificationStatus,
    BlockchainStats,
    BlockchainApiResponse,
    RegisterRecordResponse,
    VerifyRecordResponse,
    ConsentResponse,
    RecordRegisteredEvent,
    ConsentGrantedEvent,
    RecordAccessedEvent
} from './types';
