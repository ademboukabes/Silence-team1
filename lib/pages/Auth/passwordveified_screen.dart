// ignore_for_file: must_be_immutable

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';

import 'package:listenlit/general_widgets/primarybutton.dart';
import 'package:listenlit/pages/landingScreen/landing_screen.dart';

class PasswordVeifiedScreen extends StatelessWidget {
  PasswordVeifiedScreen({super.key, required this.email, required this.code});
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();
  final String email;
  final String code;
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
                'APOS',
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
                      'Set Password',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface,
                        fontFamily: 'Inter',
                      ),
                    ),

                    SizedBox(height: 16.h),

                    _softField(
                      hint: 'New password',
                      controller: passwordController,
                      obscureText: true,
                    ),

                    SizedBox(height: 12.h),

                    _softField(
                      hint: 'Confirm password',
                      controller: confirmPasswordController,
                      obscureText: true,
                    ),

                    SizedBox(height: 14.h),

                    PrimaryButton(
                      onTap: _handleReset,
                      borderRadius: 18.r,
                      fontSize: 14.sp,
                      height: 42.h,
                      width: 220.w,
                      text: 'Set Password',
                      textColor: cs.onPrimary,
                      bgColor: cs.primary,
                    ),

                    Obx(() {
                      final err = authController.resetError.value;
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

  Future<void> _handleReset() async {
    final pass = passwordController.text;
    final confirm = confirmPasswordController.text;
    if (pass.isEmpty || confirm.isEmpty) {
      authController.resetError.value = 'Please fill all fields.';
      return;
    }
    if (pass != confirm) {
      authController.resetError.value = 'Passwords do not match.';
      return;
    }
    final ok = await authController.resetPassword(
      email: email,
      newPassword: pass,
      code: code,
    );
    if (ok) {
      Get.off(() => const LandingScreen());
    }
  }

  Widget _softField({
    required String hint,
    required TextEditingController controller,
    bool obscureText = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      style: const TextStyle(color: Color(0xFF1C3D5A)),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(
          color: Color(0xFF3C5E78),
          fontWeight: FontWeight.w600,
        ),
        filled: true,
        fillColor: Colors.white.withOpacity(0.65),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
