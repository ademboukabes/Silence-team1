// lib/data/providers/auth_provider.dart
import 'package:dio/dio.dart';
import 'package:listenlit/data/api/endpoints.dart';
import '../services/api_client.dart';
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
      Endpoints.login,
      data: {'name': name, 'email': email, 'password': password},
    );
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> me() async {
    // some backends use /auth/profile or /auth/me
    final res = await _dio.get(Endpoints.me);
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> refresh() async {
    // only if your backend supports it
    // common endpoints: /auth/refresh, /auth/refresh-token
    final refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw StateError('Missing refresh token');
    }

    final res = await _dio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    return _asMap(res.data);
  }

  Future<void> logout() async {
    // optional: if backend has logout
    // if not, you can delete tokens locally only
    try {
      await _dio.post('/auth/logout');
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
