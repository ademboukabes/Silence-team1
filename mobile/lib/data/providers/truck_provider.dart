import '../api/api_client.dart';
import '../api/endpoints.dart';

class TruckProvider {
  final ApiClient api;
  TruckProvider(this.api);

  Future<List<dynamic>> list() async {
    final res = await api.dio.get(Endpoints.trucks);
    return List<dynamic>.from(res.data);
  }
}
