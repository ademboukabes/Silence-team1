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

  // RxnMap n'existe pas -> utilise Rxn<Map<...>> (nullable)
  final Rxn<Map<String, dynamic>> nextBooking = Rxn<Map<String, dynamic>>();

  final notifications = <Map<String, dynamic>>[].obs;
  final error = RxnString();

  Future<void> load() async {
    loading.value = true;
    error.value = null;
    try {
      final nb = await bookingProvider.getNextBooking();

      // sécurise le type au cas où le provider renvoie Map dynamique
      nextBooking.value = nb == null ? null : Map<String, dynamic>.from(nb);

      final list = await notificationProvider.recent();
      notifications.value = list
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    } catch (e) {
      error.value = e.toString();
    } finally {
      loading.value = false;
    }
  }
}
