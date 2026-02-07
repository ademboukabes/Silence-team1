// ignore_for_file: must_be_immutable

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';
import 'package:listenlit/general_widgets/primarybutton.dart';
import 'package:listenlit/pages/landingScreen/landing_screen.dart';
import 'package:listenlit/pages/agent/agent_scanner_screen.dart';
import 'package:listenlit/pages/Auth/login_screen.dart';
import 'package:listenlit/pages/Auth/widgets/tremsandprivacytext.dart';

class SignUpScreen extends StatelessWidget {
  SignUpScreen({super.key});

  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passController = TextEditingController();
  // 1. Nouveau contrôleur pour le code entreprise
  final TextEditingController companyCodeController = TextEditingController();

  final AuthController authController = Get.find<AuthController>();

  Future<void> _handleSignup() async {
    final name = nameController.text.trim();
    final email = emailController.text.trim();
    final pass = passController.text;
    final companyCode = companyCodeController.text.trim();

    if (name.isEmpty || email.isEmpty || pass.isEmpty) {
      authController.signupError.value = 'Please fill all fields.';
      return;
    }

    // On passe le companyCode à la méthode signup
    // (Assure-toi que ton AuthController accepte cet argument ou gère le via une autre méthode)
    final ok = await authController.signup(
      name: name,
      email: email,
      password: pass,
      // companyCode: companyCode, // Décommente si ton backend le supporte déjà
    );

    if (ok) {
      final role = authController.user.value?.role?.toLowerCase();
      if (role == 'agent' || role == 'agentt') {
        Get.offAll(() => const AgentScannerScreen());
      } else {
        Get.offAll(() => const LandingScreen());
      }
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
                      'Sign up',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface,
                        fontFamily: 'Inter',
                      ),
                    ),
                    SizedBox(height: 16.h),

                    _buildModernField(
                      context: context,
                      hint: 'Name',
                      controller: nameController,
                      prefixIcon: Icons.person_outline_rounded,
                    ),
                    SizedBox(height: 12.h),
                    _buildModernField(
                      context: context,
                      hint: 'Email',
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: Icons.mail_outline_rounded,
                    ),
                    SizedBox(height: 12.h),
                    // 2. AJOUT DU CHAMP COMPANY CODE
                    _buildModernField(
                      context: context,
                      hint: 'Company Code (Optional)',
                      controller: companyCodeController,
                      prefixIcon: Icons.business_rounded,
                    ),
                    SizedBox(height: 12.h),
                    _buildModernField(
                      context: context,
                      hint: 'Password',
                      controller: passController,
                      obscureText: true,
                      prefixIcon: Icons.lock_outline_rounded,
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

  // ... Ton widget _buildModernField reste identique
  Widget _buildModernField({
    required BuildContext context,
    required String hint,
    required TextEditingController controller,
    bool obscureText = false,
    IconData? prefixIcon,
    TextInputType? keyboardType,
  }) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
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
