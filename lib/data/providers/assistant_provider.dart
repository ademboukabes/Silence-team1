import '../api/api_client.dart';
import '../api/endpoints.dart';

class AssistantProvider {
  final ApiClient api;
  AssistantProvider(this.api);

  /// Récupère l'historique des conversations
  /// Récupère l'historique via l'ID de la conversation
  Future<List<dynamic>> history(String conversationId) async {
    try {
      // On ajoute l'ID à la fin de l'endpoint
      final res = await api.dio.get(
        '${Endpoints.assistantHistory}/$conversationId',
      );
      return List<dynamic>.from(res.data);
    } catch (e) {
      rethrow;
    }
  }

  /// ✅ Corrigé : On accepte maintenant le Map préparé par le controller
  Future<Map<String, dynamic>> send(Map<String, dynamic> payload) async {
    try {
      final res = await api.dio.post(
        Endpoints.assistantSend,
        data:
            payload, // ✅ On envoie le payload complet (message, user_id, role, etc.)
      );

      // On s'assure que la réponse est bien un Map
      return res.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
