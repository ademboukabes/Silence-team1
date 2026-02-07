import 'package:get/get.dart';
import 'package:flutter/material.dart';

class ThemeController extends GetxController {
  final themeMode = ThemeMode.dark.obs; // default

  void toggle() {
    themeMode.value = themeMode.value == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
  }

  void setDark() => themeMode.value = ThemeMode.dark;
  void setLight() => themeMode.value = ThemeMode.light;
}
