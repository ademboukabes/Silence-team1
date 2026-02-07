import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/booking_controller.dart';
import 'package:listenlit/pages/booking/reserve_step2_screen.dart';

class ReserveStep1Screen extends StatefulWidget {
  const ReserveStep1Screen({super.key});

  @override
  State<ReserveStep1Screen> createState() => _ReserveStep1ScreenState();
}

class _ReserveStep1ScreenState extends State<ReserveStep1Screen> {
  final BookingController controller = Get.find<BookingController>();

  late TextEditingController _containerCtrl;
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _plateCtrl;

  @override
  void initState() {
    super.initState();
    _containerCtrl = TextEditingController(text: controller.containerId.value);
    _nameCtrl = TextEditingController(text: controller.driverName.value);
    _phoneCtrl = TextEditingController(text: controller.driverPhone.value);
    _plateCtrl = TextEditingController(text: controller.truckPlate.value);

    if (controller.terminals.isEmpty) {
      controller.loadInit();
    }
  }

  @override
  void dispose() {
    _containerCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _plateCtrl.dispose();
    super.dispose();
  }

  Widget _buildTerminalDropdown(BuildContext context) {
    final terminalItems = controller.terminals
        .map(_getGateId)
        .where((e) => e.isNotEmpty)
        .toList();

    if (terminalItems.isEmpty) {
      terminalItems.addAll(['1', '2']); // fallback
      controller.selectedGateId.value ??= int.tryParse(terminalItems.first);
    }

    return _buildDropdown(
      context: context,
      label: 'Terminal de destination',
      value: controller.selectedGateId.value?.toString(),
      items: terminalItems,
      display: (id) {
        if (id == '1') return 'Terminal A (exemple)';
        if (id == '2') return 'Terminal B (exemple)';

        final found = controller.terminals
            .where((t) => _getGateId(t) == id)
            .toList();
        if (found.isEmpty) return id;
        final name = _getGateName(found.first);
        return name.isEmpty ? id : name;
      },
      onChanged: (v) {
        if (v == null) return;
        final parsed = int.tryParse(v);
        if (parsed != null) controller.setGate(parsed);
      },
      icon: Icons.location_on_outlined,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: theme.appBarTheme.elevation ?? 0,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: cs.onSurface,
                ),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Nouvelle Réservation',
              style: TextStyle(
                color: cs.onSurface,
                fontSize: 18.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'Étape 1 sur 2',
              style: TextStyle(
                color: cs.onSurface.withOpacity(0.7),
                fontSize: 12.sp,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(6),
          child: Container(
            height: 6.h,
            margin: EdgeInsets.symmetric(horizontal: 16.w),
            decoration: BoxDecoration(
              color: cs.onSurface.withOpacity(0.08),
              borderRadius: BorderRadius.circular(3),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: 0.5,
              child: Container(
                decoration: BoxDecoration(
                  color: cs.primary,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(cs.primary),
                ),
                SizedBox(height: 16.h),
                Text(
                  'Chargement des données...',
                  style: TextStyle(
                    color: cs.onSurface.withOpacity(0.7),
                    fontSize: 14.sp,
                  ),
                ),
              ],
            ),
          );
        }

        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: EdgeInsets.all(20.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader(
                  context: context,
                  icon: Icons.inventory_2_outlined,
                  title: 'Détails du Container',
                  subtitle: 'Informations sur la cargaison',
                ),
                SizedBox(height: 16.h),

                _ModernCard(
                  child: Column(
                    children: [
                      _buildTextField(
                        context: context,
                        label: 'ID Container',
                        controller: _containerCtrl,
                        onChanged: (v) => controller.containerId.value = v,
                        hint: 'Ex: MSKU1234567',
                        icon: Icons.qr_code_2_rounded,
                        keyboardType: TextInputType.text,
                      ),
                      SizedBox(height: 20.h),
                      _buildTerminalDropdown(context),
                    ],
                  ),
                ),
                SizedBox(height: 32.h),

                _buildSectionHeader(
                  context: context,
                  icon: Icons.local_shipping_outlined,
                  title: 'Chauffeur & Camion',
                  subtitle: 'Informations du transporteur',
                ),
                SizedBox(height: 16.h),

                _ModernCard(
                  child: Column(
                    children: [
                      _buildTextField(
                        context: context,
                        label: 'Plaque d\'immatriculation',
                        controller: _plateCtrl,
                        onChanged: (v) => controller.truckPlate.value = v,
                        hint: 'Ex: 123456-16',
                        icon: Icons.directions_car_rounded,
                        keyboardType: TextInputType.text,
                      ),
                      SizedBox(height: 20.h),
                      _buildTextField(
                        context: context,
                        label: 'Nom du Chauffeur',
                        controller: _nameCtrl,
                        onChanged: (v) => controller.driverName.value = v,
                        hint: 'Nom complet',
                        icon: Icons.person_outline_rounded,
                        keyboardType: TextInputType.name,
                      ),
                      SizedBox(height: 20.h),
                      _buildTextField(
                        context: context,
                        label: 'Téléphone',
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        onChanged: (v) => controller.driverPhone.value = v,
                        hint: 'Ex: 0555 123 456',
                        icon: Icons.phone_outlined,
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 32.h),

                _buildContinueButton(context),

                SizedBox(height: 20.h),
              ],
            ),
          ),
        );
      }),
    );
  }

  String _getGateId(dynamic gate) {
    if (gate is Map) return (gate['id'] ?? '').toString();
    try {
      // ignore: avoid_dynamic_calls
      return (gate.id ?? '').toString();
    } catch (_) {
      return '';
    }
  }

  String _getGateName(dynamic gate) {
    if (gate is Map) return (gate['name'] ?? gate['label'] ?? '').toString();
    try {
      // ignore: avoid_dynamic_calls
      return (gate.name ?? '').toString();
    } catch (_) {
      return '';
    }
  }

  Widget _buildSectionHeader({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: cs.primary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: cs.primary, size: 24.sp),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: cs.onSurface,
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                subtitle,
                style: TextStyle(
                  color: cs.onSurface.withOpacity(0.7),
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required BuildContext context,
    required String label,
    required TextEditingController controller,
    required ValueChanged<String> onChanged,
    String? hint,
    IconData? icon,
    TextInputType? keyboardType,
  }) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: 4.w, bottom: 8.h),
          child: Text(
            label,
            style: TextStyle(
              color: cs.onSurface,
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cs.onSurface.withOpacity(0.08), width: 1),
          ),
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            keyboardType: keyboardType,
            style: TextStyle(color: cs.onSurface, fontSize: 14.sp),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                color: cs.onSurface.withOpacity(0.4),
                fontSize: 14.sp,
              ),
              prefixIcon: icon != null
                  ? Icon(icon, color: cs.primary, size: 20.sp)
                  : null,
              filled: false,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16.w,
                vertical: 14.h,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required BuildContext context,
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required String Function(String id) display,
    IconData? icon,
  }) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: 4.w, bottom: 8.h),
          child: Text(
            label,
            style: TextStyle(
              color: cs.onSurface,
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cs.onSurface.withOpacity(0.08), width: 1),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            items: items
                .map(
                  (e) => DropdownMenuItem(
                    value: e,
                    child: Text(
                      display(e),
                      style: TextStyle(color: cs.onSurface, fontSize: 14.sp),
                    ),
                  ),
                )
                .toList(),
            onChanged: onChanged,
            icon: Icon(Icons.keyboard_arrow_down_rounded, color: cs.primary),
            decoration: InputDecoration(
              prefixIcon: Icon(
                icon ?? Icons.location_on_outlined,
                color: cs.primary,
                size: 20.sp,
              ),
              filled: false,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16.w,
                vertical: 14.h,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
            dropdownColor: cs.surface,
            style: TextStyle(color: cs.onSurface, fontSize: 14.sp),
          ),
        ),
      ],
    );
  }

  Widget _buildContinueButton(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Obx(() {
      final canContinue = controller.isStep1Valid;

      return SizedBox(
        width: double.infinity,
        height: 56.h,
        child: ElevatedButton(
          onPressed: canContinue
              ? () {
                  if (controller.validateStep1()) {
                    Get.to(() => const ReserveStep2Screen());
                  }
                }
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: cs.primary,
            foregroundColor: cs.onPrimary,
            disabledBackgroundColor: cs.onSurface.withOpacity(0.12),
            disabledForegroundColor: cs.onSurface.withOpacity(0.35),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Choisir un créneau horaire',
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
              SizedBox(width: 8.w),
              Icon(Icons.arrow_forward_rounded, size: 20.sp),
            ],
          ),
        ),
      );
    });
  }
}

class _ModernCard extends StatelessWidget {
  final Widget child;
  const _ModernCard({required this.child});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: EdgeInsets.all(24.w),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color ?? cs.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.onSurface.withOpacity(0.06), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
