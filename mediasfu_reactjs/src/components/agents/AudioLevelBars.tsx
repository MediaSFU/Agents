import { useState, useEffect } from "react";

const AudioLevelBars: React.FC<{ audioLevel: number }> = ({ audioLevel }) => {
    const [level, setLevel] = useState(0);
  
    useEffect(() => {
      // Smoothly animate the audio level
      const animation = setInterval(() => {
        setLevel((prev) => {
          if (prev === audioLevel) return prev;
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
      <div className="audio-bars-container">
        {bars.map((filled, index) => (
          <div
            key={index}
            className={`audio-bar ${filled ? "filled" : ""}`}
            style={{
              backgroundColor: filled
                ? `rgb(${255 - index * 20}, ${index * 20}, 0)` // Heatmap gradient
                : "#ccc",
            }}
          ></div>
        ))}
      </div>
    );
  };

export default AudioLevelBars;