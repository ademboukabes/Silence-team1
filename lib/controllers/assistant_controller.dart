import 'package:get/get.dart';
import '../data/repositories/assistant_repo.dart';

class AssistantController extends GetxController {
  final AssistantRepo repo;
  AssistantController(this.repo);

  final loading = false.obs;
  final sending = false.obs;
  final error = RxnString();
  final messages = <Map<String, dynamic>>[].obs;

  @override
  void onInit() {
    super.onInit();
    loadHistory(); // On charge l'historique dès l'ouverture du chat
  }

  Future<void> loadHistory() async {
    loading.value = true;
    error.value = null;
    try {
      final list = await repo.history();
      messages.value = list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      error.value = "Impossible de charger l'historique";
    } finally {
      loading.value = false;
    }
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    // 1. On ajoute immédiatement le message de l'utilisateur dans la liste (UI réactive)
    final userMessage = {
      "role": "user",
      "content": text,
      "createdAt": DateTime.now().toIso8601String(),
    };
    messages.add(userMessage);

    sending.value = true;
    error.value = null;

    try {
      // 2. On envoie au backend
      final res = await repo.send(text);

      // 3. On ajoute la réponse de l'IA (le backend renvoie le message avec role: 'assistant')
      messages.add(Map<String, dynamic>.from(res));
    } catch (e) {
      error.value = "Erreur d'envoi : l'assistant est indisponible.";
      // Optionnel : supprimer le message utilisateur si l'envoi a échoué
    } finally {
      sending.value = false;
    }
  }
}
