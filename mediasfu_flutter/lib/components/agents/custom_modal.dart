import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'audio_level_bars.dart';

class CustomModal extends StatefulWidget {
  final bool isOpen;
  final VoidCallback onClose;
  final MediaStream? videoStream;
  final double audioLevel; // 0..255
  final bool hasVideoFeed;

  const CustomModal({
    super.key,
    required this.isOpen,
    required this.onClose,
    this.videoStream,
    required this.audioLevel,
    required this.hasVideoFeed,
  });

  @override
  // ignore: library_private_types_in_public_api
  _CustomModalState createState() => _CustomModalState();
}

class _CustomModalState extends State<CustomModal> {
  /// Tracks the top-left position (dx, dy) of the draggable modal.
  late ValueNotifier<Offset> _offset;

  /// WebRTC renderer to display the video stream.
  late final RTCVideoRenderer _renderer;

  @override
  void initState() {
    super.initState();
    _renderer = RTCVideoRenderer();
    _initializeRenderer();

    // Initialize the offset to (50, 50)
    _offset = ValueNotifier(const Offset(50, 50));

    // Dynamically calculate the initial offset for centering
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final size = MediaQuery.of(context).size;
      final centerOffset = Offset(
        (size.width - 140) / 2, // Center horizontally
        (size.height - 140) / 2, // Center vertically
      );
      _offset = ValueNotifier(centerOffset);
    });
  }

  Future<void> _initializeRenderer() async {
    await _renderer.initialize();
    if (widget.videoStream != null) {
      _renderer.srcObject = widget.videoStream;
    }
  }

  @override
  void didUpdateWidget(covariant CustomModal oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If the underlying video stream changes, update the renderer
    if (widget.videoStream != oldWidget.videoStream) {
      _renderer.srcObject = widget.videoStream;
    }

    // Recalculate center position when modal is opened
    if (widget.isOpen && !oldWidget.isOpen) {
      final size = MediaQuery.of(context).size;
      final centerOffset = Offset(
        (size.width - 140) / 2, // Center horizontally
        (size.height - 140) / 2, // Center vertically
      );
      _offset.value = centerOffset;
    }
  }

  @override
  void dispose() {
    _renderer.dispose();
    _offset.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // If not open, build an empty widget
    if (!widget.isOpen) {
      return const SizedBox.shrink();
    }

    return Stack(
      children: [
        // Semi-transparent overlay behind the draggable modal
        GestureDetector(
          onTap: widget.onClose,
          child: Container(
            color: Colors.black.withOpacity(0.05),
          ),
        ),

        // Draggable modal
        ValueListenableBuilder<Offset>(
          valueListenable: _offset,
          builder: (context, offset, child) {
            return Positioned(
              left: offset.dx,
              top: offset.dy,
              child: GestureDetector(
                // The simplest approach: update our offset by the drag delta.
                onPanUpdate: (details) {
                  _offset.value = Offset(
                    _offset.value.dx + details.delta.dx,
                    _offset.value.dy + details.delta.dy,
                  );
                },
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: [
                      // Header with AudioLevelBars and Close Button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child:
                                AudioLevelBars(audioLevel: widget.audioLevel),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.red),
                            onPressed: widget.onClose,
                          ),
                        ],
                      ),
                      // Body with RTCVideoView or placeholder
                      Expanded(
                        child: widget.hasVideoFeed && widget.videoStream != null
                            ? RTCVideoView(
                                _renderer,
                                objectFit: RTCVideoViewObjectFit
                                    .RTCVideoViewObjectFitCover,
                                mirror: true,
                              )
                            : Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: Colors.grey[300],
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                alignment: Alignment.center,
                                child: const Text(
                                  'No video feed available',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.black54,
                                  ),
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
