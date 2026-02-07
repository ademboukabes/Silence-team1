import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/auth_controller.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthController auth = Get.find<AuthController>();

  // Contrôleurs pour les champs de texte
  late TextEditingController nameController;
  late TextEditingController emailController;

  @override
  void initState() {
    super.initState();
    // On initialise avec les valeurs actuelles du modèle User
    nameController = TextEditingController(text: auth.user.value?.name);
    emailController = TextEditingController(text: auth.user.value?.email);
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: ListView(
        padding: EdgeInsets.all(20.w),
        children: [
          // --- SECTION PROFIL ---
          Text(
            "Mon Profil",
            style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 15.h),

          _buildTextField(
            label: "Nom Complet",
            controller: nameController,
            icon: Icons.person_outline,
          ),
          SizedBox(height: 15.h),

          _buildTextField(
            label: "Email",
            controller: emailController,
            icon: Icons.email_outlined,
            enabled: false,
          ),
          const Text(
            "L'email ne peut pas être modifié",
            style: TextStyle(fontSize: 10, color: Colors.grey),
          ),

          SizedBox(height: 30.h),

          // --- SECTION APPARENCE ---
          Text(
            "Apparence",
            style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.dark_mode_outlined),
            title: const Text("Mode Sombre"),
            trailing: Switch(
              value: Get.isDarkMode,
              onChanged: (value) {
                Get.changeTheme(value ? ThemeData.dark() : ThemeData.light());
              },
            ),
          ),

          const Divider(),
          SizedBox(height: 30.h),

          // --- BOUTON SAUVEGARDER ---
          ElevatedButton(
            onPressed: () {
              // Ici tu appellerais une méthode dans ton AuthController pour update le profil
              Get.snackbar(
                "Succès",
                "Profil mis à jour",
                snackPosition: SnackPosition.BOTTOM,
                backgroundColor: Colors.green,
                colorText: Colors.white,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0E6CFF),
              minimumSize: Size(double.infinity, 50.h),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              "Enregistrer les modifications",
              style: TextStyle(color: Colors.white),
            ),
          ),

          SizedBox(height: 15.h),

          // --- BOUTON DÉCONNEXION ---
          TextButton(
            onPressed: () => auth.logout(),
            child: const Text(
              "Se déconnecter",
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    bool enabled = true,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
