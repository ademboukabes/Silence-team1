// lib/pages/profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'widgets/info_tile.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Profil',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFamily: 'Inter',
            ),
          ),
          SizedBox(height: 12.h),
          const InfoTile(label: 'Nom', value: 'Chauffeur Démo'),
          const InfoTile(label: 'ID', value: 'DR-001'),
          const InfoTile(label: 'Compagnie', value: 'CityTransit'),
        ],
      ),
    );
  }
}
