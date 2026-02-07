import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:listenlit/controllers/auth_controller.dart';

class AgentScannerScreen extends StatefulWidget {
  const AgentScannerScreen({super.key});

  @override
  State<AgentScannerScreen> createState() => _AgentScannerScreenState();
}

class _AgentScannerScreenState extends State<AgentScannerScreen> {
  // 1. Initialisation propre du contrôleur
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed:
        DetectionSpeed.noDuplicates, // Évite de scanner 50 fois le même code
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  String? _lastValue;
  bool _isScanning = true;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return; // Bloque si on a déjà un résultat

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? value = barcodes.first.rawValue;
    if (value == null || value.isEmpty) return;

    setState(() {
      _lastValue = value;
      _isScanning = false; // Met en pause la détection logique
    });

    // Action suite au scan
    Get.snackbar(
      'QR détecté',
      value,
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 3),
      backgroundColor: Colors.green.withOpacity(0.9),
      colorText: Colors.white,
      margin: const EdgeInsets.all(16),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Scanner QR', style: TextStyle(color: Colors.white)),
        actions: [
          // Bouton Flash
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, state, child) {
              // On accède au flash via state.torchState
              final torchState = state.torchState;
              return IconButton(
                icon: Icon(
                  torchState == TorchState.on
                      ? Icons.flash_on_rounded
                      : Icons.flash_off_rounded,
                  color: torchState == TorchState.on
                      ? Colors.amber
                      : Colors.white70,
                ),
                onPressed: () => _controller.toggleTorch(),
              );
            },
          ),

          // Bouton Caméra
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, state, child) {
              // On accède à la face via state.cameraDirection
              final facing = state.cameraDirection;
              return IconButton(
                icon: Icon(
                  facing == CameraFacing.front
                      ? Icons.camera_front_rounded
                      : Icons.camera_rear_rounded,
                  color: Colors.white70,
                ),
                onPressed: () => _controller.switchCamera(),
              );
            },
          ),
        ],
      ),
      // Utilisation d'un Stack pour superposer la caméra et l'interface
      body: Stack(
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          // Overlay de scan (le cadre)
          _buildOverlay(),
          // Affichage du résultat si scan réussi
          if (_lastValue != null) _buildResultPanel(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.redAccent,
        onPressed: () => Get.find<AuthController>().logout(),
        icon: const Icon(Icons.logout, color: Colors.white),
        label: const Text('Déconnexion', style: TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildOverlay() {
    return Container(
      decoration: ShapeDecoration(
        shape: QrScannerOverlayShape(
          borderColor: Colors.white,
          borderRadius: 10,
          borderLength: 30,
          borderWidth: 10,
          cutOutSize: 250, // Taille du carré de scan
        ),
      ),
    );
  }

  Widget _buildResultPanel() {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        margin: const EdgeInsets.only(bottom: 100, left: 20, right: 20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Contenu du QR :",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(_lastValue!, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _lastValue = null;
                  _isScanning = true;
                });
              },
              icon: const Icon(Icons.refresh),
              label: const Text("Scanner à nouveau"),
            ),
          ],
        ),
      ),
    );
  }
}

// Un petit Helper pour dessiner le cadre de scan proprement
class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  QrScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 10,
    this.borderRadius = 10,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => Path();

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) =>
      Path()..addRect(rect);

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final scanRect = Rect.fromLTWH(
      (width - cutOutSize) / 2,
      (height - cutOutSize) / 2,
      cutOutSize,
      cutOutSize,
    );

    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(rect),
        Path()..addRRect(
          RRect.fromRectAndRadius(scanRect, Radius.circular(borderRadius)),
        ),
      ),
      Paint()..color = Colors.black54,
    );

    final paint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    // Coins du scanner (simplifié pour cet exemple)
    canvas.drawRRect(
      RRect.fromRectAndRadius(scanRect, Radius.circular(borderRadius)),
      paint,
    );
  }

  @override
  ShapeBorder scale(double t) => this;
}
