import 'package:get/get.dart';
import 'package:listenlit/model/slot.dart';
import 'package:listenlit/data/providers/booking_provider.dart';

class BookingController extends GetxController {
  // --- Dépendances ---
  final BookingProvider _bookingProvider = Get.find<BookingProvider>();

  // --- ÉTAPE 1 : Informations (Saisie Manuelle) ---
  var selectedGateId = Rxn<int>();
  var containerId = "".obs;
  var truckPlate = "".obs;
  var driverPhone = "".obs;
  var driverName = "".obs;
  var movementType = "IMPORT".obs;

  // --- Données pour les listes ---
  var terminals = <dynamic>[].obs; // Contiendra les Gates récupérées via API
  var timeSlots = <Slot>[].obs;
  var selectedSlot = Rxn<Slot>();

  // --- États de l'interface (UI State) ---
  // isLoading : utilisé pour les chargements (init + slots)
  var isLoading = false.obs;
  var isSubmitting = false.obs;
  var errorMessage = Rxn<String>();
  var error = Rxn<String>(); // Alias pour la compatibilité avec votre UI

  @override
  void onInit() {
    super.onInit();
    loadInit(); // Charge les terminaux dès le lancement du contrôleur
  }

  /// CHARGEMENT INITIAL : Récupère les portes (Gates) pour le formulaire
  /// Puisque les camions sont contactés hors-app, on ne charge que les terminaux.
  Future<void> loadInit() async {
    try {
      isLoading.value = true;
      error.value = null;

      // Appel de l'API pour obtenir les portes disponibles
      // Note: Assurez-vous que getGates() existe dans votre BookingProvider
      final response = await _bookingProvider.getGates();
      terminals.value = response
          .map((e) => e is Map ? Map<String, dynamic>.from(e) : e)
          .toList();
    } catch (e) {
      error.value = "Erreur lors de la récupération des terminaux.";
    } finally {
      isLoading.value = false;
    }
  }

  /// Appelé quand le transitaire choisit un terminal/gate
  void setGate(int id) {
    selectedGateId.value = id;
    loadAvailableSlots(); // Charge les créneaux dès que la porte change
  }

  /// Charge les créneaux (Slots) pour le terminal sélectionné
  Future<void> loadAvailableSlots() async {
    if (selectedGateId.value == null) return;

    try {
      isLoading.value = true;
      errorMessage.value = null;

      final List<dynamic> response = await _bookingProvider.getTimeSlots(
        gateId: selectedGateId.value,
      );

      // Conversion JSON en objets Slot
      timeSlots.value = response.map((json) => Slot.fromJson(json)).toList();

      if (timeSlots.isEmpty) {
        errorMessage.value = "Aucun créneau disponible pour ce terminal.";
      }
    } catch (e) {
      errorMessage.value =
          "Erreur de connexion : Impossible de récupérer les horaires.";
    } finally {
      isLoading.value = false;
    }
  }

  /// Validation de l'Étape 1 avant de passer au calendrier
  /// Validation pure (sans effet de bord) pour activer/désactiver le bouton.
  bool get isStep1Valid {
    return containerId.value.isNotEmpty &&
        truckPlate.value.isNotEmpty &&
        driverPhone.value.isNotEmpty &&
        selectedGateId.value != null;
  }

  /// Validation avec message (à appeler uniquement au clic sur "continuer").
  bool validateStep1() {
    if (!isStep1Valid) {
      Get.snackbar(
        'Champs manquants',
        'Veuillez remplir le container, la plaque, le téléphone et choisir un terminal.',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    }
    return true;
  }

  /// Envoi final de la réservation au port
  Future<bool> confirmFinalBooking() async {
    if (selectedSlot.value == null) {
      errorMessage.value = "Veuillez sélectionner un créneau horaire.";
      return false;
    }

    try {
      isSubmitting.value = true;
      errorMessage.value = null;

      // Création de la réservation avec les données saisies manuellement.
      // Important: carrierId et truckId doivent venir de votre backend.
      // Si vous n'avez pas encore ces IDs, mettez-les à null côté API (ou adaptez le backend)
      // au lieu d'envoyer 0.
      final slotId = int.tryParse(selectedSlot.value!.id);
      if (slotId == null) {
        throw StateError('Invalid slot id: ${selectedSlot.value!.id}');
      }

      await _bookingProvider.create(
        gateId: selectedGateId.value!,
        timeSlotId: slotId,
        truckId: 0,
        carrierId: 0,
        driverName: driverName.value.trim(),
        driverEmail: '',
        driverPhone: driverPhone.value.trim(),
        driverMatricule: truckPlate.value.trim(),
        merchandiseDescription: 'Container: ${containerId.value.trim()}',
        notes: 'Type: ${movementType.value}',
      );

      Get.snackbar("Succès", "Le créneau a été réservé pour votre chauffeur !");
      return true;
    } catch (e) {
      errorMessage.value =
          "Échec de la réservation. Le créneau est peut-être complet.";
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }
}
