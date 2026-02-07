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
    // On garde le thème général pour le fond de l'écran
    final theme = Theme.of(context);

    final pages = <Widget>[
      const ReserveStep1Screen(),
      const HomeScreen(),
      const AssistantScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
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
        padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 10.h),
        child: LayoutBuilder(
          builder: (context, constraints) {
            const itemCount = 4;
            final itemWidth = constraints.maxWidth / itemCount;

            return SizedBox(
              height: 65.h,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  // ✅ Fond blanc/clair forcé pour la barre
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Colors.black.withOpacity(0.05),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Stack(
                    children: [
                      // Indicateur de fond lors du clic (léger gris)
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOutCubic,
                        left: currentIndex * itemWidth,
                        top: 0,
                        bottom: 0,
                        child: SizedBox(
                          width: itemWidth,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.03),
                            ),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          _navItem(
                            context,
                            0,
                            Icons.calendar_month_outlined,
                            Icons.calendar_month_rounded,
                            'Réserver',
                          ),
                          _navItem(
                            context,
                            1,
                            Icons.home_outlined,
                            Icons.home_rounded,
                            'Accueil',
                          ),
                          _navItem(
                            context,
                            2,
                            Icons.smart_toy_outlined,
                            Icons.smart_toy_rounded,
                            'Assistant',
                          ),
                          _navItem(
                            context,
                            3,
                            Icons.person_outline_rounded,
                            Icons.person_rounded,
                            'Profil',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _navItem(
    BuildContext context,
    int index,
    IconData icon,
    IconData activeIcon,
    String label,
  ) {
    final cs = Theme.of(context).colorScheme;
    final active = currentIndex == index;

    // ✅ Couleurs d'écriture et icônes forcées en noir/gris
    final activeColor =
        cs.primary; // Garde ta couleur principale (bleu) pour l'élément actif
    final inactiveColor = Colors.black.withOpacity(
      0.5,
    ); // Noir 50% pour le reste

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(index),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding: EdgeInsets.all(active ? 8.w : 6.w),
                decoration: BoxDecoration(
                  color: active ? activeColor : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  active ? activeIcon : icon,
                  color: active
                      ? Colors.white
                      : inactiveColor, // Icône blanche sur bleu si actif
                  size: 22.sp,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.sp,
                  fontWeight: active ? FontWeight.bold : FontWeight.w500,
                  color: active
                      ? Colors.black
                      : inactiveColor, // ✅ Texte noir si actif
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
