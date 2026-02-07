// ignore_for_file: must_be_immutable

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';
import 'package:listenlit/general_widgets/background_imagecontainer.dart';
import 'package:listenlit/general_widgets/primarybutton.dart';
import 'package:listenlit/pages/Auth/choose_interest_view.dart';
import 'package:listenlit/pages/Auth/login_screen.dart';
import 'package:listenlit/pages/Auth/widgets/tremsandprivacytext.dart';
import 'package:listenlit/utils/colors.dart';

class SignUpScreen extends StatelessWidget {
  SignUpScreen({super.key});

  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passController = TextEditingController();

  final AuthController authController = Get.find<AuthController>();

  Future<void> _handleSignup() async {
    final name = nameController.text.trim();
    final email = emailController.text.trim();
    final pass = passController.text;

    if (name.isEmpty || email.isEmpty || pass.isEmpty) {
      authController.signupError.value = 'Please fill all fields.';
      return;
    }

    final ok = await authController.signup(
      name: name,
      email: email,
      password: pass,
    );

    if (ok) {
      Get.to(() => const ChooseInterestScreen());
    }
  }

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
                      'Sign up',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface,
                        fontFamily: 'Inter',
                      ),
                    ),

                    SizedBox(height: 16.h),

                    _softField(hint: 'Name', controller: nameController),

                    SizedBox(height: 12.h),

                    _softField(hint: 'Email', controller: emailController),

                    SizedBox(height: 12.h),

                    _softField(
                      hint: 'Password',
                      controller: passController,
                      obscureText: true,
                    ),

                    SizedBox(height: 10.h),

                    const TermsAndPrivacyText(),

                    SizedBox(height: 12.h),

                    Obx(() {
                      final isLoading = authController.signupLoading.value;
                      final err = authController.signupError.value;

                      return Column(
                        children: [
                          if (err != null && err.isNotEmpty)
                            Padding(
                              padding: EdgeInsets.only(bottom: 8.h),
                              child: Text(
                                err,
                                style: TextStyle(
                                  color: cs.error,
                                  fontSize: 12.sp,
                                  fontFamily: 'Inter',
                                ),
                              ),
                            ),
                          PrimaryButton(
                            onTap: () {
                              if (isLoading) return;
                              _handleSignup();
                            },
                            borderRadius: 18.r,
                            fontSize: 14.sp,
                            height: 42.h,
                            width: 220.w,
                            text: isLoading ? 'Creating...' : 'Create Account',
                            textColor: cs.onPrimary,
                            bgColor: cs.primary,
                          ),
                        ],
                      );
                    }),

                    SizedBox(height: 16.h),

                    GestureDetector(
                      onTap: () => Get.off(() => LoginScreen()),
                      child: Text(
                        'Already have an account? Log in',
                        style: TextStyle(
                          color: cs.primary,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
