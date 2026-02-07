import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    private readonly logger = new Logger(ChatController.name);

    constructor(private readonly chatService: ChatService) { }

    @Post('conversations')
    @ApiOperation({ summary: 'Create a new conversation' })
    @ApiResponse({ status: 201, description: 'Conversation created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request data' })
    async createConversation(@Body() dto: CreateConversationDto) {
        this.logger.log(`POST /chat/conversations - userId: ${dto.userId}, role: ${dto.userRole}`);
        return this.chatService.createConversation(dto);
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Add a message to a conversation' })
    @ApiResponse({ status: 201, description: 'Message added successfully' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    async addMessage(
        @Param('id') conversationId: string,
        @Body() dto: AddMessageDto,
    ) {
        this.logger.log(`POST /chat/conversations/${conversationId}/messages - role: ${dto.role}`);
        return this.chatService.addMessage(conversationId, dto);
    }

    @Get('conversations/:id')
    @ApiOperation({ summary: 'Get conversation history with messages' })
    @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of messages to retrieve' })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
    async getConversationHistory(
        @Param('id') conversationId: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        const parsedLimit = limit ? parseInt(String(limit), 10) : 10;
        const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

        this.logger.log(`GET /chat/conversations/${conversationId} - limit: ${parsedLimit}, offset: ${parsedOffset}`);
        return this.chatService.getConversationHistory(conversationId, parsedLimit, parsedOffset);
    }

    @Delete('conversations/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a conversation' })
    @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    async deleteConversation(@Param('id') conversationId: string) {
        this.logger.log(`DELETE /chat/conversations/${conversationId}`);
        return this.chatService.deleteConversation(conversationId);
    }

    @Get('debug/prisma')
    @ApiOperation({ summary: 'Debug: Check Prisma client status (dev only)' })
    async debugPrisma() {
        if (process.env.NODE_ENV === 'production') {
            return { error: 'Debug endpoint disabled in production' };
        }

        try {
            await this.chatService['prisma'].$queryRaw`SELECT 1`;
            return {
                status: 'connected',
                prismaVersion: '4.15.0',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
