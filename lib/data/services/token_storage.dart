// lib/data/services/token_storage.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _kAccessTokenKey = 'access_token';
  static const _kRefreshTokenKey = 'refresh_token';

  final FlutterSecureStorage _storage;

  TokenStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  Future<void> setAccessToken(String token) async {
    await _storage.write(key: _kAccessTokenKey, value: token);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: _kAccessTokenKey);
  }

  Future<void> setRefreshToken(String token) async {
    await _storage.write(key: _kRefreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: _kRefreshTokenKey);
  }

  Future<void> clear() async {
    // Clear both keys explicitly (safer than deleteAll if you store other secrets)
    await _storage.delete(key: _kAccessTokenKey);
    await _storage.delete(key: _kRefreshTokenKey);
  }
}
