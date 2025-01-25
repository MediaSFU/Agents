import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

interface AudioLevelBarsProps {
  audioLevel: number; // 0–255 range from your logic
}

/**
 * AudioLevelBars replicates the exact logic of the original React (web) component:
 * - Maintains an internal 'level' that increments or decrements by 5 until it matches 'audioLevel'.
 * - Normalizes the final 'level' to determine how many bars (out of 10) should be filled.
 * - Applies a heatmap color gradient based on the bar index: rgb(255 - index*20, index*20, 0).
 */
const AudioLevelBars: React.FC<AudioLevelBarsProps> = ({ audioLevel }: AudioLevelBarsProps) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    // Smoothly animate the audio level in increments/decrements of 5
    const animation = setInterval(() => {
      setLevel((prev: number) => {
        if (prev === audioLevel) {return prev;}
        return prev < audioLevel
          ? Math.min(prev + 5, audioLevel) // Increment
          : Math.max(prev - 5, audioLevel); // Decrement
      });
    }, 50);

    return () => clearInterval(animation);
  }, [audioLevel]);

  // Normalize the audio level to determine the number of filled bars
  const normalizedLevel = Math.max(0, ((level - 127.5) / (275 - 127.5)) * 10); // Map to 0–10 bars
  const bars = Array.from({ length: 10 }, (_, i) => i < normalizedLevel);

  return (
    <View style={styles.container}>
      {bars.map((filled, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            filled && {
              backgroundColor: `rgb(${255 - index * 20}, ${index * 20}, 0)`,
            },
          ]}
        />
      ))}
    </View>
  );
};

export default AudioLevelBars;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: 10,
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
    height: '100%',
    backgroundColor: '#ccc',
    borderRadius: 4,
  },
});
