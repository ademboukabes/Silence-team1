import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart'; // Importe ton AuthController
import '../data/repositories/assistant_repo.dart';

class AssistantController extends GetxController {
  final AssistantRepo repo;
  AssistantController(this.repo);

  final AuthController auth =
      Get.find<AuthController>(); // Pour récupérer les infos du user

  final loading = false.obs;
  final sending = false.obs;
  final error = RxnString();
  final messages = <Map<String, dynamic>>[].obs;

  // On stocke l'ID de conversation pour le renvoyer à chaque message
  final conversationId = RxnString();

  @override
  void onInit() {
    super.onInit();
    loadHistory();
  }

  Future<void> loadHistory() async {
    loading.value = true;
    error.value = null;
    try {
      final userId = auth.user.value?.id.toString() ?? "";

      final list = await repo.history(userId);

      messages.value = list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      error.value = "Impossible de charger l'historique";
    } finally {
      loading.value = false;
    }
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    // 1. Préparation du payload pour l'IA
    final payload = {
      "message": text,
      "user_id": auth.user.value?.id ?? 0, // ID dynamique
      "user_role":
          auth.user.value?.role?.toUpperCase() ?? "USER", // Role dynamique
      "conversation_id": conversationId.value, // null au début, puis ID reçu
      "context": {},
    };

    // Ajout local pour l'UI (on utilise 'message' pour être raccord avec l'IA)
    messages.add({
      "role": "user",
      "message": text,
      "createdAt": DateTime.now().toIso8601String(),
    });

    sending.value = true;
    error.value = null;

    try {
      // 2. Envoi au Repo (passe bien le payload complet)
      final res = await repo.send(payload);

      // 3. Mise à jour de la conversation et ajout de la réponse
      if (res['conversation_id'] != null) {
        conversationId.value = res['conversation_id'];
      }

      // On ajoute la réponse en s'assurant qu'elle a le rôle 'assistant'
      final aiResponse = Map<String, dynamic>.from(res);
      aiResponse['role'] = 'assistant';

      messages.add(aiResponse);
    } catch (e) {
      error.value = "L'assistant est indisponible.";
    } finally {
      sending.value = false;
    }
  }
}
