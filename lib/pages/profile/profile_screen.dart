// lib/pages/profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';
import 'package:listenlit/pages/Auth/login_screen.dart';
import 'widgets/info_tile.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    final cs = Theme.of(context).colorScheme;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Profil',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w700,
              color: cs.onSurface,
              fontFamily: 'Inter',
            ),
          ),
          SizedBox(height: 12.h),
          Obx(() {
            final user = auth.user.value;

            final name = user?.name.toString() ?? '';
            final id = user?.id.toString() ?? '';

            return _Card(
              child: Column(
                children: [
                  // ✅ rang avatar + infos rapides
                  Row(
                    children: [
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name.isEmpty ? 'Utilisateur' : name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: cs.onSurface,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            SizedBox(height: 4.h),
                          ],
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 10.w,
                          vertical: 6.h,
                        ),
                        decoration: BoxDecoration(
                          color: cs.primary.withOpacity(0.10),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: cs.primary.withOpacity(0.20),
                          ),
                        ),
                      ),
                    ],
                  ),

                  SizedBox(height: 14.h),
                  Divider(color: cs.onSurface.withOpacity(0.10), height: 1),
                  SizedBox(height: 14.h),

                  InfoTile(label: 'Nom', value: name.isEmpty ? '-' : name),
                  InfoTile(label: 'ID', value: id.isEmpty ? '-' : id),

                  SizedBox(height: 14.h),
                  Divider(color: cs.onSurface.withOpacity(0.10), height: 1),
                  SizedBox(height: 14.h),

                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: Icon(Icons.logout_rounded, color: cs.error),
                      label: Text(
                        'Déconnexion',
                        style: TextStyle(
                          color: cs.error,
                          fontWeight: FontWeight.w700,
                          fontSize: 13.sp,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: cs.error.withOpacity(0.45)),
                        padding: EdgeInsets.symmetric(vertical: 12.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () async {
                        await auth.logout(); // adapte si besoin
                        Get.offAll(() => LoginScreen());
                      },
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [cs.surfaceVariant, cs.surface],
        ),
        border: Border.all(color: cs.onSurface.withOpacity(0.08), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(
              theme.brightness == Brightness.dark ? 0.20 : 0.10,
            ),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
