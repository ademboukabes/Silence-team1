String formatTwoDigits(int n) => n.toString().padLeft(2, '0');

String formatHHMM(DateTime dt) =>
    '${formatTwoDigits(dt.hour)}:${formatTwoDigits(dt.minute)}';

String formatDDMMYYYY(DateTime dt) =>
    '${formatTwoDigits(dt.day)}/${formatTwoDigits(dt.month)}/${dt.year}';
