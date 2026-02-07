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
            // Notify all types of operators/admins
            this.server.to('role_TERMINAL_OPERATOR').emit(event, payload);
            this.server.to('role_OPERATOR').emit(event, payload);
            this.server.to('role_ADMIN').emit(event, payload);
        }
    }

    notifyUser(userId: string, event: string, payload: any) {
        if (this.server) {
            this.server.to(`user_${userId}`).emit(event, payload);
        }
    }
}
