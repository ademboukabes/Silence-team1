class AppNotification {
  final String id;
  final String title;
  final String body;
  final DateTime? createdAt;
  final bool read;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.createdAt,
    required this.read,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] ?? json['notificationId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      body: (json['body'] ?? json['message'] ?? '').toString(),
      createdAt: _dt(json['createdAt'] ?? json['created_at']),
      read: json['read'] == true || json['isRead'] == true,
    );
  }

  static DateTime? _dt(dynamic v) {
    if (v == null) return null;
    return DateTime.tryParse(v.toString());
  }
}
