import '../api/api_client.dart';
import '../api/endpoints.dart';

class GateProvider {
  final ApiClient api;
  GateProvider(this.api);

  Future<List<dynamic>> list() async {
    final res = await api.dio.get(Endpoints.gates);
    return List<dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> getById(int id) async {
    final res = await api.dio.get('${Endpoints.gates}/$id');
    return Map<String, dynamic>.from(res.data);
  }
}
