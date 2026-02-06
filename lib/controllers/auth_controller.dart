import 'package:get/get.dart';
import '../data/providers/auth_provider.dart';
import '../data/services/token_storage.dart';

class AuthController extends GetxController {
  final AuthProvider authProvider;
  final TokenStorage tokenStorage;

  AuthController({required this.authProvider, required this.tokenStorage});

  // Session state
  final isAuthenticated = false.obs;
  final user = Rxn<Map<String, dynamic>>();
  final error = RxnString();

  // Login state
  final loginLoading = false.obs;
  final loginError = RxnString();

  // Signup state
  final signupLoading = false.obs;
  final signupError = RxnString();

  // Call this on app start (splash) to restore session
  Future<void> initSession() async {
    error.value = null;
    final access = await tokenStorage.getAccessToken();
    if (access == null || access.isEmpty) {
      isAuthenticated.value = false;
      user.value = null;
      return;
    }

    try {
      final me = await authProvider.me();
      user.value = Map<String, dynamic>.from(me);
      isAuthenticated.value = true;
    } catch (e) {
      // token invalid/expired
      await tokenStorage.clear();
      isAuthenticated.value = false;
      user.value = null;
      error.value = e.toString();
    }
  }

  Future<bool> login({required String email, required String password}) async {
    loginLoading.value = true;
    loginError.value = null;

    try {
      final res = await authProvider.login(email: email, password: password);

      // Expected shapes:
      // 1) { "accessToken": "...", "refreshToken": "...", "user": {...} }
      // 2) { "access_token": "...", "refresh_token": "...", "user": {...} }
      final access = (res['accessToken'] ?? res['access_token'] ?? res['token'])
          ?.toString();
      final refresh = (res['refreshToken'] ?? res['refresh_token'])?.toString();

      if (access == null || access.isEmpty) {
        throw StateError('Login response missing access token');
      }

      await tokenStorage.setAccessToken(access);
      if (refresh != null && refresh.isNotEmpty) {
        await tokenStorage.setRefreshToken(refresh);
      }

      // user can be present in login response, else fetch /me
      final u = res['user'];
      if (u is Map) {
        user.value = Map<String, dynamic>.from(u);
      } else {
        final me = await authProvider.me();
        user.value = Map<String, dynamic>.from(me);
      }

      isAuthenticated.value = true;
      return true;
    } catch (e) {
      loginError.value = e.toString();
      isAuthenticated.value = false;
      user.value = null;
      return false;
    } finally {
      loginLoading.value = false;
    }
  }

  Future<bool> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    signupLoading.value = true;
    signupError.value = null;

    try {
      final res = await authProvider.signup(
        name: name,
        email: email,
        password: password,
      );

      // Some backends auto-login on signup and return tokens
      final access = (res['accessToken'] ?? res['access_token'] ?? res['token'])
          ?.toString();
      final refresh = (res['refreshToken'] ?? res['refresh_token'])?.toString();

      if (access != null && access.isNotEmpty) {
        await tokenStorage.setAccessToken(access);
        if (refresh != null && refresh.isNotEmpty) {
          await tokenStorage.setRefreshToken(refresh);
        }
        final u = res['user'];
        if (u is Map) {
          user.value = Map<String, dynamic>.from(u);
        } else {
          final me = await authProvider.me();
          user.value = Map<String, dynamic>.from(me);
        }
        isAuthenticated.value = true;
      } else {
        // If signup doesn't login, you can still proceed to next screen
        // and ask user to login later, or auto-login by calling login()
        isAuthenticated.value = false;
      }

      return true;
    } catch (e) {
      signupError.value = e.toString();
      return false;
    } finally {
      signupLoading.value = false;
    }
  }

  Future<void> logout() async {
    error.value = null;
    try {
      // optional backend logout
      await authProvider.logout();
    } catch (_) {
      // ignore
    }

    await tokenStorage.clear();
    isAuthenticated.value = false;
    user.value = null;
  }
}
