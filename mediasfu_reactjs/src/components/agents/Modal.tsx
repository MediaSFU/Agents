import React, { useRef, useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./Modal.css";
import AudioLevelBars from "./AudioLevelBars";

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioLevel: number;
  hasVideoFeed: boolean;
}> = ({ isOpen, onClose, videoRef, audioLevel, hasVideoFeed }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } =
      "touches" in e ? e.touches[0] : (e as unknown as MouseEvent);
    setStartPos({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (isDragging && modalRef.current) {
      const { clientX, clientY } =
        "touches" in e ? e.touches[0] : (e as MouseEvent);

      const deltaX = clientX - startPos.x;
      const deltaY = clientY - startPos.y;

      const modalRect = modalRef.current.getBoundingClientRect();
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;

      // Calculate new positions while keeping the modal within bounds
      const newX = Math.min(
        Math.max(currentPos.x + deltaX, 0),
        parentWidth - modalRect.width
      );
      const newY = Math.min(
        Math.max(currentPos.y + deltaY, 0),
        parentHeight - modalRect.height
      );

      modalRef.current.style.left = `${newX}px`;
      modalRef.current.style.top = `${newY}px`;

      setStartPos({ x: clientX, y: clientY });
      setCurrentPos({ x: newX, y: newY });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleDragMove);
      document.addEventListener("touchend", handleDragEnd);
    } else {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      const centerX = (window.innerWidth - modalRect.width) / 2;
      const centerY = (window.innerHeight - modalRect.height) / 2;
      setCurrentPos({ x: centerX, y: centerY });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        ref={modalRef}
        className="modal-content draggable"
        style={{
          width: "140px",
          height: "140px",
          position: "fixed",
          left: `${currentPos.x}px`,
          top: `${currentPos.y}px`,
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="modal-header">
          <AudioLevelBars audioLevel={audioLevel} />
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {hasVideoFeed ? (
            <video ref={videoRef} className="self-video" playsInline autoPlay muted></video>
          ) : (
            <div className="placeholder-video">
              <p>No video feed available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
