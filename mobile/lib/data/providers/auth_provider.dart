// lib/data/providers/auth_provider.dart
import 'package:dio/dio.dart';
import 'package:listenlit/data/api/endpoints.dart';

import '../api/api_client.dart';
import '../services/token_storage.dart';

class AuthProvider {
  final ApiClient apiClient;
  final TokenStorage tokenStorage;

  AuthProvider({required this.apiClient, required this.tokenStorage});

  Dio get _dio => apiClient.dio;

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post(
      Endpoints.login,
      data: {'email': email, 'password': password},
    );
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await _dio.post(
      Endpoints.signup,
      data: {'name': name, 'email': email, 'password': password},
    );
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get(Endpoints.profile);
    return _asMap(res.data);
  }

  Future<void> forgotPassword({required String email}) async {
    throw StateError('Forgot password is not available in current backend.');
  }

  Future<void> verifyCode({required String email, required String code}) async {
    throw StateError('Verify code is not available in current backend.');
  }

  Future<void> resetPassword({
    required String email,
    required String newPassword,
    required String code,
  }) async {
    throw StateError('Reset password is not available in current backend.');
  }

  Future<void> saveInterests(List<String> interests) async {
    throw StateError('Save interests is not available in current backend.');
  }

  Future<void> logout() async {
    // optional: if backend has logout
    // if not, you can delete tokens locally only
    try {
      await _dio.post(Endpoints.logout);
    } on DioException {
      // ignore backend logout errors
    }
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    throw StateError('Expected JSON object but got: ${data.runtimeType}');
  }
}
