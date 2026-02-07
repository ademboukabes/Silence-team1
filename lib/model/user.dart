class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String avatarUrl;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] ?? json['driverId'] ?? '').toString(),
      name: (json['name'] ?? json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      avatarUrl: (json['avatar'] ?? json['avatarUrl'] ?? '').toString(),
    );
  }
}
