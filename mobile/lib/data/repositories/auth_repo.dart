import '../providers/auth_provider.dart';

class AuthRepo {
  final AuthProvider _provider;
  AuthRepo(this._provider);

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) {
    return _provider.login(email: email, password: password);
  }

  Future<Map<String, dynamic>> signup({
    required String name,
    required String email,
    required String password,
  }) {
    return _provider.signup(name: name, email: email, password: password);
  }

  Future<Map<String, dynamic>> me() {
    return _provider.me();
  }

  Future<void> forgotPassword({required String email}) {
    return _provider.forgotPassword(email: email);
  }

  Future<void> verifyCode({required String email, required String code}) {
    return _provider.verifyCode(email: email, code: code);
  }

  Future<void> resetPassword({
    required String email,
    required String newPassword,
    required String code,
  }) {
    return _provider.resetPassword(
      email: email,
      newPassword: newPassword,
      code: code,
    );
  }
}
