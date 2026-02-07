import 'package:get/get.dart';
import 'package:listenlit/model/user.dart';
import '../data/providers/auth_provider.dart';
import '../data/services/token_storage.dart';

class AuthController extends GetxController {
  final AuthProvider authProvider;
  final TokenStorage tokenStorage;

  AuthController({required this.authProvider, required this.tokenStorage});

  // --- État de la session ---
  final isAuthenticated = false.obs;
  // Utilisation de Rxn pour permettre une valeur nulle au démarrage
  final user = Rxn<User>();
  final error = RxnString();
  final sessionLoading = false.obs;

  // --- États des opérations ---
  final loginLoading = false.obs;
  final loginError = RxnString();

  final signupLoading = false.obs;
  final signupError = RxnString();

  final resetLoading = false.obs;
  final resetError = RxnString();

  /// Initialise la session au démarrage de l'application
  Future<void> initSession() async {
    sessionLoading.value = true;
    error.value = null;

    try {
      final access = await tokenStorage.getAccessToken();

      if (access == null || access.isEmpty) {
        _clearSessionState();
        return;
      }

      final me = await authProvider.me();
      // Transformation du Map de l'API en objet User
      user.value = User.fromJson(Map<String, dynamic>.from(me));
      isAuthenticated.value = true;
    } catch (e) {
      // Si le token est invalide ou expiré
      await tokenStorage.clear();
      _clearSessionState();
      error.value = e.toString();
    } finally {
      sessionLoading.value = false;
    }
  }

  /// Connexion de l'utilisateur
  Future<bool> login({required String email, required String password}) async {
    loginLoading.value = true;
    loginError.value = null;

    try {
      final res = await authProvider.login(email: email, password: password);

      // Extraction du token selon les formats possibles
      final access = (res['accessToken'] ?? res['access_token'] ?? res['token'])
          ?.toString();

      if (access == null || access.isEmpty) {
        throw StateError('Le serveur n\'a pas renvoyé de jeton d\'accès.');
      }

      await tokenStorage.setAccessToken(access);

      // Si l'utilisateur est inclus dans la réponse de login, on l'utilise, sinon /me
      final userData = res['user'];
      if (userData is Map) {
        user.value = User.fromJson(Map<String, dynamic>.from(userData));
      } else {
        final me = await authProvider.me();
        user.value = User.fromJson(Map<String, dynamic>.from(me));
      }

      isAuthenticated.value = true;
      return true;
    } catch (e) {
      loginError.value = e.toString();
      _clearSessionState();
      return false;
    } finally {
      loginLoading.value = false;
    }
  }

  /// Inscription de l'utilisateur
  /// Inscription de l'utilisateur avec "trafic" de rôle via code entreprise
  Future<bool> signup({
    required String name,
    required String email,
    required String password,
    String? companyCode, // Ajout du paramètre optionnel
  }) async {
    signupLoading.value = true;
    signupError.value = null;

    try {
      // On envoie quand même les données au provider (ajuste authProvider si besoin)
      final res = await authProvider.signup(
        name: name,
        email: email,
        password: password,
      );

      final access = (res['accessToken'] ?? res['access_token'] ?? res['token'])?.toString();
      final refresh = (res['refreshToken'] ?? res['refresh_token'])?.toString();

      if (access != null && access.isNotEmpty) {
        await tokenStorage.setAccessToken(access);
        if (refresh != null && refresh.isNotEmpty) {
          await tokenStorage.setRefreshToken(refresh);
        }

        final userData = res['user'];
        User newUser;

        if (userData is Map) {
          newUser = User.fromJson(Map<String, dynamic>.from(userData));
        } else {
          final me = await authProvider.me();
          newUser = User.fromJson(Map<String, dynamic>.from(me));
        }

        // --- LOGIQUE DE "TRAFIC" DU RÔLE ---
        if (companyCode != null && companyCode.toLowerCase().startsWith('ag')) {
          // On crée une copie de l'utilisateur avec le rôle forcé
          user.value = newUser.copyWith(role: 'agent'); 
        } else {
          // On met un rôle par défaut si ce n'est pas un agent
          user.value = newUser.copyWith(role: 'carrier');
        }
        // ------------------------------------

        isAuthenticated.value = true;
      }

      return true;
    } catch (e) {
      signupError.value = e.toString();
      return false;
    } finally {
      signupLoading.value = false;
    }
  }
  /// Déconnexion
  Future<void> logout() async {
    error.value = null;
    try {
      await authProvider.logout();
    } catch (_) {}

    await tokenStorage.clear();
    _clearSessionState();
  }

  // --- Helpers pour le mot de passe ---

  Future<bool> forgotPassword(String email) async {
    return _performResetAction(() => authProvider.forgotPassword(email: email));
  }

  Future<bool> verifyCode({required String email, required String code}) async {
    return _performResetAction(
      () => authProvider.verifyCode(email: email, code: code),
    );
  }

  Future<bool> resetPassword({
    required String email,
    required String newPassword,
    required String code,
  }) async {
    return _performResetAction(
      () => authProvider.resetPassword(
        email: email,
        newPassword: newPassword,
        code: code,
      ),
    );
  }

  Future<bool> saveInterests(List<String> interests) async {
    return _performResetAction(() => authProvider.saveInterests(interests));
  }

  // --- Méthodes privées utilitaires ---

  void _clearSessionState() {
    isAuthenticated.value = false;
    user.value = null;
  }

  Future<bool> _performResetAction(Future<dynamic> Function() action) async {
    resetLoading.value = true;
    resetError.value = null;
    try {
      await action();
      return true;
    } catch (e) {
      resetError.value = e.toString();
      return false;
    } finally {
      resetLoading.value = false;
    }
  }
}
