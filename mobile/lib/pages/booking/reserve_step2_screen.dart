import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:listenlit/controllers/booking_controller.dart';
import 'package:listenlit/model/slot.dart';

class ReserveStep2Screen extends StatelessWidget {
  const ReserveStep2Screen({super.key});

  @override
  Widget build(BuildContext context) {
    final BookingController controller = Get.find<BookingController>();
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: theme.appBarTheme.elevation ?? 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: cs.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sélection du Créneau',
              style: TextStyle(
                color: cs.onSurface,
                fontSize: 18.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'Étape 2 sur 2',
              style: TextStyle(
                color: cs.onSurface.withOpacity(0.7),
                fontSize: 12.sp,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.refresh_rounded,
              color: cs.onSurface.withOpacity(0.8),
            ),
            onPressed: () => controller.loadAvailableSlots(),
            tooltip: 'Actualiser',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(6),
          child: Container(
            height: 6.h,
            margin: EdgeInsets.symmetric(horizontal: 16.w),
            decoration: BoxDecoration(
              color: cs.primary,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          _InfoSummary(controller: controller),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return _buildLoadingState(context);
              }

              if (controller.errorMessage.value != null &&
                  controller.timeSlots.isEmpty) {
                return _ErrorState(
                  message: controller.errorMessage.value!,
                  onRetry: () => controller.loadAvailableSlots(),
                );
              }

              if (controller.timeSlots.isEmpty) {
                return const _EmptyState();
              }

              return _buildSlotGrid(context, controller);
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(cs.primary),
          ),
          SizedBox(height: 16.h),
          Text(
            'Chargement des créneaux disponibles...',
            style: TextStyle(
              color: cs.onSurface.withOpacity(0.7),
              fontSize: 14.sp,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSlotGrid(BuildContext context, BookingController controller) {
    final cs = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: EdgeInsets.all(20.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: cs.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.access_time_rounded,
                    color: cs.primary,
                    size: 24.sp,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Créneaux Disponibles',
                        style: TextStyle(
                          color: cs.onSurface,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                        ),
                      ),
                      SizedBox(height: 2.h),
                      Text(
                        '${controller.timeSlots.where((s) => s.available).length} créneaux libres',
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
            ),
            SizedBox(height: 20.h),

            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12.w,
                mainAxisSpacing: 12.h,
                childAspectRatio: 2.2,
              ),
              itemCount: controller.timeSlots.length,
              itemBuilder: (context, index) {
                final slot = controller.timeSlots[index];
                return _SlotCard(
                  slot: slot,
                  onTap: () => _handleConfirmDialog(context, controller, slot),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _handleConfirmDialog(
    BuildContext context,
    BookingController controller,
    Slot slot,
  ) {
    if (!slot.available) return;

    final cs = Theme.of(context).colorScheme;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: EdgeInsets.all(24.w),
          decoration: BoxDecoration(
            color: Theme.of(ctx).cardTheme.color ?? cs.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: cs.onSurface.withOpacity(0.08), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.18),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cs.primary.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.event_available_rounded,
                  color: cs.primary,
                  size: 40.sp,
                ),
              ),
              SizedBox(height: 20.h),

              Text(
                'Confirmer la Réservation',
                style: TextStyle(
                  color: cs.onSurface,
                  fontSize: 20.sp,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 12.h),

              Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cs.onSurface.withOpacity(0.06)),
                ),
                child: Column(
                  children: [
                    _buildDetailRow(
                      ctx,
                      Icons.access_time_rounded,
                      'Créneau',
                      slot.formattedTime,
                    ),
                    Divider(
                      color: cs.onSurface.withOpacity(0.08),
                      height: 20.h,
                    ),
                    _buildDetailRow(
                      ctx,
                      Icons.inventory_2_outlined,
                      'Container',
                      controller.containerId.value,
                    ),
                    Divider(
                      color: cs.onSurface.withOpacity(0.08),
                      height: 20.h,
                    ),
                    _buildDetailRow(
                      ctx,
                      Icons.directions_car_rounded,
                      'Plaque',
                      controller.truckPlate.value,
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),

              Row(
                children: [
                  Expanded(
                    child: _buildDialogButton(
                      context: ctx,
                      label: 'Annuler',
                      onTap: () => Navigator.pop(ctx),
                      isPrimary: false,
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: _buildDialogButton(
                      context: ctx,
                      label: 'Confirmer',
                      onTap: () async {
                        Navigator.pop(ctx);
                        controller.selectedSlot.value = slot;
                        final success = await controller.confirmFinalBooking();
                        if (success) {
                          Get.offAllNamed('/home');
                        }
                      },
                      isPrimary: true,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(icon, color: cs.primary, size: 18.sp),
        SizedBox(width: 12.w),
        Text(
          label,
          style: TextStyle(
            color: cs.onSurface.withOpacity(0.7),
            fontSize: 13.sp,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            color: cs.onSurface,
            fontSize: 14.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildDialogButton({
    required BuildContext context,
    required String label,
    required VoidCallback onTap,
    required bool isPrimary,
  }) {
    final cs = Theme.of(context).colorScheme;

    return SizedBox(
      height: 48.h,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: isPrimary
              ? cs.primary
              : cs.onSurface.withOpacity(0.10),
          foregroundColor: isPrimary ? cs.onPrimary : cs.onSurface,
          elevation: isPrimary ? 2 : 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

// --- WIDGETS DE STYLE ---

class _SlotCard extends StatelessWidget {
  final Slot slot;
  final VoidCallback onTap;

  const _SlotCard({required this.slot, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: slot.available ? onTap : null,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: slot.available
                ? (Theme.of(context).cardTheme.color ?? cs.surface)
                : cs.onSurface.withOpacity(0.06),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: slot.available
                  ? cs.primary.withOpacity(0.35)
                  : cs.onSurface.withOpacity(0.08),
              width: 1.5,
            ),
            boxShadow: slot.available
                ? [
                    BoxShadow(
                      color: cs.primary.withOpacity(0.12),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Stack(
            children: [
              Positioned(
                top: 8.h,
                right: 8.w,
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: slot.available
                        ? const Color(0xFF10B981).withOpacity(0.15)
                        : const Color(0xFFEF4444).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: slot.available
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6.w,
                        height: 6.w,
                        decoration: BoxDecoration(
                          color: slot.available
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        slot.available ? 'Libre' : 'Complet',
                        style: TextStyle(
                          color: slot.available
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                          fontSize: 9.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.schedule_rounded,
                      color: slot.available
                          ? cs.primary
                          : cs.onSurface.withOpacity(0.25),
                      size: 28.sp,
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      slot.formattedTime,
                      style: TextStyle(
                        color: slot.available
                            ? cs.onSurface
                            : cs.onSurface.withOpacity(0.35),
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoSummary extends StatelessWidget {
  final BookingController controller;
  const _InfoSummary({required this.controller});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      margin: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 0),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color ?? cs.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.onSurface.withOpacity(0.08), width: 1),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.info_outline_rounded, color: cs.primary, size: 20.sp),
              SizedBox(width: 8.w),
              Text(
                'Récapitulatif',
                style: TextStyle(
                  color: cs.onSurface,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          Divider(color: cs.onSurface.withOpacity(0.08), height: 20.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildInfoChip(
                context,
                Icons.inventory_2_outlined,
                controller.containerId.value,
              ),
              Container(
                width: 1,
                height: 20.h,
                color: cs.onSurface.withOpacity(0.08),
              ),
              _buildInfoChip(
                context,
                Icons.directions_car_rounded,
                controller.truckPlate.value,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(BuildContext context, IconData icon, String text) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(icon, color: cs.primary, size: 16.sp),
        SizedBox(width: 6.w),
        Text(
          text,
          style: TextStyle(
            color: cs.onSurface,
            fontSize: 12.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: EdgeInsets.all(32.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: cs.error.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                color: cs.error,
                size: 48.sp,
              ),
            ),
            SizedBox(height: 24.h),
            Text(
              'Une erreur est survenue',
              style: TextStyle(
                color: cs.onSurface,
                fontSize: 18.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 8.h),
            Text(
              message,
              style: TextStyle(
                color: cs.onSurface.withOpacity(0.7),
                fontSize: 14.sp,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 24.h),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Réessayer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: cs.primary,
                foregroundColor: cs.onPrimary,
                padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: EdgeInsets.all(32.w),
        child: Column(
          mainAxisSize: MainAxisSize.min, // ✅ ici
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: cs.primary.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.event_busy_rounded,
                color: cs.primary,
                size: 48.sp,
              ),
            ),
            SizedBox(height: 24.h),
            Text(
              'Aucun créneau disponible',
              style: TextStyle(
                color: cs.onSurface,
                fontSize: 18.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 8.h),
            Text(
              'Il n\'y a pas de créneaux disponibles\npour cette porte actuellement',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: cs.onSurface.withOpacity(0.7),
                fontSize: 14.sp,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
