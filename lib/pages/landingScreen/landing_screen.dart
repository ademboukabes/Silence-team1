// lib/pages/landing/landing_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../booking/reserve_step1_screen.dart';
import '../assistant/assistant_screen.dart';
import '../profile/profile_screen.dart';
import '../home/home_screen.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  int _currentIndex = 1;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    final pages = <Widget>[
      const ReserveStep1Screen(),
      const HomeScreen(),
      const AssistantScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor, // ✅
      extendBody: true,
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: _BottomBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _BottomBar({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16.w,
          0,
          16.w,
          12.h,
        ), // un peu moins que 20.h
        child: LayoutBuilder(
          builder: (context, constraints) {
            final itemCount = 4;
            final itemWidth = constraints.maxWidth / itemCount;

            return Container(
              height: 64.h, // un peu moins que 70.h (overflow-safe)
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [cs.surface, cs.surfaceVariant],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: cs.onSurface.withOpacity(0.10),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(
                      theme.brightness == Brightness.dark ? 0.30 : 0.12,
                    ),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                  BoxShadow(
                    color: cs.primary.withOpacity(0.10),
                    blurRadius: 20,
                    offset: const Offset(0, 5),
                    spreadRadius: -5,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Stack(
                  children: [
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutCubic,
                      left: currentIndex * itemWidth,
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: itemWidth,
                        color: cs.primary.withOpacity(0.10),
                      ),
                    ),

                    Row(
                      children: [
                        _navItem(
                          context: context,
                          index: 0,
                          icon: Icons.calendar_month_outlined,
                          activeIcon: Icons.calendar_month_rounded,
                          label: 'Réserver',
                        ),
                        _navItem(
                          context: context,
                          index: 1,
                          icon: Icons.home_outlined,
                          activeIcon: Icons.home_rounded,
                          label: 'Accueil',
                        ),
                        _navItem(
                          context: context,
                          index: 2,
                          icon: Icons.smart_toy_outlined,
                          activeIcon: Icons.smart_toy_rounded,
                          label: 'Assistant',
                        ),
                        _navItem(
                          context: context,
                          index: 3,
                          icon: Icons.person_outline_rounded,
                          activeIcon: Icons.person_rounded,
                          label: 'Profil',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  double _getIndicatorPosition() {
    final screenWidth = ScreenUtil().screenWidth;
    final itemWidth = (screenWidth - 32.w) / 4;
    return currentIndex * itemWidth;
  }

  Widget _navItem({
    required BuildContext context,
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final cs = Theme.of(context).colorScheme;
    final active = currentIndex == index;

    final activeFg = cs.onPrimary;
    final inactiveFg = cs.onSurface.withOpacity(0.55);

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(index),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 8.h),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  padding: EdgeInsets.all(active ? 10.w : 8.w),
                  decoration: BoxDecoration(
                    color: active ? cs.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: active
                        ? [
                            BoxShadow(
                              color: cs.primary.withOpacity(0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    active ? activeIcon : icon,
                    color: active ? activeFg : inactiveFg,
                    size: active ? 24.sp : 22.sp,
                  ),
                ),
                SizedBox(height: 4.h),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  style: TextStyle(
                    fontSize: active ? 11.sp : 10.sp,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                    color: active ? cs.onSurface : inactiveFg, // label lisible
                    letterSpacing: 0.2,
                  ),
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
