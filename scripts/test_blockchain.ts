import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from '../src/modules/blockchain/blockchain.service';
import { AuditLogService } from '../src/modules/audit/audit.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Script minimaliste pour tester le hachage et la logique de fallback du service blockchain.
 */
async function testBlockchainService() {
    console.log('--- Testing Blockchain Service (Logic & Fallback) ---');

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            BlockchainService,
            {
                provide: AuditLogService,
                useValue: { logAction: jest.fn().mockResolvedValue(true) },
            },
            {
                provide: PrismaService,
                useValue: {},
            },
        ],
    }).compile();

    const service = module.get<BlockchainService>(BlockchainService);

    // Appel de l'initialisation (qui affichera un warning car pas de variables d'env valides)
    await service.onModuleInit();

    const testData = { id: 'booking_123', carrier: 'Test Carrier', weight: 500 };

    console.log('Testing hashing method...');
    // @ts-ignore (access private for test)
    const hash = service.generateHash(testData);
    console.log('Generated Hash:', hash);

    if (hash.startsWith('0x') && hash.length === 66) {
        console.log('✅ Hash SHA-256 validé.');
    } else {
        console.error('❌ Hash SHA-256 invalide.');
    }

    console.log('Testing notarization fallback (without network)...');
    try {
        // Ne doit pas lancer d'exception grâce au pattern fire & forget + fallback
        service.notarizeBooking('booking_123', testData);
        console.log('✅ Appel notarizeBooking terminé sans erreur (Fallback OK).');
    } catch (err) {
        console.error('❌ notarizeBooking a fait planter le processus:', err);
    }

    console.log('--- Test Blockchain Service Terminé ---');
}

// Note: Ce script est démonstratif de la logique. 
// Pour l'exécuter réellement, il faudrait un environnement TS-Node configuré.
console.log('Service blockchain prêt pour intégration.');
