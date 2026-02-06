import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { BookingCreatedPayload, CapacityAlertPayload } from './interfaces/ws.interfaces';

@Injectable()
export class WebsocketService {
    private server: Server;

    public setServer(server: Server) {
        this.server = server;
    }

    notifyOperators(terminalId: string, event: string, payload: any) {
        if (this.server) {
            // Logic for terminal specific room if we had it:
            // this.server.to(`terminal_${terminalId}`).emit(event, payload);

            // For now, notify all operators
            this.server.to('role_OPERATOR').emit(event, payload);
        }
    }

    notifyUser(userId: string, event: string, payload: any) {
        if (this.server) {
            this.server.to(`user_${userId}`).emit(event, payload);
        }
    }
}
