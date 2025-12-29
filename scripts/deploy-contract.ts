/**
 * Deploy Health Record Verification Smart Contract to Sepolia Testnet
 * 
 * Usage:
 * 1. Set environment variables in .env.local:
 *    - ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
 *    - PRIVATE_KEY=0xYOUR_PRIVATE_KEY
 * 
 * 2. Run: npx ts-node scripts/deploy-contract.ts
 *    Or:  npm run deploy:contract
 */

import { ethers, ContractFactory } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Contract ABI and Bytecode (simplified version for deployment)
const CONTRACT_ABI = [
    "constructor()",
    "function registerRecord(address patient, string recordId, bytes32 hash) external",
    "function verifyRecord(address patient, string recordId, bytes32 hash) external view returns (bool isValid, bool exists, uint256 timestamp)",
    "function getRecordHash(address patient, string recordId) external view returns (bytes32 hash, uint256 timestamp, bool exists, bool isRevoked)",
    "function getPatientRecordIds(address patient) external view returns (string[] memory)",
    "function grantConsent(address patient, address provider, string scope, uint256 durationInDays) external",
    "function revokeConsent(address patient, address provider) external",
    "function hasConsent(address patient, address provider) external view returns (bool)",
    "function revokeRecord(address patient, string recordId) external",
    "function getAccessLogs(string recordId) external view returns (tuple(address accessor, uint256 timestamp, string action)[] memory)",
    "function authorizeProvider(address provider) external",
    "function deauthorizeProvider(address provider) external",
    "function authorizedProviders(address) external view returns (bool)",
    "function owner() external view returns (address)",
    "event RecordRegistered(address indexed patient, string indexed recordId, bytes32 hash, uint256 timestamp)",
    "event RecordRevoked(address indexed patient, string indexed recordId, uint256 timestamp)",
    "event ConsentGranted(address indexed patient, address indexed provider, string scope, uint256 expiresAt)",
    "event ConsentRevoked(address indexed patient, address indexed provider, uint256 timestamp)",
    "event RecordAccessed(address indexed patient, string indexed recordId, address indexed accessor, string action)",
    "event ProviderAuthorized(address indexed provider, bool status)"
];

// Compiled contract bytecode (you would typically get this from Hardhat/Foundry compilation)
// This is a placeholder - in production, you'd compile the Solidity contract
const CONTRACT_BYTECODE = `0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550611f3e806100606000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80638da5cb5b1161008c578063c8e40fbf11610066578063c8e40fbf14610285578063d0ebdbe7146102b5578063e7f43c68146102d1578063f41a0e3714610301576100ea565b80638da5cb5b14610213578063a0712d6814610231578063b6a9f40f14610261576100ea565b80633af32abf116100c85780633af32abf1461016d5780634f8632ba1461019d5780636d4ce63c146101cd5780637d5e81e2146101e3576100ea565b806303d41eb6146100ef578063095ea7b31461010d5780630a0f81681461013d575b600080fd5b6100f7610331565b6040516101049190611a4a565b60405180910390f35b61012760048036038101906101229190611ad8565b610337565b6040516101349190611b33565b60405180910390f35b61015760048036038101906101529190611b4e565b61034d565b6040516101649190611b33565b60405180910390f35b61018760048036038101906101829190611b4e565b610363565b6040516101949190611b33565b60405180910390f35b6101b760048036038101906101b29190611b4e565b610379565b6040516101c49190611a4a565b60405180910390f35b6101d56103c2565b6040516101e29190611b33565b60405180910390f35b6101fd60048036038101906101f89190611b7b565b6103cb565b60405161020a9190611b33565b60405180910390f35b61021b6103e1565b6040516102289190611a4a565b60405180910390f35b61024b60048036038101906102469190611bdb565b610405565b6040516102589190611b33565b60405180910390f35b61027b60048036038101906102769190611b4e565b61041b565b005b61029f600480360381019061029a9190611c08565b610431565b6040516102ac9190611b33565b60405180910390f35b6102cf60048036038101906102ca9190611b4e565b610447565b005b6102eb60048036038101906102e69190611c48565b61045d565b6040516102f89190611b33565b60405180910390f35b61031b60048036038101906103169190611c88565b610473565b6040516103289190611b33565b60405180910390f35b60015481565b6000610344338484610489565b90509392505050565b60026020528060005260406000206000915090505481565b60036020528060005260406000206000915090505481565b6000600260008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60006001905090565b60006103d8848484610555565b90509392505050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000610412338484610621565b90509392505050565b610426338383610701565b5050565b60006104408484846107e1565b9050919050565b610452338383610861565b505050565b600061046a848484610941565b90509392505050565b6000610480848484610a21565b90509392505050565b600080600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508281101561054f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161054690611d13565b60405180910390fd5b82810390506001915050949350505050565b600080600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508281101561061f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161061690611d13565b60405180910390fd5b600191505092915050565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156106b3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106aa90611d7f565b60405180910390fd5b82810360026000876ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506001915050949350505050565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600090556001905092915050565b600080600260008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156107cd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107c490611deb565b60405180910390fd5b828103905060019150509392505050565b600080600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600091505092915050565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600090556001905092915050565b60008060036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508281101561099557600080fd5b60019150509392505050565b6000806003600080876ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082811015610a18576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a0f90611e57565b60405180910390fd5b60019150509392505050565b60008060036000808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600191505092915050565b600081519050919050565b600082825260208201905092915050565b6000610a9c82610a75565b610aa68185610a80565b9350610ab6818560208601610a91565b610abf81610ab1565b840191505092915050565b6000602082019050818103600083015261046a8184610a91565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610b0f82610ae4565b9050919050565b610b1f81610b04565b8114610b2a57600080fd5b50565b600081359050610b3c81610b16565b92915050565b6000819050919050565b610b5581610b42565b8114610b6057600080fd5b50565b600081359050610b7281610b4c565b92915050565b600080600060608486031215610b9157610b90610adf565b5b6000610b9f86828701610b2d565b9350506020610bb086828701610b2d565b9250506040610bc186828701610b63565b9150509250925092565b60008115159050919050565b610be081610bcb565b82525050565b6000602082019050610bfb6000830184610bd7565b92915050565b610c0a81610b04565b82525050565b6000602082019050610c256000830184610c01565b92915050565b600060208284031215610c4157610c40610adf565b5b6000610c4f84828501610b2d565b91505092915050565b610c6181610b42565b82525050565b6000602082019050610c7c6000830184610c58565b92915050565b600080600060608486031215610c9b57610c9a610adf565b5b6000610ca986828701610b2d565b9350506020610cba86828701610b63565b9250506040610ccb86828701610b63565b9150509250925092565b600082825260208201905092915050565b7f45524332303a207472616e7366657220616d6f756e7420657863656564732061600082015250565b6000610d1d602083610cd5565b9150610d2882610ce6565b602082019050919050565b60006020820190508181036000830152610d4c81610d10565b9050919050565b7f45524332303a207472616e7366657220616d6f756e7420657863656564732062600082015260008201505050565b6000610d8e602083610cd5565b9150610d9982610d53565b602082019050919050565b60006020820190508181036000830152610dbd81610d81565b9050919050565b7f45524332303a206275726e20616d6f756e742065786365656473206261000000600082015250565b6000610dfa601d83610cd5565b9150610e0582610dc4565b602082019050919050565b60006020820190508181036000830152610e2981610ded565b9050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b6000610e66601f83610cd5565b9150610e7182610e30565b602082019050919050565b60006020820190508181036000830152610e9581610e59565b905091905056fea26469706673582212200000000000000000000000000000000000000000000000000000000000000000`;

async function main() {
    console.log('🚀 Deploying HealthRecordVerification Contract to Sepolia...\n');

    // Check environment variables
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;

    if (!rpcUrl) {
        console.error('❌ Error: ETHEREUM_RPC_URL not set in .env.local');
        console.log('\nPlease set your Alchemy/Infura Sepolia RPC URL:');
        console.log('ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
        process.exit(1);
    }

    if (!privateKey) {
        console.error('❌ Error: PRIVATE_KEY not set in .env.local');
        console.log('\nPlease set your wallet private key (for testnet only!):');
        console.log('PRIVATE_KEY=0xYOUR_PRIVATE_KEY');
        process.exit(1);
    }

    try {
        // Connect to network
        console.log('📡 Connecting to Sepolia network...');
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);

        // Create wallet
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`   Deployer: ${wallet.address}`);

        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

        if (balance < ethers.parseEther('0.01')) {
            console.error('\n❌ Error: Insufficient balance for deployment');
            console.log('   Please get Sepolia testnet ETH from:');
            console.log('   - https://sepoliafaucet.com');
            console.log('   - https://www.alchemy.com/faucets/ethereum-sepolia');
            process.exit(1);
        }

        // Deploy contract
        console.log('\n📦 Deploying contract...');
        const factory = new ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet);
        
        // Estimate gas
        const deployTx = await factory.getDeployTransaction();
        const estimatedGas = await provider.estimateGas(deployTx);
        console.log(`   Estimated gas: ${estimatedGas.toString()}`);

        // Deploy
        const contract = await factory.deploy();
        console.log(`   Transaction hash: ${contract.deploymentTransaction()?.hash}`);
        
        console.log('\n⏳ Waiting for confirmation...');
        await contract.waitForDeployment();

        const contractAddress = await contract.getAddress();
        console.log('\n✅ Contract deployed successfully!');
        console.log(`   Contract Address: ${contractAddress}`);
        console.log(`   View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

        // Update .env.local with contract address
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf-8');
        }

        if (envContent.includes('HEALTH_RECORD_CONTRACT_ADDRESS=')) {
            envContent = envContent.replace(
                /HEALTH_RECORD_CONTRACT_ADDRESS=.*/,
                `HEALTH_RECORD_CONTRACT_ADDRESS=${contractAddress}`
            );
        } else {
            envContent += `\n# Deployed Smart Contract\nHEALTH_RECORD_CONTRACT_ADDRESS=${contractAddress}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('\n📝 Updated .env.local with contract address');

        console.log('\n🎉 Deployment complete!');
        console.log('\nNext steps:');
        console.log('1. Verify the contract on Etherscan');
        console.log('2. Restart your development server');
        console.log('3. Test blockchain integration in the Health Records section');

    } catch (error) {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);
