import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { AuditLogService } from '../audit/audit.service';

@Injectable()
export class BlockchainService implements OnModuleInit {
    private readonly logger = new Logger(BlockchainService.name);
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;

    private readonly ABI = [
        "function notarize(string calldata _bookingId, bytes32 _dataHash) external",
        "function verify(string calldata _bookingId) external view returns (bytes32, uint256, address)",
        "event EntryNotarized(string indexed bookingId, bytes32 dataHash, uint256 timestamp)"
    ];

    constructor(
        private auditService: AuditLogService
    ) { }

    async onModuleInit() {
        try {
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
            const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
            const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

            if (!rpcUrl || !privateKey || !contractAddress) {
                this.logger.warn('Blockchain configuration missing. Operating in degraded mode.');
                return;
            }

            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers.Contract(contractAddress, this.ABI, this.wallet);

            this.logger.log('Blockchain service initialized successfully.');
        } catch (error) {
            this.logger.error(`Failed to initialize blockchain service: ${error.message}`);
        }
    }

    /**
     * Notarize booking data on the blockchain (Fire and Forget)
     */
    notarizeBooking(bookingId: string, bookingData: any): void {
        // Generate hash synchronously to ensure data integrity at the time of call
        const dataHash = this.generateHash(bookingData);

        // Fire and Forget pattern: do not await the promise chain
        this.sendToBlockchain(bookingId, dataHash).catch(err => {
            this.logger.error(`Background notarization failed for booking ${bookingId}: ${err.message}`);
        });
    }

    /**
     * Private method to generate SHA-256 hash from JSON object
     */
    private generateHash(data: any): string {
        const jsonString = JSON.stringify(data);
        return '0x' + crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    /**
     * Internal method to handle the blockchain transaction
     */
    private async sendToBlockchain(bookingId: string, dataHash: string): Promise<void> {
        if (!this.contract) {
            this.logger.warn(`Blockchain contract not initialized. Fallback: Skipping notarization for ${bookingId}`);
            return;
        }

        try {
            this.logger.log(`Initiating notarization for booking: ${bookingId} with hash: ${dataHash}`);

            const tx = await this.contract.notarize(bookingId, dataHash);
            this.logger.log(`Transaction sent: ${tx.hash}`);

            // Wait for confirmation in the background
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                this.logger.log(`Booking ${bookingId} successfully notarized. TX: ${tx.hash}`);

                // Log to AuditService (Assuming system user ID 0 for blockchain actions)
                await this.auditService.logAction(
                    0,
                    'BLOCKCHAIN_NOTARIZATION',
                    'SUCCESS',
                    'BOOKING',
                    bookingId,
                    { transactionHash: tx.hash, dataHash }
                );
            } else {
                throw new Error('Transaction failed on-chain');
            }

        } catch (error) {
            this.logger.error(`Error during blockchain notarization for booking ${bookingId}: ${error.message}`);

            // Fallback: Notify AuditService of failure
            await this.auditService.logAction(
                0,
                'BLOCKCHAIN_NOTARIZATION',
                'FAILED',
                'BOOKING',
                bookingId,
                { error: error.message, dataHash }
            );
        }
    }
}
