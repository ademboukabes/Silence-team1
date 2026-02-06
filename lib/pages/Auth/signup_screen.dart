// ignore_for_file: must_be_immutable

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/general_widgets/background_imagecontainer.dart';
import 'package:listenlit/general_widgets/primarybutton.dart';
import 'package:listenlit/general_widgets/primarytextfield.dart';
import 'package:listenlit/pages/Auth/choose_interest_view.dart';
import 'package:listenlit/pages/Auth/login_screen.dart';
import 'package:listenlit/pages/Auth/widgets/custom_richtext.dart';
import 'package:listenlit/general_widgets/passwordtextfield.dart';
import 'package:listenlit/pages/Auth/widgets/tremsandprivacytext.dart';
import 'package:listenlit/utils/colors.dart';
import 'package:listenlit/controllers/auth_controller.dart';

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
    return BackgroundImageContainer(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SingleChildScrollView(
          scrollDirection: Axis.vertical,
          child: Column(
            children: [
              Padding(
                padding: EdgeInsets.only(
                  top: 235.h,
                  right: 240.w,
                  bottom: 15.h,
                  left: 32.w,
                ),
                child: Text(
                  'Sign up',
                  style: TextStyle(
                    fontSize: 32.sp,
                    color: AppColor.kLightAccentColor,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: Container(
                  width: 358.w,
                  padding: EdgeInsets.symmetric(
                    horizontal: 12.w,
                    vertical: 24.h,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12.r),
                    color: AppColor.kSamiDarkColor.withOpacity(0.4),
                    boxShadow: [
                      BoxShadow(
                        color: AppColor.kSamiDarkColor.withOpacity(0.5),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      SizedBox(height: 24.h),
                      CustomRichText(
                        title:
                            'Looks like you don’t have an account.                                        ',
                        subtitle: 'Let’s create a new account for you.',
                        subtitleTextStyle: TextStyle(
                          color: AppColor.kLightAccentColor,
                          fontSize: 14.sp,
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w400,
                        ),
                        onTab: () {},
                      ),
                      SizedBox(height: 24.h),

                      PrimaryTextFormField(
                        hintText: 'Name',
                        controller: nameController,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        width: 326.w,
                        height: 48.h,
                      ),
                      SizedBox(height: 16.h),

                      PrimaryTextFormField(
                        hintText: 'Email',
                        controller: emailController,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        width: 326.w,
                        height: 48.h,
                      ),
                      SizedBox(height: 16.h),

                      PasswordTextField(
                        hintText: 'Password',
                        controller: passController,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        width: 326.w,
                        height: 48.h,
                      ),

                      SizedBox(height: 16.h),
                      const TermsAndPrivacyText(),
                      SizedBox(height: 16.h),

                      // ICI: bouton + erreur réactifs
                      Obx(() {
                        final isLoading = authController.signupLoading.value;
                        final err = authController.signupError.value;

                        return Column(
                          children: [
                            if (err != null && err.isNotEmpty)
                              Padding(
                                padding: EdgeInsets.only(bottom: 10.h),
                                child: Text(
                                  err,
                                  style: TextStyle(
                                    color: Colors.redAccent,
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
                              borderRadius: 8.r,
                              fontSize: 14.sp,
                              height: 48.h,
                              width: 326.w,
                              text: isLoading
                                  ? 'Creating...'
                                  : 'Create Account',
                              textColor: AppColor.kWhiteColor,
                              bgColor: AppColor.kPrimary,
                            ),
                          ],
                        );
                      }),

                      SizedBox(height: 24.h),

                      CustomRichText(
                        subtitle: ' Log in',
                        title: 'Already have an account?',
                        subtitleTextStyle: TextStyle(
                          color: AppColor.kPrimary,
                          fontSize: 14.sp,
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w700,
                        ),
                        onTab: () {
                          Get.off(() => LoginScreen());
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
