// lib/pages/assistant/assistant_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'widgets/assistant_hint_card.dart';

class AssistantScreen extends StatelessWidget {
  const AssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Assistant',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFamily: 'Inter',
            ),
          ),
          SizedBox(height: 12.h),
          const AssistantHintCard(
            title: 'Questions rapides',
            body:
                "- où est mon dépôt ?\n- je suis en retard\n- statut SH-12034\n- quel quai pour mon prochain service ?",
          ),
          SizedBox(height: 12.h),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF151A2C),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Text(
              "Ici tu peux brancher ton écran chat plus tard.\nPour l'instant, c’est une page placeholder.",
              style: TextStyle(
                fontSize: 13.sp,
                color: const Color(0xFFAAB3C5),
                fontFamily: 'Inter',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
