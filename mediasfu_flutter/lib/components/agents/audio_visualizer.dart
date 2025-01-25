import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

/// Replicates the original logic:
/// - 16 bars that change height randomly if `animate` is true.
/// - Each frame, bar heights clamp at [10..225].
/// - If `animate` is false, all bars reset to 0.
class AudioVisualizer extends StatefulWidget {
  final bool animate;

  const AudioVisualizer({super.key, required this.animate});

  @override
  // ignore: library_private_types_in_public_api
  _AudioVisualizerState createState() => _AudioVisualizerState();
}

class _AudioVisualizerState extends State<AudioVisualizer> {
  final int _bufferLength = 16; // Number of bars
  late List<double> _bars; // Stores current bar heights

  Timer? _frameTimer;
  final Random _rand = Random();

  @override
  void initState() {
    super.initState();
    _bars = List.filled(_bufferLength, 0);
    if (widget.animate) {
      _startAnimation();
    }
  }

  @override
  void didUpdateWidget(covariant AudioVisualizer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animate && !oldWidget.animate) {
      // Start animating
      _resetBars();
      _startAnimation();
    } else if (!widget.animate && oldWidget.animate) {
      // Stop animating & reset
      _frameTimer?.cancel();
      _resetBars();
      setState(() {});
    }
  }

  void _startAnimation() {
    _frameTimer?.cancel();
    // ~60 FPS => 16ms, but we can do ~30 FPS => 33ms or replicate requestAnimationFrame
    _frameTimer = Timer.periodic(const Duration(milliseconds: 16), (_) {
      setState(() {
        for (int i = 0; i < _bars.length; i++) {
          double newVal = _bars[i] + _rand.nextDouble() * 10 - 5;
          newVal = newVal.clamp(10.0, 225.0);
          _bars[i] = widget.animate ? newVal : 0;
        }
      });
    });
  }

  void _resetBars() {
    _bars = List.filled(_bufferLength, widget.animate ? 10 : 0);
  }

  @override
  void dispose() {
    _frameTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      // Your card styles from React
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE0E0E0)),
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
          ),
        ],
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Audio Visualizer',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF007BFF),
            ),
          ),
          const SizedBox(height: 5),
          Container(
            // The "visualizer" container
            height: 120,
            decoration: BoxDecoration(
              color: const Color(0xFFF9F9F9),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(_bars.length, (index) {
                final barHeight = _bars[index];
                // from red at bottom to green at top, approximate color
                // color = rgb(255 - (barHeight / 225)*255, (barHeight / 225)*255, 0)
                final double fraction = barHeight / 225.0;
                final int r = (255 - fraction * 255).clamp(0, 255).toInt();
                final int g = (fraction * 255).clamp(0, 255).toInt();
                final Color barColor = Color.fromRGBO(r, g, 0, 1);

                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    height: barHeight,
                    decoration: BoxDecoration(
                      color: barColor,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
