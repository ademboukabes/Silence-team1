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

  @override
  void initState() {
    super.initState();
    controller.load();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => controller.load(),
        child: ListView(
        padding: EdgeInsets.only(left: 20.w, right: 20.w, top: 14.h),
        children: [
          Row(
            children: [
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
          SizedBox(height: 14.h),
          Obx(() {
            final u = auth.user.value;
            final name = (u?['name'] ?? u?['fullName'] ?? '').toString();
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
          _Card(
            child: Obx(() {
              if (controller.loading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.error.value != null) {
                return Text(
                  controller.error.value!,
                  style: TextStyle(color: Colors.white70, fontSize: 12.sp),
                );
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
                              ? 'Aucune reservation proche'
                              : 'Votre prochaine reservation est bientot',
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
                        ? 'Pas de details'
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
                      padding:
                          EdgeInsets.symmetric(horizontal: 28.w, vertical: 10.h),
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
                    'Recent notifications',
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
                    SizedBox(height: 6.h),
                    Text(
                      n['body']?.toString() ?? '',
                      style:
                          TextStyle(color: Colors.white70, fontSize: 11.sp),
                    ),
                    SizedBox(height: 10.h),
                    Divider(color: Colors.white.withOpacity(0.2)),
                    SizedBox(height: 6.h),
                  ],
                ],
              );
            }),
          ),
          SizedBox(height: 24.h),
        ],
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
          colors: [
            Color(0xFF5D7C95),
            Color(0xFF274B66),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
