import '../providers/notification_provider.dart';

class NotificationRepo {
  final NotificationProvider _provider;
  NotificationRepo(this._provider);

  Future<List<dynamic>> recent() {
    return _provider.recent();
  }

  Future<void> markRead(List<String> ids) {
    return _provider.markRead(ids);
  }
}
