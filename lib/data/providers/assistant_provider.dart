import '../api/api_client.dart';
import '../api/endpoints.dart';

class AssistantProvider {
  final ApiClient api;
  AssistantProvider(this.api);

  /// Récupère l'historique des conversations
  Future<List<dynamic>> history() async {
    try {
      final res = await api.dio.get(Endpoints.assistantHistory);
      return List<dynamic>.from(res.data);
    } catch (e) {
      // On propage l'erreur pour que le controller puisse l'afficher
      rethrow;
    }
  }

  /// Envoie un message et reçoit la réponse de l'IA (qui peut déclencher un booking en back)
  Future<Map<String, dynamic>> send(String message) async {
    try {
      final res = await api.dio.post(
        Endpoints.assistantSend,
        data: {'message': message},
      );

      // On s'assure que la réponse est bien un Map
      return res.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
