class Booking {
  final String id;
  final String terminal;
  final String quai; // Ajouté
  final String containerId; // Ajouté
  final String truckPlate; // C'est ton "driverMatricule"
  final String driverPhone;
  final String status;
  final DateTime? start;

  Booking({
    required this.id,
    required this.terminal,
    required this.quai,
    required this.containerId,
    required this.truckPlate,
    required this.driverPhone,
    required this.status,
    this.start,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: (json['id'] ?? '').toString(),
      terminal: (json['terminal'] ?? '').toString(),
      quai: (json['quai'] ?? '').toString(),
      containerId: (json['containerId'] ?? '').toString(),
      truckPlate: (json['truckPlate'] ?? json['driverMatricule'] ?? '')
          .toString(),
      driverPhone: (json['driverPhone'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      start: json['start'] != null
          ? DateTime.tryParse(json['start'].toString())
          : null,
    );
  }
}
