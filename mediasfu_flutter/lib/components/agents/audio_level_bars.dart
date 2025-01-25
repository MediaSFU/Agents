import 'dart:async';
import 'package:flutter/material.dart';

/// Replicates the React logic:
/// - Maintains an internal `_level` that increments or decrements by 5
///   until it matches `widget.audioLevel`.
/// - Normalizes `_level` to a [0..10] bar count,
///   then applies a heatmap color: rgb(255 - index*20, index*20, 0).
class AudioLevelBars extends StatefulWidget {
  /// audioLevel is in the range 0..255 from your logic
  final double audioLevel;

  const AudioLevelBars({
    super.key,
    required this.audioLevel,
  });

  @override
  // ignore: library_private_types_in_public_api
  _AudioLevelBarsState createState() => _AudioLevelBarsState();
}

class _AudioLevelBarsState extends State<AudioLevelBars> {
  int _level = 0;
  Timer? _animationTimer;

  @override
  void initState() {
    super.initState();
    _startAnimation();
  }

  @override
  void didUpdateWidget(AudioLevelBars oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If audioLevel changes, we continue the timer logic (no reset needed).
    if (widget.audioLevel != oldWidget.audioLevel) {
      // The existing timer will cause the increments/decrements
      // to keep adjusting _level.
    }
  }

  void _startAnimation() {
    _animationTimer = Timer.periodic(const Duration(milliseconds: 50), (_) {
      if (_level == widget.audioLevel) return;
      setState(() {
        if (_level < widget.audioLevel) {
          _level = (_level + 5).clamp(0, 255);
          if (_level > widget.audioLevel) {
            _level = widget.audioLevel.toInt();
          }
        } else {
          _level = (_level - 5).clamp(0, 255);
          if (_level < widget.audioLevel) {
            _level = widget.audioLevel.toInt();
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _animationTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Normalize the audio level to 0..10 bars:
    // original code => ((level - 127.5) / (275 - 127.5)) * 10
    final double normalized = ((_level - 127.5) / (275 - 127.5)) * 10;
    final int barsFilled = normalized.isNegative ? 0 : normalized.floor();
    final bars = List.generate(10, (i) => i < barsFilled);

    return SizedBox(
      height: 10, // matches your "height: 10" in React
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(10, (index) {
          final bool filled = bars[index];
          // Compute color: rgb(255 - index*20, index*20, 0)
          final int r = (255 - index * 20).clamp(0, 255);
          final int g = (index * 20).clamp(0, 255);
          final Color barColor =
              filled ? Color.fromRGBO(r, g, 0, 1.0) : Colors.grey[300]!;

          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 1),
              height: double.infinity, // fill the parent (10px) in height
              decoration: BoxDecoration(
                color: barColor,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }),
      ),
    );
  }
}
