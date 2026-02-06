// lib/pages/landing/widgets/duty_bottom_sheet.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class DutyBottomSheet extends StatelessWidget {
  final bool isOnDuty;
  final bool isPaused;
  final VoidCallback onToggleDuty;
  final VoidCallback? onTogglePause;
  final VoidCallback? onFinish;

  const DutyBottomSheet({
    super.key,
    required this.isOnDuty,
    required this.isPaused,
    required this.onToggleDuty,
    required this.onTogglePause,
    required this.onFinish,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        height: 86.h,
        padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
        decoration: BoxDecoration(
          color: const Color(0xFF0B1020),
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.06)),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.directions_bus,
              color: isOnDuty
                  ? const Color(0xFF6D28D9)
                  : const Color(0xFFAAB3C5),
            ),
            SizedBox(width: 10.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    isOnDuty ? 'Service en cours' : 'Hors service',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.sp,
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    isOnDuty
                        ? (isPaused ? 'Pause' : 'En route')
                        : 'Démarre ton service quand tu es prêt',
                    style: TextStyle(
                      color: const Color(0xFFAAB3C5),
                      fontSize: 12.sp,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
            ),
            if (isOnDuty) ...[
              OutlinedButton(
                onPressed: onTogglePause,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withOpacity(0.18)),
                  padding: EdgeInsets.symmetric(horizontal: 12.w),
                ),
                child: Text(isPaused ? 'Reprendre' : 'Pause'),
              ),
              SizedBox(width: 10.w),
              FilledButton(
                onPressed: onFinish,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF6D28D9),
                  padding: EdgeInsets.symmetric(horizontal: 12.w),
                ),
                child: const Text('Terminer'),
              ),
              SizedBox(width: 10.w),
            ],
            FilledButton(
              onPressed: onToggleDuty,
              style: FilledButton.styleFrom(
                backgroundColor: isOnDuty
                    ? Colors.grey.shade700
                    : const Color(0xFF6D28D9),
                padding: EdgeInsets.symmetric(horizontal: 12.w),
              ),
              child: Text(isOnDuty ? 'Stop' : 'Start'),
            ),
          ],
        ),
      ),
    );
  }
}
