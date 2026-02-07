import '../providers/booking_provider.dart';

class BookingRepo {
  final BookingProvider _provider;
  BookingRepo(this._provider);

  Future<Map<String, dynamic>> getNextBooking() {
    return Future.value({});
  }

  Future<List<dynamic>> list() {
    return _provider.list();
  }

  Future<Map<String, dynamic>> create({
    required int gateId,
    required int truckId,
    required int carrierId,
    required int timeSlotId,
    required String driverName,
    required String driverEmail,
    required String driverPhone,
    required String driverMatricule,
    String? merchandiseDescription,
    String? notes,
  }) {
    return _provider.create(
      gateId: gateId,
      truckId: truckId,
      carrierId: carrierId,
      timeSlotId: timeSlotId,
      driverName: driverName,
      driverEmail: driverEmail,
      driverPhone: driverPhone,
      driverMatricule: driverMatricule,
      merchandiseDescription: merchandiseDescription,
      notes: notes,
    );
  }
}
