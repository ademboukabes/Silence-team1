import 'package:get/get.dart';
import '../data/providers/booking_provider.dart';

class BookingController extends GetxController {
  final BookingProvider provider;
  BookingController(this.provider);

  // Step 1
  final movementType = 'import'.obs; // import/export
  final terminalId = RxnString();
  final truckId = RxnString();

  // Step 2
  final selectedDate = RxnString(); // YYYY-MM-DD
  final slots = <Map<String, dynamic>>[].obs;
  final loadingSlots = false.obs;
  final reserving = false.obs;
  final error = RxnString();

  Future<void> loadSlots() async {
    // Guard: don't call API with missing params.
    if (terminalId.value == null ||
        truckId.value == null ||
        selectedDate.value == null) {
      return;
    }

    loadingSlots.value = true;
    error.value = null;

    try {
      final list = await provider.getSlots(
        terminalId: terminalId.value!,
        truckId: truckId.value!,
        movementType: movementType.value,
        date: selectedDate.value!,
      );
      slots.value = list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      error.value = e.toString();
      rethrow;
    } finally {
      loadingSlots.value = false;
    }
  }

  Future<void> reserve(String slotId) async {
    // Guard against null values to avoid runtime crash.
    if (terminalId.value == null || truckId.value == null) {
      throw StateError('terminalId/truckId manquant. Termine l’étape 1 avant.');
    }

    reserving.value = true;
    error.value = null;

    try {
      await provider.reserve(
        slotId: slotId,
        terminalId: terminalId.value!,
        truckId: truckId.value!,
        movementType: movementType.value,
      );
    } catch (e) {
      error.value = e.toString();
      rethrow;
    } finally {
      reserving.value = false;
    }
  }
}
