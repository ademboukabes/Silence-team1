// lib/models/slot.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Slot {
  final String id;
  final DateTime? start;
  final DateTime? end;
  final bool available;

  Slot({required this.id, this.start, this.end, required this.available});

  /// Getter pour afficher l'heure de manière formatée dans l'UI.
  /// Exemple de retour : "09:00 - 09:30"
  String get formattedTime {
    if (start == null || end == null) return 'Heure invalide';
    // Utilise le package intl pour un formatage robuste.
    return '${DateFormat.Hm().format(start!)} - ${DateFormat.Hm().format(end!)}';
  }

  /// Factory pour créer une instance de Slot à partir d'un JSON (Map).
  /// Gère plusieurs formats de clés possibles venant de l'API.
  factory Slot.fromJson(Map<String, dynamic> json) {
    // Tente de calculer la disponibilité par la capacité si les données sont présentes.
    final int? maxCapacity = int.tryParse(
      json['maxCapacity']?.toString() ?? '',
    );
    final int? currentBookings = int.tryParse(
      json['currentBookings']?.toString() ?? '',
    );

    bool isAvailable;
    if (maxCapacity != null && currentBookings != null) {
      // Logique plus sûre : on calcule la disponibilité nous-mêmes.
      isAvailable = maxCapacity > currentBookings;
    } else {
      // Si la capacité n'est pas fournie, on se fie au statut donné par l'API.
      isAvailable =
          json['available'] == true ||
          json['isAvailable'] == true ||
          json['status'] == 'available';
    }

    return Slot(
      id: (json['id'] ?? json['slotId'] ?? '').toString(),
      start: _parseDateTime(json['start'] ?? json['startAt']),
      end: _parseDateTime(json['end'] ?? json['endAt']),
      available: isAvailable,
    );
  }

  /// Helper privé pour parser une date de manière sécurisée.
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    // tryParse retourne null si le format est invalide, évitant un crash.
    return DateTime.tryParse(value.toString());
  }
}
