class User {
  final String id;
  final String name;
  final String email;
  final String company;
  final String avatarUrl;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.company,
    required this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] ?? json['driverId'] ?? '').toString(),
      name: (json['name'] ?? json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      company: (json['company'] ?? json['operator'] ?? '').toString(),
      avatarUrl: (json['avatar'] ?? json['avatarUrl'] ?? '').toString(),
    );
  }
}
