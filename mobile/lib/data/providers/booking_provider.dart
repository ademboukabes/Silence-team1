import '../api/api_client.dart';
import '../api/endpoints.dart';

class BookingProvider {
  final ApiClient api;
  BookingProvider(this.api);

  /// Récupère la liste de toutes les portes (Gates/Terminaux).
  /// Cette méthode est appelée par loadInit() dans le controller pour remplir le dropdown.
  Future<List<dynamic>> getGates() async {
    // Utilise l'endpoint /gates défini dans vos spécifications techniques
    final res = await api.dio.get(Endpoints.gates);
    return List<dynamic>.from(res.data);
  }

  /// Récupère les créneaux avec filtrage par Gate et par Date.
  /// Essentiel pour respecter la capacité max par jour du terminal.
  Future<List<dynamic>> getTimeSlots({int? gateId, String? date}) async {
    final res = await api.dio.get(
      Endpoints.shifts,
      queryParameters: {
        if (gateId != null) 'gateId': gateId,
        if (date != null) 'date': date, // Format YYYY-MM-DD
      },
    );
    return List<dynamic>.from(res.data);
  }

  /// Liste toutes les réservations (historique du transitaire).
  Future<List<dynamic>> list() async {
    final res = await api.dio.get(Endpoints.bookings);
    return List<dynamic>.from(res.data);
  }

  /// Récupère les détails d'une réservation spécifique (ex: pour générer un QR Code).
  Future<Map<String, dynamic>> getById(String id) async {
    final res = await api.dio.get('${Endpoints.bookings}/$id');
    return Map<String, dynamic>.from(res.data);
  }

  /// Crée une nouvelle réservation.
  Future<Map<String, dynamic>> create({
    required int gateId,
    required int truckId,
    required int carrierId,
    required int timeSlotId,
    required String driverName,
    required String driverEmail,
    required String driverPhone,
    required String driverMatricule,
    String? merchandiseDescription,
    String? notes,
  }) async {
    final data = <String, dynamic>{
      'gateId': gateId,
      'truckId': truckId,
      'carrierId': carrierId,
      'timeSlotId': timeSlotId,
      'driverName': driverName,
      'driverEmail': driverEmail,
      'driverPhone': driverPhone,
      'driverMatricule': driverMatricule,
      'status': 'PENDING',
    };
    if (merchandiseDescription != null && merchandiseDescription.isNotEmpty) {
      data['merchandiseDescription'] = merchandiseDescription;
    }
    if (notes != null && notes.isNotEmpty) {
      data['notes'] = notes;
    }

    final res = await api.dio.post(Endpoints.bookings, data: data);
    return Map<String, dynamic>.from(res.data);
  }

  /// Annule une réservation pour libérer le slot au port.
  Future<bool> cancel(String id) async {
    try {
      await api.dio.delete('${Endpoints.bookings}/$id');
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Met à jour les informations du chauffeur ou du camion si besoin.
  Future<Map<String, dynamic>> update(
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await api.dio.put('${Endpoints.bookings}/$id', data: data);
    return Map<String, dynamic>.from(res.data);
  }
}
