import 'package:flutter_dotenv/flutter_dotenv.dart';

class Endpoints {
  static final baseUrl = '${dotenv.env['BASE_URL']}';
  static const login = '/auth/login';
  static const me = '/drivers/me';

  static const nextBooking = '/bookings/next';
  static const notifications = '/notifications/recent';

  static const bookingInit =
      '/bookings/init'; // step1: import/export + terminal + camion
  static const bookingSlots = '/bookings/slots'; // step2: date -> time slots
  static const bookingReserve = '/bookings/reserve'; // confirmer un slot
}
