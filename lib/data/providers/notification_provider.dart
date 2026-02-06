import '../api/api_client.dart';
import '../api/endpoints.dart';

class NotificationProvider {
  final ApiClient api;
  NotificationProvider(this.api);

  Future<List<dynamic>> recent() async {
    final res = await api.dio.get(Endpoints.notifications);
    return List<dynamic>.from(res.data);
  }
}
