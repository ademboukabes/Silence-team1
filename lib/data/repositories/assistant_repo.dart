import '../providers/assistant_provider.dart';

class AssistantRepo {
  final AssistantProvider _provider;
  AssistantRepo(this._provider);

  Future<List<dynamic>> history(String id) async {
    try {
      return await _provider.history(id);
    } catch (e) {
      throw Exception("Erreur lors de la récupération de l'historique : $e");
    }
  }

  Future<Map<String, dynamic>> send(Map<String, dynamic> payload) async {
    try {
      final response = await _provider.send(payload);

      return Map<String, dynamic>.from(response);
    } catch (e) {
      throw Exception("L'assistant n'a pas pu répondre : $e");
    }
  }
}
