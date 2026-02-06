export interface BookingCreatedPayload {
    terminalId: string;
    bookingId: string;
    slotTime: Date;
}

export interface CapacityAlertPayload {
    gateId: string;
    gateName: string;
    currentLoad: number;
    maxCapacity: number;
}

export interface GatePassagePayload {
    gateId: number;
    gateName: string;
    bookingRef: string;
    truckPlate: string;
    timestamp: Date;
    status: 'GRANTED' | 'DENIED';
}

export interface BookingStatusUpdatedPayload {
    bookingId: string;
    newStatus: string;
    carrierId: string;
}
