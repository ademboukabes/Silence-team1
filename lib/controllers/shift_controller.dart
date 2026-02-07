import 'package:get/get.dart';
import '../data/repositories/shift_repo.dart';

class ShiftController extends GetxController {
  final ShiftRepo repo;
  ShiftController(this.repo);

  final loading = false.obs;
  final error = RxnString();
  final shifts = <Map<String, dynamic>>[].obs;

  Future<void> load() async {
    loading.value = true;
    error.value = null;
    try {
      final list = await repo.list();
      shifts.value = list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      error.value = e.toString();
    } finally {
      loading.value = false;
    }
  }
}
