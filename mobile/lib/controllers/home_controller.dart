import 'package:get/get.dart';
import '../data/providers/booking_provider.dart';
import '../data/providers/notification_provider.dart';

class HomeController extends GetxController {
  final BookingProvider bookingProvider;
  final NotificationProvider notificationProvider;

  HomeController({
    required this.bookingProvider,
    required this.notificationProvider,
  });

  final loading = false.obs;
  final Rxn<Map<String, dynamic>> nextBooking = Rxn<Map<String, dynamic>>();
  final notifications = <Map<String, dynamic>>[].obs;
  final error = RxnString();

  Future<void> load() async {
    loading.value = true;
    error.value = null;
    try {
      final list = await bookingProvider.list();
      final first = list.isNotEmpty ? list.first : null;
      nextBooking.value =
          first == null ? null : Map<String, dynamic>.from(first);

      final notifList = await notificationProvider.recent();
      notifications.value =
          notifList.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      error.value = e.toString();
    } finally {
      loading.value = false;
    }
  }
}
