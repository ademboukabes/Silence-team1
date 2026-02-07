import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create a new conversation
     */
    async createConversation(dto: CreateConversationDto) {
        this.logger.log(`Creating conversation with role ${dto.userRole}${dto.userId ? ` for user ${dto.userId}` : ''}`);

        try {
            // Build data object - only include userId if it's provided and valid
            const data: any = {
                userRole: dto.userRole,
            };

            // Only set userId if provided (avoid null constraint issues)
            if (dto.userId !== undefined && dto.userId !== null) {
                data.userId = dto.userId;
            }

            const conversation = await this.prisma.conversation.create({
                data,
            });

            this.logger.log(`Conversation created: ${conversation.id}`);
            return conversation;
        } catch (error) {
            this.logger.error(`Failed to create conversation: ${error.message}`, error.stack);
            throw this.handlePrismaError(error);
        }
    }

    /**
     * Map Prisma errors to appropriate HTTP exceptions
     */
    private handlePrismaError(error: any) {
        const { code, meta } = error;

        switch (code) {
            case 'P2002':
                // Unique constraint violation
                throw new NotFoundException(
                    `Duplicate entry: ${meta?.target?.join(', ') || 'unknown field'}`
                );
            case 'P2003':
                // Foreign key constraint violation
                throw new NotFoundException(
                    `Related record not found: ${meta?.field_name || 'unknown relation'}`
                );
            case 'P2025':
                // Record not found
                throw new NotFoundException('Record not found');
            default:
                // Generic server error - log full error for debugging
                this.logger.error(`Unhandled Prisma error: ${code}`, error);
                throw new NotFoundException(`Database operation failed: ${error.message}`);
        }
    }

    /**
     * Add a message to an existing conversation
     */
    async addMessage(conversationId: string, dto: AddMessageDto) {
        this.logger.log(`Adding message to conversation ${conversationId}`);

        // Verify conversation exists
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException(`Conversation ${conversationId} not found`);
        }

        const message = await this.prisma.chatMessage.create({
            data: {
                conversationId,
                role: dto.role,
                content: dto.content,
                intent: dto.intent,
                metadata: dto.metadata,
            },
        });

        this.logger.log(`Message added: ${message.id}`);
        return message;
    }

    /**
     * Get conversation history with messages
     */
    async getConversationHistory(
        conversationId: string,
        limit: number = 10,
        offset: number = 0,
    ) {
        this.logger.log(`Fetching conversation ${conversationId} (limit=${limit}, offset=${offset})`);

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    skip: offset,
                    take: limit,
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException(`Conversation ${conversationId} not found`);
        }

        this.logger.log(`Retrieved conversation with ${conversation.messages.length} messages`);
        return conversation;
    }

    /**
     * Delete a conversation (cascade deletes messages)
     */
    async deleteConversation(conversationId: string) {
        this.logger.log(`Deleting conversation ${conversationId}`);

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException(`Conversation ${conversationId} not found`);
        }

        await this.prisma.conversation.delete({
            where: { id: conversationId },
        });

        this.logger.log(`Conversation deleted: ${conversationId}`);
        return { success: true, id: conversationId };
    }
}
