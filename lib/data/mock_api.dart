import 'dart:math';
import '../model/shift.dart';

class MockApi {
  static final Random _rng = Random(7);

  static Future<bool> login({
    required String driverId,
    required String pin,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return driverId.trim().isNotEmpty && pin == '1234';
  }

  static Future<List<Shift>> fetchMyShifts({required String driverId}) async {
    await Future.delayed(const Duration(milliseconds: 550));
    final now = DateTime.now();

    DateTime slot(int daysFromNow, int startHour) {
      return DateTime(now.year, now.month, now.day + daysFromNow, startHour, 0);
    }

    ShiftStatus pickStatus(int i) {
      final options = [
        ShiftStatus.confirmed,
        ShiftStatus.pending,
        ShiftStatus.confirmed,
        ShiftStatus.started,
        ShiftStatus.completed,
      ];
      return options[i % options.length];
    }

    return List.generate(6, (i) {
      final start = slot(i == 0 ? 0 : i - 2, 6 + (i % 8));
      final end = start.add(const Duration(hours: 2));
      final id = 'SH-${10000 + _rng.nextInt(89999)}';

      return Shift(
        shiftId: id,
        depot: ['Depot Centre', 'Depot Est', 'Depot Ouest'][i % 3],
        bay: 'Quai ${1 + (i % 5)}',
        line: 'Ligne ${10 + (i % 7)}',
        route: [
          'Centre → Université',
          'Gare → Aéroport',
          'Stade → Hôpital',
        ][i % 3],
        start: start,
        end: end,
        status: pickStatus(i),
        operator: ['CityTransit', 'MetroBus', 'BlueLine'][i % 3],
        busNumber: 'BUS-${200 + (i % 40)}',
      );
    });
  }
}
