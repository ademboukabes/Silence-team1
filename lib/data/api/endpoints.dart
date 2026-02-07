import 'package:flutter_dotenv/flutter_dotenv.dart';

class Endpoints {
  static String get baseUrl {
    final v = dotenv.env['BASE_URL'];
    if (v == null || v.isEmpty) {
      throw StateError('Missing BASE_URL in .env');
    }
    return v;
  }

  // Auth
  static const login = '/auth/login';
  static const signup = '/auth/signup';
  static const logout = '/auth/logout';
  static const profile = '/auth/profile';

  // Core resources
  static const trucks = '/trucks';
  static const gates = '/gates';

  // Bookings
  static const bookings = '/bookings';
  static String bookingStatus(String id) => '/bookings/$id/status';
  // Slots / Shifts (à aligner avec votre backend). Par défaut: /shifts
  static const shifts = '/shifts';

  // TODO: Not present in current backend spec.
  static String assistantHistory(String id) =>
      '/chat/conversations/$id/messages';
  static const assistantSend = '/chat/conversations';
  static const notifications = '/notifications/recent';
  static const notificationsRead = '/notifications/read';
}
