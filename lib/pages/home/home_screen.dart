import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/home_controller.dart';
import 'package:listenlit/controllers/auth_controller.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final HomeController controller = Get.find<HomeController>();
  final AuthController auth = Get.find<AuthController>();
  
  // Clé pour ouvrir le drawer via un bouton personnalisé
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    controller.load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey, // On lie la clé au Scaffold
      backgroundColor: const Color(0xFF1A1A1A), // Votre couleur de fond sombre
      
      // --- LE DRAWER (SIDE BAR) ---
      drawer: Drawer(
        backgroundColor: const Color(0xFF274B66),
        child: Column(
          children: [
            Obx(() {
              final u = auth.user.value;
              return UserAccountsDrawerHeader(
                decoration: const BoxDecoration(color: Color(0xFF1D3547)),
                accountName: Text(u?.name ?? 'Utilisateur'),
                accountEmail: Text(u?.email ?? ''),
                currentAccountPicture: const CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.person, color: Colors.white),
                ),
              );
            }),
            ListTile(
              leading: const Icon(Icons.settings, color: Colors.white),
              title: const Text('Paramètres', style: TextStyle(color: Colors.white)),
              onTap: () {
                // Naviguer vers paramètres
              },
            ),
            const Spacer(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Déconnexion', style: TextStyle(color: Colors.redAccent)),
              onTap: () => auth.logout(),
            ),
            SizedBox(height: 20.h),
          ],
        ),
      ),

      // --- CORPS DE L'ÉCRAN ---
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => controller.load(),
          child: ListView(
            padding: EdgeInsets.only(left: 20.w, right: 20.w, top: 14.h),
            children: [
              // --- TOP BAR PERSONNALISÉE ---
              Row(
                children: [
                  // BOUTON MENU (EN HAUT À GAUCHE)
                  GestureDetector(
                    onTap: () => _scaffoldKey.currentState?.openDrawer(),
                    child: Container(
                      padding: EdgeInsets.all(8.w),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.menu, color: Colors.white),
                    ),
                  ),
                  SizedBox(width: 15.w),
                  Text(
                    'APCS',
                    style: TextStyle(
                      fontSize: 20.sp,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      fontFamily: 'Inter',
                    ),
                  ),
                  const Spacer(),
                  Icon(Icons.notifications_none, color: Colors.white70),
                  SizedBox(width: 10.w),
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: Color(0xFF244B66),
                    child: Icon(Icons.person, color: Colors.white),
                  ),
                ],
              ),
              
              SizedBox(height: 20.h),
              
              // --- WELCOME TEXT ---
              Obx(() {
                final u = auth.user.value;
                final name = (u?.name ?? u?.role ?? '').toString();
                return Text(
                  name.isEmpty ? 'Bienvenue' : 'Bienvenue,\n$name',
                  style: TextStyle(
                    fontSize: 26.sp,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    fontFamily: 'Inter',
                  ),
                );
              }),
              
              SizedBox(height: 16.h),
              
              // --- CARTE PROCHAINE RESERVATION ---
              _Card(
                child: Obx(() {
                  if (controller.loading.value) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final booking = controller.nextBooking.value;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.access_time, color: Colors.white70),
                          SizedBox(width: 8.w),
                          Expanded(
                            child: Text(
                              booking == null
                                  ? 'Aucune réservation proche'
                                  : 'Votre prochaine réservation est bientôt',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13.sp,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 12.h),
                      Text(
                        booking == null
                            ? 'Pas de détails'
                            : 'Plaque: ${booking['truck']?['licensePlate'] ?? '-'}\nTerminal: ${booking['gate']?['name'] ?? '-'}',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12.sp,
                        ),
                      ),
                      SizedBox(height: 14.h),
                      Align(
                        alignment: Alignment.center,
                        child: Container(
                          padding: EdgeInsets.symmetric(horizontal: 28.w, vertical: 10.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0E6CFF),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Itinéraire',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12.sp,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                }),
              ),
              
              SizedBox(height: 14.h),
              
              // --- NOTIFICATIONS ---
              _Card(
                child: Obx(() {
                  if (controller.loading.value) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final items = controller.notifications;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Notifications récentes',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 10.h),
                      if (items.isEmpty)
                        Text(
                          'Aucune notification',
                          style: TextStyle(color: Colors.white70, fontSize: 12.sp),
                        ),
                      for (final n in items.take(3)) ...[
                        Text(
                          n['title']?.toString() ?? 'Notif',
                          style: TextStyle(color: Colors.white, fontSize: 12.sp),
                        ),
                        SizedBox(height: 4.h),
                        Text(
                          n['body']?.toString() ?? '',
                          style: TextStyle(color: Colors.white70, fontSize: 11.sp),
                        ),
                        Divider(color: Colors.white10),
                      ],
                    ],
                  );
                }),
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF5D7C95), Color(0xFF274B66)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}