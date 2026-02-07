import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Pages
import 'package:listenlit/pages/Auth/login_screen.dart';
import 'package:listenlit/pages/landingScreen/landing_screen.dart';

// Data & Providers
import 'data/api/api_client.dart';
import 'data/api/endpoints.dart';
import 'data/providers/auth_provider.dart';
import 'data/providers/booking_provider.dart';
import 'data/providers/notification_provider.dart';
import 'data/providers/assistant_provider.dart';
// Repositories
import 'data/repositories/auth_repo.dart';
import 'data/repositories/booking_repo.dart';
import 'data/repositories/notification_repo.dart';
import 'data/repositories/assistant_repo.dart';

// Services & Controllers
import 'data/services/token_storage.dart';
import 'controllers/auth_controller.dart';
import 'controllers/home_controller.dart';
import 'controllers/booking_controller.dart';
import 'controllers/assistant_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  _initDependencies();
  runApp(const MyApp());
}

void _initDependencies() {
  final storage = TokenStorage();
  final apiClient = ApiClient(
    baseUrl: Endpoints.baseUrl,
    storage: const FlutterSecureStorage(),
  );

  Get.put<TokenStorage>(storage, permanent: true);
  Get.put<ApiClient>(apiClient, permanent: true);

  // --- 1. INITIALISATION DES PROVIDERS ---
  final authProvider = AuthProvider(
    apiClient: apiClient,
    tokenStorage: storage,
  );
  final bookingProvider = BookingProvider(apiClient);
  final notificationProvider = NotificationProvider(apiClient);
  final assistantProvider = AssistantProvider(apiClient);

  // AJOUTE CES LIGNES ICI :
  Get.put<AuthProvider>(authProvider, permanent: true);
  Get.put<BookingProvider>(bookingProvider, permanent: true);
  Get.put<NotificationProvider>(notificationProvider, permanent: true);
  Get.put<AssistantProvider>(assistantProvider, permanent: true);

  // --- 2. REPOSITORIES ---
  Get.put<AuthRepo>(AuthRepo(authProvider), permanent: true);
  Get.put<BookingRepo>(BookingRepo(bookingProvider), permanent: true);
  Get.put<NotificationRepo>(
    NotificationRepo(notificationProvider),
    permanent: true,
  );
  Get.put<AssistantRepo>(AssistantRepo(assistantProvider), permanent: true);

  // --- 3. CONTROLLERS ---
  Get.put<AuthController>(
    AuthController(authProvider: authProvider, tokenStorage: storage),
    permanent: true,
  );

  Get.put<HomeController>(
    HomeController(
      bookingProvider: bookingProvider,
      notificationProvider: notificationProvider,
    ),
    permanent: true,
  );

  // Maintenant, BookingController pourra faire Get.find<BookingProvider>() sans erreur
  Get.put<BookingController>(BookingController(), permanent: true);

  Get.put<AssistantController>(
    AssistantController(Get.find<AssistantRepo>()),
    permanent: true,
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (_, __) {
        const primaryBlue = Color(0xFF2F80ED);

        return GetMaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Smart Port Carrier',
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: primaryBlue,
              primary: primaryBlue,
              background: const Color(0xFFD9F1FF),
            ),

            // correction: CardThemeData (pas CardTheme)
            cardTheme: CardThemeData(
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),

            // style des inputs pour tout le projet
            inputDecorationTheme: InputDecorationTheme(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          home: const AppRoot(),
        );
      },
    );
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  final AuthController _auth = Get.find<AuthController>();
  final bool _skipAuth =
      (dotenv.env['SKIP_AUTH'] ?? 'false').toLowerCase() == 'true';

  @override
  void initState() {
    super.initState();
    if (!_skipAuth) {
      _auth.initSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      // 1. Toujours afficher le chargement pendant que l'on vérifie le token
      if (_auth.sessionLoading.value) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }

      // 2. Si authentifié, on va vers le Landing (qui lui gérera l'affichage selon le rôle)
      if (_auth.isAuthenticated.value) {
        return const LandingScreen();
      }

      // 3. Sinon, retour au Login
      return LoginScreen();
    });
  }
}

class AccessDeniedScreen extends StatelessWidget {
  const AccessDeniedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.block, size: 80, color: Colors.red),
            const SizedBox(height: 20),
            const Text(
              'Accès réservé aux Transitaires',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () => Get.find<AuthController>().logout(),
              child: const Text('Déconnexion'),
            ),
          ],
        ),
      ),
    );
  }
}
