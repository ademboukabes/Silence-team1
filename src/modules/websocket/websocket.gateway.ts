import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebsocketService } from './websocket.service';
import { Logger } from '@nestjs/common';
import { jwtConstants } from '../auth/auth.constant';

@WebSocketGateway({
    cors: {
        origin: '*', // Allow all origins for Docker/Client ease
    },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(WebsocketGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly websocketService: WebsocketService,
    ) { }

    afterInit(server: Server) {
        this.websocketService.setServer(server);
    }

    async handleConnection(client: Socket) {
        try {
            this.logger.log(`Client checking connection: ${client.id}`);
            // Extract token from query or headers
            const token =
                client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                this.logger.warn(`Client ${client.id} has no token. Disconnecting.`);
                client.disconnect();
                return;
            }

            // Verify JWT
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || jwtConstants.secret,
            });

            // Join user-specific room
            const userId = payload.sub;
            client.join(`user_${userId}`);
            this.logger.log(`✅ User ${userId} joined room user_${userId}`);

            // Join role-specific room
            if (payload.role) {
                const roleRoom = `role_${payload.role}`;
                client.join(roleRoom);
                this.logger.log(`✅ User ${userId} joined room ${roleRoom}`);
            } else {
                this.logger.warn(`User ${userId} has no role in payload.`);
            }

        } catch (err) {
            this.logger.error(`❌ Connection rejected for client ${client.id}: ${err.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client ${client.id} disconnected`);
    }
}
