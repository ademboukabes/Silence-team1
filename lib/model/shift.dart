import 'package:flutter/material.dart';
import '../utils/date_utils.dart';

enum ShiftStatus { pending, confirmed, started, completed, cancelled }

extension ShiftStatusX on ShiftStatus {
  String get label {
    switch (this) {
      case ShiftStatus.pending:
        return 'En attente';
      case ShiftStatus.confirmed:
        return 'Confirmé';
      case ShiftStatus.started:
        return 'En cours';
      case ShiftStatus.completed:
        return 'Terminé';
      case ShiftStatus.cancelled:
        return 'Annulé';
    }
  }

  Color get color {
    switch (this) {
      case ShiftStatus.pending:
        return Colors.orange;
      case ShiftStatus.confirmed:
        return Colors.green;
      case ShiftStatus.started:
        return Colors.blue;
      case ShiftStatus.completed:
        return Colors.blueGrey;
      case ShiftStatus.cancelled:
        return Colors.grey;
    }
  }
}

class Shift {
  final String shiftId;
  final String depot; // équivalent terminal
  final String bay; // équivalent gate/quai
  final String line; // ligne de bus
  final String route; // trajet
  final DateTime start;
  final DateTime end;
  ShiftStatus status;
  final String operator; // société / agence
  final String busNumber;

  Shift({
    required this.shiftId,
    required this.depot,
    required this.bay,
    required this.line,
    required this.route,
    required this.start,
    required this.end,
    required this.status,
    required this.operator,
    required this.busNumber,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      shiftId: (json['id'] ?? json['shiftId'] ?? '').toString(),
      depot: (json['depot'] ?? json['terminal'] ?? '').toString(),
      bay: (json['bay'] ?? json['gate'] ?? '').toString(),
      line: (json['line'] ?? '').toString(),
      route: (json['route'] ?? '').toString(),
      start: DateTime.tryParse(json['start']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      end: DateTime.tryParse(json['end']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      status: _statusFrom(json['status']),
      operator: (json['operator'] ?? json['company'] ?? '').toString(),
      busNumber: (json['busNumber'] ?? json['vehicle'] ?? '').toString(),
    );
  }

  static ShiftStatus _statusFrom(dynamic raw) {
    switch (raw?.toString().toLowerCase()) {
      case 'confirmed':
        return ShiftStatus.confirmed;
      case 'started':
        return ShiftStatus.started;
      case 'completed':
        return ShiftStatus.completed;
      case 'cancelled':
        return ShiftStatus.cancelled;
      default:
        return ShiftStatus.pending;
    }
  }

  String get timeRange =>
      '${formatHHMM(start)} - ${formatHHMM(end)}  (${formatDDMMYYYY(start)})';

  String get qrPayload =>
      'SHIFT=$shiftId|DEPOT=$depot|BAY=$bay|LINE=$line|START=${start.toIso8601String()}|BUS=$busNumber';
}
