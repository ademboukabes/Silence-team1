// ignore_for_file: must_be_immutable

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';
import 'package:listenlit/general_widgets/primarybutton.dart';
import 'package:listenlit/pages/landingScreen/landing_screen.dart';

class LoginPasswordScreen extends StatelessWidget {
  LoginPasswordScreen({super.key, required this.email});

  final TextEditingController passController = TextEditingController();
  final String email;
  final AuthController authController = Get.find<AuthController>();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(bottom: 24.h),
          child: Column(
            children: [
              SizedBox(height: 70.h),
              Text(
                'APCS',
                style: TextStyle(
                  fontSize: 28.sp,
                  fontWeight: FontWeight.w900,
                  color: cs.onSurface,
                  fontFamily: 'Inter',
                ),
              ),
              SizedBox(height: 16.h),
              Container(
                margin: EdgeInsets.symmetric(horizontal: 22.w),
                padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 24.h),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(26.r),
                  color: Theme.of(context).cardTheme.color ?? cs.surface,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 18,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      'Login',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface,
                        fontFamily: 'Inter',
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Text(
                      email,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: cs.onSurface.withOpacity(0.75),
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Inter',
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // ✅ modern field (plus blanc sur blanc, plus “rose”)
                    _buildModernField(
                      context: context,
                      hint: 'Password',
                      controller: passController,
                      obscureText: true,
                      prefixIcon: Icons.lock_outline_rounded,
                    ),

                    SizedBox(height: 14.h),
                    PrimaryButton(
                      onTap: _handleLogin,
                      borderRadius: 18.r,
                      fontSize: 14.sp,
                      height: 42.h,
                      width: 220.w,
                      text: 'Continue',
                      textColor: cs.onPrimary,
                      bgColor: cs.primary,
                    ),
                    Obx(() {
                      final err = authController.loginError.value;
                      if (err == null || err.isEmpty) {
                        return const SizedBox.shrink();
                      }
                      return Padding(
                        padding: EdgeInsets.only(top: 8.h),
                        child: Text(
                          err,
                          style: TextStyle(
                            color: cs.error,
                            fontSize: 12.sp,
                            fontFamily: 'Inter',
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    final pass = passController.text;
    if (pass.isEmpty) {
      authController.loginError.value = 'Please enter your password.';
      return;
    }
    final ok = await authController.login(email: email, password: pass);
    if (ok) {
      Get.off(() => const LandingScreen());
    }
  }

  Widget _buildModernField({
    required BuildContext context,
    required String hint,
    required TextEditingController controller,
    bool obscureText = false,
    IconData? prefixIcon,
  }) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return TextField(
      controller: controller,
      obscureText: obscureText,
      style: TextStyle(
        color: cs.onSurface,
        fontSize: 14.sp,
        fontWeight: FontWeight.w500,
      ),
      cursorColor: cs.primary,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: cs.onSurface.withOpacity(0.45),
          fontSize: 14.sp,
          fontWeight: FontWeight.w400,
        ),
        prefixIcon: prefixIcon == null
            ? null
            : Icon(prefixIcon, color: cs.primary, size: 20.sp),
        filled: true,
        fillColor: isDark ? cs.surfaceVariant : cs.surface,
        contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: BorderSide(
            color: cs.onSurface.withOpacity(0.08),
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: BorderSide(
            color: cs.onSurface.withOpacity(0.10),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: BorderSide(
            color: cs.primary.withOpacity(0.9),
            width: 1.5,
          ),
        ),
      ),
    );
  }
}
