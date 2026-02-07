import '../providers/assistant_provider.dart';

class AssistantRepo {
  final AssistantProvider _provider;
  AssistantRepo(this._provider);

  Future<List<dynamic>> history() async {
    try {
      return await _provider.history();
    } catch (e) {
      // Tu peux logguer l'erreur ici ou la transformer
      throw Exception("Erreur lors de la récupération de l'historique : $e");
    }
  }

  Future<Map<String, dynamic>> send(String message) async {
    try {
      final response = await _provider.send(message);
      // On peut vérifier ici si la réponse contient bien les champs nécessaires
      return response;
    } catch (e) {
      throw Exception("L'assistant n'a pas pu répondre : $e");
    }
  }
}
