// ignore_for_file: must_be_immutable

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';
import 'package:listenlit/general_widgets/primarybutton.dart';
import 'package:listenlit/pages/Auth/signup_screen.dart';
import 'package:listenlit/pages/landingScreen/landing_screen.dart';
import 'package:listenlit/pages/Auth/forgetpassword_screen.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passController = TextEditingController();
  final AuthController authController = Get.find<AuthController>();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          scrollDirection: Axis.vertical,
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
                      'Log in',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface,
                        fontFamily: 'Inter',
                      ),
                    ),

                    SizedBox(height: 16.h),

                    // EMAIL (plus blanc sur blanc)
                    _buildModernField(
                      context: context,
                      hint: 'Email',
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: Icons.email_outlined,
                    ),

                    SizedBox(height: 12.h),

                    // PASSWORD (plus rose)
                    _buildModernField(
                      context: context,
                      hint: 'Password',
                      controller: passController,
                      obscureText: true,
                      prefixIcon: Icons.lock_outline_rounded,
                    ),

                    SizedBox(height: 14.h),

                    PrimaryButton(
                      onTap: () async {
                        final email = emailController.text.trim();
                        final pass = passController.text;

                        if (email.isEmpty || pass.isEmpty) {
                          authController.loginError.value =
                              'Email and password required.';
                          return;
                        }

                        final ok = await authController.login(
                          email: email,
                          password: pass,
                        );

                        if (ok) {
                          Get.offAll(() => const LandingScreen());
                        }
                      },
                      borderRadius: 18.r,
                      fontSize: 14.sp,
                      height: 42.h,
                      width: 220.w,
                      text: 'Log in',
                      textColor: cs.onPrimary,
                      bgColor: cs.primary,
                    ),

                    SizedBox(height: 10.h),

                    TextButton(
                      onPressed: () {
                        Get.to(() => ForgetPasswordScreen());
                      },
                      child: Text(
                        'Forgot password?',
                        style: TextStyle(
                          color: cs.primary,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),

                    SizedBox(height: 6.h),

                    OutlinedButton(
                      onPressed: () {
                        Get.to(() => SignUpScreen());
                      },
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: cs.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(
                        'Create account',
                        style: TextStyle(
                          color: cs.primary,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),

                    SizedBox(height: 14.h),

                    _quickAccounts(context),

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

  Widget _buildModernField({
    required BuildContext context,
    required String hint,
    required TextEditingController controller,
    bool obscureText = false,
    TextInputType? keyboardType,
    IconData? prefixIcon,
  }) {
    final cs = Theme.of(context).colorScheme;

    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14.r),
      borderSide: BorderSide(color: cs.onSurface.withOpacity(0.10), width: 1),
    );

    final focusBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14.r),
      borderSide: BorderSide(color: cs.primary.withOpacity(0.85), width: 1.4),
    );

    return SizedBox(
      height: 46.h,
      width: double.infinity,
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        style: TextStyle(
          color: cs.onSurface,
          fontSize: 14.sp,
          fontFamily: 'Inter',
        ),
        cursorColor: cs.primary,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            color: cs.onSurface.withOpacity(0.45),
            fontSize: 14.sp,
            fontFamily: 'Inter',
          ),
          filled: true,
          fillColor: cs.surface,
          prefixIcon: prefixIcon == null
              ? null
              : Icon(
                  prefixIcon,
                  color: cs.onSurface.withOpacity(0.55),
                  size: 20.sp,
                ),
          contentPadding: EdgeInsets.symmetric(
            horizontal: 14.w,
            vertical: 14.h,
          ),
          border: baseBorder,
          enabledBorder: baseBorder,
          focusedBorder: focusBorder,
        ),
      ),
    );
  }

  Widget _quickAccounts(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        Text(
          'Quick access',
          style: TextStyle(
            color: cs.onSurface.withOpacity(0.8),
            fontSize: 12.sp,
            fontWeight: FontWeight.w700,
            fontFamily: 'Inter',
          ),
        ),
        SizedBox(height: 8.h),
        Wrap(
          spacing: 8.w,
          runSpacing: 8.h,
          alignment: WrapAlignment.center,
          children: [
            _quickButton(context, 'Demo Transitaire'),
            _quickButton(context, 'Demo Agent'),
          ],
        ),
      ],
    );
  }

  Widget _quickButton(BuildContext context, String label) {
    final cs = Theme.of(context).colorScheme;

    return OutlinedButton(
      onPressed: () {
        Get.off(() => const LandingScreen());
      },
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: cs.primary.withOpacity(0.6)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: cs.primary,
          fontSize: 11.sp,
          fontWeight: FontWeight.w600,
          fontFamily: 'Inter',
        ),
      ),
    );
  }
}
