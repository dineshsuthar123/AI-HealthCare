// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HealthRecordVerification
 * @dev Smart contract for verifying health record integrity on the blockchain
 * 
 * This contract stores SHA-256 hashes of health records, allowing patients
 * to verify their medical records haven't been tampered with.
 * 
 * Key Features:
 * - Store record hashes with timestamps
 * - Patient consent management
 * - Access audit trail
 * - Provider authorization
 */
contract HealthRecordVerification {
    
    // ============ Structs ============
    
    struct RecordHash {
        bytes32 hash;           // SHA-256 hash of the record
        uint256 timestamp;      // When the record was registered
        address registeredBy;   // Address that registered the record
        bool exists;            // Whether this record exists
        bool isRevoked;         // Whether this record has been revoked
    }
    
    struct ConsentGrant {
        address provider;       // Healthcare provider address
        uint256 grantedAt;      // When consent was granted
        uint256 expiresAt;      // When consent expires (0 = never)
        bool isActive;          // Whether consent is currently active
        string scope;           // What the consent covers (e.g., "read", "write", "full")
    }
    
    struct AccessLog {
        address accessor;       // Who accessed the record
        uint256 timestamp;      // When it was accessed
        string action;          // What action was performed
    }
    
    // ============ State Variables ============
    
    // Mapping: patient address => record ID => RecordHash
    mapping(address => mapping(string => RecordHash)) private patientRecords;
    
    // Mapping: patient address => array of record IDs
    mapping(address => string[]) private patientRecordIds;
    
    // Mapping: patient address => provider address => ConsentGrant
    mapping(address => mapping(address => ConsentGrant)) private consents;
    
    // Mapping: record ID => array of AccessLogs
    mapping(string => AccessLog[]) private accessLogs;
    
    // Authorized healthcare providers
    mapping(address => bool) public authorizedProviders;
    
    // Contract owner
    address public owner;
    
    // ============ Events ============
    
    event RecordRegistered(
        address indexed patient,
        string indexed recordId,
        bytes32 hash,
        uint256 timestamp
    );
    
    event RecordRevoked(
        address indexed patient,
        string indexed recordId,
        uint256 timestamp
    );
    
    event ConsentGranted(
        address indexed patient,
        address indexed provider,
        string scope,
        uint256 expiresAt
    );
    
    event ConsentRevoked(
        address indexed patient,
        address indexed provider,
        uint256 timestamp
    );
    
    event RecordAccessed(
        address indexed patient,
        string indexed recordId,
        address indexed accessor,
        string action
    );
    
    event ProviderAuthorized(address indexed provider, bool status);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorizedProvider() {
        require(authorizedProviders[msg.sender], "Not an authorized provider");
        _;
    }
    
    modifier onlyPatientOrAuthorized(address patient) {
        require(
            msg.sender == patient || 
            (authorizedProviders[msg.sender] && hasValidConsent(patient, msg.sender)),
            "Not authorized to access this patient's records"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        authorizedProviders[msg.sender] = true;
    }
    
    // ============ Record Management ============
    
    /**
     * @dev Register a health record hash on the blockchain
     * @param recordId Unique identifier for the record (MongoDB _id)
     * @param recordHash SHA-256 hash of the record content
     */
    function registerRecord(
        string calldata recordId,
        bytes32 recordHash
    ) external {
        require(!patientRecords[msg.sender][recordId].exists, "Record already registered");
        require(recordHash != bytes32(0), "Invalid hash");
        
        patientRecords[msg.sender][recordId] = RecordHash({
            hash: recordHash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true,
            isRevoked: false
        });
        
        patientRecordIds[msg.sender].push(recordId);
        
        emit RecordRegistered(msg.sender, recordId, recordHash, block.timestamp);
    }
    
    /**
     * @dev Register a record on behalf of a patient (provider only)
     */
    function registerRecordForPatient(
        address patient,
        string calldata recordId,
        bytes32 recordHash
    ) external onlyAuthorizedProvider {
        require(hasValidConsent(patient, msg.sender), "No valid consent from patient");
        require(!patientRecords[patient][recordId].exists, "Record already registered");
        require(recordHash != bytes32(0), "Invalid hash");
        
        patientRecords[patient][recordId] = RecordHash({
            hash: recordHash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true,
            isRevoked: false
        });
        
        patientRecordIds[patient].push(recordId);
        
        emit RecordRegistered(patient, recordId, recordHash, block.timestamp);
    }
    
    /**
     * @dev Verify a record hash matches what's stored on-chain
     */
    function verifyRecord(
        address patient,
        string calldata recordId,
        bytes32 recordHash
    ) external view returns (bool isValid, uint256 registeredAt, bool isRevoked) {
        RecordHash storage record = patientRecords[patient][recordId];
        
        if (!record.exists) {
            return (false, 0, false);
        }
        
        return (
            record.hash == recordHash && !record.isRevoked,
            record.timestamp,
            record.isRevoked
        );
    }
    
    /**
     * @dev Get record details
     */
    function getRecord(
        address patient,
        string calldata recordId
    ) external view onlyPatientOrAuthorized(patient) returns (
        bytes32 hash,
        uint256 timestamp,
        address registeredBy,
        bool isRevoked
    ) {
        RecordHash storage record = patientRecords[patient][recordId];
        require(record.exists, "Record does not exist");
        
        // Log access
        // Note: This would need to be a separate transaction in practice
        
        return (record.hash, record.timestamp, record.registeredBy, record.isRevoked);
    }
    
    /**
     * @dev Revoke a record (patient only)
     */
    function revokeRecord(string calldata recordId) external {
        require(patientRecords[msg.sender][recordId].exists, "Record does not exist");
        require(!patientRecords[msg.sender][recordId].isRevoked, "Record already revoked");
        
        patientRecords[msg.sender][recordId].isRevoked = true;
        
        emit RecordRevoked(msg.sender, recordId, block.timestamp);
    }
    
    // ============ Consent Management ============
    
    /**
     * @dev Grant consent to a healthcare provider
     */
    function grantConsent(
        address provider,
        string calldata scope,
        uint256 durationInDays
    ) external {
        require(provider != address(0), "Invalid provider address");
        require(authorizedProviders[provider], "Provider not authorized");
        
        uint256 expiresAt = durationInDays > 0 
            ? block.timestamp + (durationInDays * 1 days) 
            : 0;
        
        consents[msg.sender][provider] = ConsentGrant({
            provider: provider,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true,
            scope: scope
        });
        
        emit ConsentGranted(msg.sender, provider, scope, expiresAt);
    }
    
    /**
     * @dev Revoke consent from a provider
     */
    function revokeConsent(address provider) external {
        require(consents[msg.sender][provider].isActive, "No active consent to revoke");
        
        consents[msg.sender][provider].isActive = false;
        
        emit ConsentRevoked(msg.sender, provider, block.timestamp);
    }
    
    /**
     * @dev Check if a provider has valid consent
     */
    function hasValidConsent(
        address patient,
        address provider
    ) public view returns (bool) {
        ConsentGrant storage consent = consents[patient][provider];
        
        if (!consent.isActive) {
            return false;
        }
        
        if (consent.expiresAt > 0 && block.timestamp > consent.expiresAt) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Get consent details
     */
    function getConsent(
        address patient,
        address provider
    ) external view returns (
        uint256 grantedAt,
        uint256 expiresAt,
        bool isActive,
        string memory scope
    ) {
        ConsentGrant storage consent = consents[patient][provider];
        return (consent.grantedAt, consent.expiresAt, consent.isActive, consent.scope);
    }
    
    // ============ Access Logging ============
    
    /**
     * @dev Log access to a record (called by authorized systems)
     */
    function logAccess(
        address patient,
        string calldata recordId,
        string calldata action
    ) external onlyAuthorizedProvider {
        accessLogs[recordId].push(AccessLog({
            accessor: msg.sender,
            timestamp: block.timestamp,
            action: action
        }));
        
        emit RecordAccessed(patient, recordId, msg.sender, action);
    }
    
    /**
     * @dev Get access logs for a record (patient only)
     */
    function getAccessLogs(
        string calldata recordId
    ) external view returns (AccessLog[] memory) {
        // Verify caller owns a record with this ID
        require(patientRecords[msg.sender][recordId].exists, "Not your record");
        return accessLogs[recordId];
    }
    
    // ============ Provider Management ============
    
    /**
     * @dev Authorize or deauthorize a provider
     */
    function setProviderAuthorization(
        address provider,
        bool status
    ) external onlyOwner {
        authorizedProviders[provider] = status;
        emit ProviderAuthorized(provider, status);
    }
    
    // ============ Utility Functions ============
    
    /**
     * @dev Get all record IDs for a patient
     */
    function getPatientRecordIds(
        address patient
    ) external view onlyPatientOrAuthorized(patient) returns (string[] memory) {
        return patientRecordIds[patient];
    }
    
    /**
     * @dev Get total number of records for a patient
     */
    function getRecordCount(address patient) external view returns (uint256) {
        return patientRecordIds[patient].length;
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
