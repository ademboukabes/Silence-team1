// lib/pages/landing/landing_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../shifts/shifts_screen.dart';
import '../assistant/assistant_screen.dart';
import '../profile/profile_screen.dart';
import '../duty/widgets/duty_bottom_sheet.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  int _currentIndex = 0;

  bool isOnDuty = false;
  bool isPaused = false;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      const ShiftsScreen(),
      const AssistantScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0B1020),
      extendBody: true,
      body: Padding(
        padding: EdgeInsets.only(bottom: 90.h),
        child: pages[_currentIndex],
      ),
      bottomSheet: DutyBottomSheet(
        isOnDuty: isOnDuty,
        isPaused: isPaused,
        onToggleDuty: () {
          setState(() {
            if (!isOnDuty) {
              isOnDuty = true;
              isPaused = false;
            } else {
              isOnDuty = false;
              isPaused = false;
            }
          });
        },
        onTogglePause: isOnDuty
            ? () => setState(() => isPaused = !isPaused)
            : null,
        onFinish: isOnDuty
            ? () {
                setState(() {
                  isOnDuty = false;
                  isPaused = false;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Service terminé (démo).')),
                );
              }
            : null,
      ),
      bottomNavigationBar: BottomNavigationBar(
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedItemColor: const Color(0xFF6D28D9),
        unselectedItemColor: const Color(0xFFAAB3C5),
        backgroundColor: const Color(0xFF0B1020),
        elevation: 0,
        iconSize: 24.sp,
        selectedLabelStyle: TextStyle(
          fontSize: 12.sp,
          fontWeight: FontWeight.w600,
          fontFamily: 'Inter',
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 12.sp,
          fontWeight: FontWeight.w400,
          fontFamily: 'Inter',
        ),
        currentIndex: _currentIndex,
        onTap: (value) => setState(() => _currentIndex = value),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Icon(Icons.directions_bus_outlined),
            ),
            activeIcon: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Icon(Icons.directions_bus),
            ),
            label: 'Services',
          ),
          BottomNavigationBarItem(
            icon: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Icon(Icons.smart_toy_outlined),
            ),
            activeIcon: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Icon(Icons.smart_toy),
            ),
            label: 'Assistant',
          ),
          BottomNavigationBarItem(
            icon: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Icon(Icons.person_outline),
            ),
            activeIcon: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Icon(Icons.person),
            ),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
