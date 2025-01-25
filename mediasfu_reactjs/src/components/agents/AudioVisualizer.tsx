import React, { useEffect, useRef, useState } from "react";
import "./AudioVisualizer.css";

interface AudioVisualizerProps {
  animate: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ animate }) => {
  const [bars, setBars] = useState<number[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const bufferLength = 16; // Number of bars
    const initialBars = new Array(bufferLength).fill(0);
    setBars(initialBars);

    const updateBars = () => {
      setBars((prevBars) =>
        prevBars.map((bar) =>
          animate
            ? Math.max(10, bar + Math.random() * 10 - 5 > 225 ? 225 : bar + Math.random() * 10 - 5)
            : 0
        )
      );
      animationIdRef.current = requestAnimationFrame(updateBars);
    };

    if (animate) {
      animationIdRef.current = requestAnimationFrame(updateBars);
    } else {
      setBars(initialBars); // Reset bars when not animating
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="audio-visualizer-card">
      <h3>Audio Visualizer</h3>
      <div className="audio-visualizer">
        {bars.map((barHeight, index) => (
          <div
            key={index}
            className="bar"
            style={{
              height: `${barHeight}px`,
              background: `linear-gradient(to top, rgba(255, 0, 0, ${barHeight / 265}), rgba(255, 255, 0, ${
                barHeight / 265
              }), rgba(0, 255, 0, ${barHeight / 265}))`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AudioVisualizer;
