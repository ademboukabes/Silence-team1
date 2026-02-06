// lib/pages/shifts/shifts_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'widgets/shift_card.dart';

class ShiftsScreen extends StatelessWidget {
  const ShiftsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
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
          const ShiftCard(
            title: 'SH-12034',
            subtitle: 'Depot Centre • Quai 2',
            time: '06:00 - 08:00',
            status: 'Confirmé',
          ),
          SizedBox(height: 12.h),
          const ShiftCard(
            title: 'SH-14011',
            subtitle: 'Depot Est • Quai 1',
            time: '09:00 - 11:00',
            status: 'En attente',
          ),
          SizedBox(height: 12.h),
          const ShiftCard(
            title: 'SH-15088',
            subtitle: 'Depot Ouest • Quai 4',
            time: '13:00 - 15:00',
            status: 'Confirmé',
          ),
        ],
      ),
    );
  }
}
