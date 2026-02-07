import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Replaces every NON-digit character with '*'.
/// Example: "12A-9" -> "12**9"
String convertNonDigitsToAsterisks({required String digits}) {
  final buf = StringBuffer();
  for (int i = 0; i < digits.length; i++) {
    final ch = digits[i];
    final isDigit = ch.codeUnitAt(0) >= 48 && ch.codeUnitAt(0) <= 57;
    buf.write(isDigit ? ch : '*');
  }
  if (kDebugMode) {
    print('${digits} -> ${buf.toString()} (convertNonDigitsToAsterisks)');
  }
  return buf.toString();
}

/// Replaces each '*' with the corresponding digit from [originalDigits].
/// This is useful when you show a masked value and want to rebuild the final value.
/// Example:
///   originalDigits="1234", convertedString="12**" -> "1234"
/// Notes:
/// - If [originalDigits] is shorter than the number of '*' needed, missing digits are ignored.
/// - If there is no '*', the string is returned as-is.
String convertAsterisksToNumber({
  required String convertedString,
  required String originalDigits,
}) {
  int digitIndex = 0;
  final buf = StringBuffer();

  for (int i = 0; i < convertedString.length; i++) {
    final ch = convertedString[i];
    if (ch == '*') {
      if (digitIndex < originalDigits.length) {
        buf.write(originalDigits[digitIndex]);
        digitIndex++;
      } else {
        // keep '*' if we don't have enough digits
        buf.write('*');
      }
    } else {
      buf.write(ch);
    }
  }

  if (kDebugMode) {
    print('${convertedString} -> ${buf.toString()} (convertAsterisksToNumber)');
  }
  return buf.toString();
}

class FourDigitFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final strippedValue = newValue.text.replaceAll(' ', '');

    final buf = StringBuffer();
    for (var i = 0; i < strippedValue.length; i += 4) {
      final end = (i + 4 <= strippedValue.length) ? i + 4 : strippedValue.length;
      buf.write(strippedValue.substring(i, end));
      if (end != strippedValue.length) buf.write(' ');
    }

    final formattedValue = buf.toString();
    return TextEditingValue(
      text: formattedValue,
      selection: TextSelection.collapsed(offset: formattedValue.length),
    );
  }
}

class CustomTrackShape extends RoundedRectSliderTrackShape {
  @override
  Rect getPreferredRect({
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    Offset offset = Offset.zero,
    bool isEnabled = false,
    bool isDiscrete = false,
  }) {
    final trackHeight = sliderTheme.trackHeight ?? 0;
    final trackLeft = offset.dx;
    final trackTop = offset.dy + (parentBox.size.height - trackHeight) / 2;
    final trackWidth = parentBox.size.width;
    return Rect.fromLTWH(trackLeft, trackTop, trackWidth, trackHeight);
  }
}
