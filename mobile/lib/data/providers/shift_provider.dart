import '../api/api_client.dart';
import '../api/endpoints.dart';

class ShiftProvider {
  final ApiClient api;
  ShiftProvider(this.api);

  Future<List<dynamic>> list() async {
    final res = await api.dio.get(Endpoints.shifts);
    return List<dynamic>.from(res.data);
  }
}
