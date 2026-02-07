// lib/pages/shifts/shifts_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/shift_controller.dart';

import 'widgets/shift_card.dart';

class ShiftsScreen extends StatefulWidget {
  const ShiftsScreen({super.key});

  @override
  State<ShiftsScreen> createState() => _ShiftsScreenState();
}

class _ShiftsScreenState extends State<ShiftsScreen> {
  final ShiftController controller = Get.find<ShiftController>();

  @override
  void initState() {
    super.initState();
    controller.load();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Obx(() {
        if (controller.loading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.error.value != null) {
          return Center(
            child: Text(
              controller.error.value!,
              style: TextStyle(color: Colors.white, fontSize: 12.sp),
            ),
          );
        }
        final items = controller.shifts;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Mes services',
              style: TextStyle(
                fontSize: 20.sp,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                fontFamily: 'Inter',
              ),
            ),
            SizedBox(height: 12.h),
            if (items.isEmpty)
              Text(
                'Aucun service disponible.',
                style: TextStyle(
                  fontSize: 13.sp,
                  color: const Color(0xFFAAB3C5),
                  fontFamily: 'Inter',
                ),
              ),
            for (final item in items) ...[
              ShiftCard(
                title: (item['id'] ?? item['shiftId'] ?? '').toString(),
                subtitle:
                    '${item['depot'] ?? item['terminal'] ?? '-'} • ${item['bay'] ?? item['gate'] ?? '-'}',
                time:
                    '${item['start'] ?? '-'} - ${item['end'] ?? '-'}',
                status: (item['status'] ?? '').toString(),
              ),
              SizedBox(height: 12.h),
            ],
          ],
        );
      }),
    );
  }
}
