import 'package:flutter/material.dart';
import '../utils/colors.dart';

class AppTheme {
  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);

    final scheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColor.kPrimary,
      onPrimary: AppColor.kWhiteColor,
      secondary: AppColor.kSamiAccentColor,
      onSecondary: AppColor.kGrey3Color,
      error: Colors.red,
      onError: Colors.white,
      surface: AppColor.kWhiteColor,
      onSurface: AppColor.kGrey3Color,
    );

    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColor.kLightWhite,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
      ),
      textTheme: base.textTheme.apply(
        bodyColor: scheme.onSurface,
        displayColor: scheme.onSurface,
      ),
      dividerColor: AppColor.kGreyColor.withOpacity(0.25),
      cardTheme: CardThemeData(
        color: AppColor.kWhiteColor,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColor.kLightAccentColor,
        hintStyle: TextStyle(color: AppColor.kGrey2Color),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: scheme.primary),
      ),
      iconTheme: IconThemeData(color: scheme.onSurface),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColor.kGrey3Color.withOpacity(0.95),
        contentTextStyle: TextStyle(color: AppColor.kWhiteColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);

    final scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: AppColor.kPrimary,
      onPrimary: AppColor.kWhiteColor,
      secondary: AppColor.kSamiAccentColor,
      onSecondary: AppColor.kGrey3Color,
      error: Colors.red,
      onError: Colors.white,
      surface: AppColor.kDarkBlue,
      onSurface: AppColor.kWhiteColor,
    );

    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColor.kBackGroundColor,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
      ),
      textTheme: base.textTheme.apply(
        bodyColor: scheme.onSurface,
        displayColor: scheme.onSurface,
      ),
      dividerColor: AppColor.kGrey2Color.withOpacity(0.25),
      cardTheme: CardThemeData(
        color: AppColor.kDarkBlue,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColor.kLightBGColor, // ton bg clair semi transparent
        hintStyle: TextStyle(color: AppColor.kGreyColor),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: scheme.primary),
      ),
      iconTheme: IconThemeData(color: scheme.onSurface),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColor.kDarkBlue.withOpacity(0.95),
        contentTextStyle: TextStyle(color: AppColor.kWhiteColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
