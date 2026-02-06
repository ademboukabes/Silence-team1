import '../api/api_client.dart';
import '../api/endpoints.dart';

class BookingProvider {
  final ApiClient api;
  BookingProvider(this.api);

  Future<Map<String, dynamic>> getNextBooking() async {
    final res = await api.dio.get(Endpoints.nextBooking);
    return Map<String, dynamic>.from(res.data);
  }

  Future<List<dynamic>> getSlots({
    required String terminalId,
    required String truckId,
    required String movementType, // import/export
    required String date, // YYYY-MM-DD
  }) async {
    final res = await api.dio.get(
      Endpoints.bookingSlots,
      queryParameters: {
        'terminalId': terminalId,
        'truckId': truckId,
        'movementType': movementType,
        'date': date,
      },
    );
    return List<dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> reserve({
    required String slotId,
    required String terminalId,
    required String truckId,
    required String movementType,
  }) async {
    final res = await api.dio.post(
      Endpoints.bookingReserve,
      data: {
        'slotId': slotId,
        'terminalId': terminalId,
        'truckId': truckId,
        'movementType': movementType,
      },
    );
    return Map<String, dynamic>.from(res.data);
  }
}
