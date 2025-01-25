// AudioVisualizer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AudioVisualizerProps {
  animate: boolean;
}

/**
 * AudioVisualizer replicates the original logic:
 * - 16 bars that randomly change their height if `animate` is true.
 * - On each frame, heights are clamped between 0 and 225, with a minimum of 10.
 * - If `animate` is false, all bars reset to 0.
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ animate }: AudioVisualizerProps) => {
  const [bars, setBars] = useState<number[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const bufferLength = 16; // Number of bars
    const initialBars = new Array(bufferLength).fill(0);
    setBars(initialBars);

    const updateBars = () => {
      setBars((prevBars: any[]) =>
        prevBars.map((bar: number) => {
          // Variation: up or down by random, clamp at [10..225]
          const newVal = bar + Math.random() * 10 - 5;
          const clamped = newVal > 225 ? 225 : newVal < 10 ? 10 : newVal;
          return animate ? clamped : 0;
        })
      );
      animationIdRef.current = requestAnimationFrame(updateBars);
    };

    if (animate) {
      animationIdRef.current = requestAnimationFrame(updateBars);
    } else {
      // Reset bars
      setBars(initialBars);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Audio Visualizer</Text>
      <View style={styles.visualizer}>
        {bars.map((barHeight: number, index: any) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: barHeight,
                // Approximate the color gradient:
                // from red at bottom to green at top, with a blend
                backgroundColor: `rgb(${255 - (barHeight / 225) * 255}, ${
                  (barHeight / 225) * 255
                }, 0)`,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default AudioVisualizer;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    minHeight: 120,
    maxHeight: 300,
  },
  title: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  visualizer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    minHeight: 120,
    maxHeight: '90%',
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 5,
  },
  bar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 4,
  },
});
