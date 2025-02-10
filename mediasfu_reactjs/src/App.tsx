import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faSun,
  faMoon,
  faSyncAlt,
  faCamera,
  faEye,
  faEyeSlash,
  faComments,
  faCommentSlash,
  faAssistiveListeningSystems,
  faDeaf,
} from "@fortawesome/free-solid-svg-icons";

import "./App.css";
import AudioVisualizer from "./components/agents/AudioVisualizer";
import Modal from "./components/agents/Modal";
import {
  toggleAudio,
  toggleVideo,
  disconnectRoom,
  switchCamera,
  selectCamera,
} from "./hooks/useAudioVideoSDK";
import MediaSFUHandler, {
  MediaSFUHandlerProps,
} from "./components/MediaSFUHandler";

const MAX_HOURLY_SESSIONS = 200000;
const MAX_DAILY_SESSIONS = 500000;

const config = {
  audio: {
    format: "wav",
    channels: 1,
    sampleRate: 16000,
    denoise: {
      enable: true,
      highpass: 200,
      lowpass: 3000,
      detectSilence: true,
      silenceThreshold: -35,
      silenceDuration: 0.25,
      silenceMinDuration: 0.25,
      pauseOnSilence: true,
    },
    pipeline: ["stt", "ttllm", "tts"],
    sttNickName: "yourSTT",
    llmNickName: "yourllm",
    ttsNickName: "yourtts",
    returnAudioFormat: "base64",
    returnAll: true,
    
  },
  vision: {
    fps: 0.5,
    pipeline: ["visionllm", "tts"],
    llmNickName: "yourllm",
    ttsNickName: "yourtts",
    returnAudioFormat: "base64",
    returnAll: true,
    
  },
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop();
    if (part) {
      return part.split(";").shift();
    }
  }
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

const checkSessionLimit = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  const sessionData = getCookie("user_sessions");
  const sessions = sessionData ? JSON.parse(sessionData) : [];

  const validSessions = sessions.filter(
    (timestamp: number) => now - timestamp < oneDay
  );

  const hourlySessions = validSessions.filter(
    (timestamp: number) => now - timestamp < oneHour
  );

  if (hourlySessions.length >= MAX_HOURLY_SESSIONS) {
    return {
      allowed: false,
      reason: `You can only start ${MAX_HOURLY_SESSIONS} sessions per hour.`,
    };
  }

  if (validSessions.length >= MAX_DAILY_SESSIONS) {
    return {
      allowed: false,
      reason: `You can only start ${MAX_DAILY_SESSIONS} sessions per day.`,
    };
  }

  return { allowed: true };
};

const startNewSession = () => {
  const now = Date.now();
  const sessionData = getCookie("user_sessions");
  const sessions = sessionData ? JSON.parse(sessionData) : [];

  sessions.push(now);
  setCookie("user_sessions", JSON.stringify(sessions), 1);

  return true;
};

const App: React.FC = () => {
  const socket = useRef<Socket | null>(null);

  // Audio playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlocked = useRef<boolean>(false);
  const isAudioPlaying = useRef<boolean>(false);
  const audioQueue = useRef<(string | Blob)[]>([]);

  // State for recognized text
  const [transcript, setTranscript] = useState<string>("");

  // Basic UI states
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const micOn = useRef<boolean>(false);
  const tempMicOn = useRef<boolean>(false);
  const doAEC = useRef<boolean>(false);
  const [videoOn, setVideoOn] = useState<boolean>(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [showRoom, setShowRoom] = useState<boolean>(false);

  const selfVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Pipeline / Socket states
  const roomConnected = useRef<boolean>(false);
  const agentRoom = useRef<string>("");
  const sourceParameters = useRef<Record<string, any>>({});
  const [sourceChanged, setSourceChanged] = useState<number>(0);
  function updateSourceParameters(data: Record<string, any>) {
    sourceParameters.current = data;
    setSourceChanged((prev) => prev + 1);
  }
  const [chatMessages, setChatMessages] = useState<
    { sender: string; message: string }[]
  >([
    { sender: "System", message: "Welcome to the AI Agent!" },
    {
      sender: "System",
      message: "Please wait while we connect you to the agent room.",
    },
  ]);
  const [showChat, setShowChat] = useState<boolean>(true);

  const [animate, setAnimate] = useState(false);
  const audioLevel = useRef<number>(0);
  const prevAudioLevel = useRef<number>(0);
  const showRoomDetails = useRef<MediaSFUHandlerProps | null>({
    action: "create",
    name: "agent",
    sourceParameters: sourceParameters.current,
    updateSourceParameters,
  });
  const sessionChecked = useRef<boolean>(false);
  const lastMicAlert = useRef<number>(0);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const unlockAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
        audioUnlocked.current = true;
      } catch (error) {
        console.error("Failed to unlock AudioContext:", error);
      }
    }
  };

  // For toggling microphone / camera
  async function toggleMic() {
    if (!audioUnlocked.current) {
      await unlockAudioContext();
    }

    if (!Object.keys(sourceParameters.current).length) return;
    await toggleAudio({ sourceParameters: sourceParameters.current });
  }
  async function toggleCamera() {
    if (!audioUnlocked.current) {
      await unlockAudioContext();
    }
    if (!Object.keys(sourceParameters.current).length) return;
    await toggleVideo({ sourceParameters: sourceParameters.current });

    if (!videoOn && videoInputs.length === 0) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputList = devices.filter((d) => d.kind === "videoinput");
      setVideoInputs(videoInputList);
      if (!isModalOpen) setIsModalOpen(true);
    }
  }
  async function pickCamera({ deviceId }: { deviceId: string }) {
    if (!Object.keys(sourceParameters.current).length) return;
    await selectCamera({
      deviceId,
      sourceParameters: sourceParameters.current,
    });
  }
  async function swapCamera() {
    if (!Object.keys(sourceParameters.current).length) return;
    await switchCamera({ sourceParameters: sourceParameters.current });
  }

  // Show/hide toast
  const [toast, setToast] = useState<string>("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "info"
  );
  function showToast(msg: string, type: "error" | "success" | "info" = "info") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 6000);
  }
 
   // For playing pipeline-sent audio
   /**
    * Plays base64-encoded audio using AudioContext.
    * Handles audio queue and ensures proper mic handling during playback.
    * @param base64 - Base64-encoded audio string.
    */
   async function playQueuedBase64(base64: string) {
     // Check if audio playback is already in progress
     if (isAudioPlaying.current) {
       audioQueue.current.push(base64);
       return;
     }
 
     try {
       // Decode base64 string to a Uint8Array
       const byteCharacters = atob(base64);
       const byteArray = Uint8Array.from(byteCharacters, (char) =>
         char.charCodeAt(0)
       );
 
       if (!audioContextRef.current) {
         audioContextRef.current = new AudioContext();
       }
 
       // Decode audio data using AudioContext
       const audioBuffer = await audioContextRef.current?.decodeAudioData(byteArray.buffer);
 
       // Create an audio buffer source
       const source = audioContextRef.current?.createBufferSource();
       source.buffer = audioBuffer;
 
       // Connect the source to the destination (speakers)
       source.connect(audioContextRef.current?.destination);
 
       // Manage microphone state during playback
       if (micOn.current && doAEC.current) {
         tempMicOn.current = true;
         await toggleAudio({ sourceParameters: sourceParameters.current });
       }
 
       // Set state for playback animation
       isAudioPlaying.current = true;
       setAnimate(true);
 
       // Start audio playback
       source.start();
 
       // Handle audio playback completion
       source.onended = async () => {
         setAnimate(false);
         isAudioPlaying.current = false;
 
         // Re-enable mic if it was disabled during playback
         if (tempMicOn.current) {
           await toggleAudio({ sourceParameters: sourceParameters.current });
           tempMicOn.current = false;
         }
 
         // Play the next audio in the queue if available
         if (audioQueue.current.length > 0) {
           const nextAudio = audioQueue.current.shift();
           if (nextAudio) {
             playQueuedBase64(nextAudio);
           }
         }
       };
     } catch (error) {
       console.error("Failed to play audio:", error);
       isAudioPlaying.current = false;
       setAnimate(false);
 
       // Re-enable mic if it was disabled during playback
       if (tempMicOn.current) {
         await toggleAudio({ sourceParameters: sourceParameters.current });
         tempMicOn.current = false;
       }
     }
   }
  useEffect(() => {
    // Listen for updates from sourceParameters

    if (Object.keys(sourceParameters.current).length > 0) {
      if (sourceParameters.current.audioAlreadyOn !== micOn.current) {
        micOn.current = sourceParameters.current.audioAlreadyOn;
      }
      if (sourceParameters.current.videoAlreadyOn !== videoOn) {
        setVideoOn(sourceParameters.current.videoAlreadyOn);
      }
      if (
        (sourceParameters.current.socket && !socket.current) ||
        (sourceParameters.current.localSocket &&
          sourceParameters.current.localSocket.id &&
          !socket.current)
      ) {
        if (
          sourceParameters.current.localSocket &&
          sourceParameters.current.localSocket.id
        ) {
          socket.current = sourceParameters.current.localSocket;
        } else {
          socket.current = sourceParameters.current.socket;
        }
      }

      if (sourceParameters.current.audioLevel !== audioLevel.current) {
        prevAudioLevel.current = audioLevel.current;
        audioLevel.current = sourceParameters.current.audioLevel;
      }

      // remove or keep the logic for silence detection
      // ...

      if (
        sourceParameters.current.userDefaultVideoInputDevice !== "" &&
        sourceParameters.current.userDefaultVideoInputDevice !==
          selectedVideoInput
      ) {
        setSelectedVideoInput(
          sourceParameters.current.userDefaultVideoInputDevice
        );
      }
      if (sourceParameters.current.localStreamVideo && selfVideoRef.current) {
        if (
          selfVideoRef.current.srcObject !==
          sourceParameters.current.localStreamVideo
        ) {
          selfVideoRef.current.srcObject =
            sourceParameters.current.localStreamVideo;
        }
      }

      if (sourceParameters.current.socket?.id && !roomConnected.current) {
        roomConnected.current = true;
        setChatMessages((prev) => [
          ...prev,
          { sender: "System", message: "Connected to the agent room." },
          { sender: "Agent", message: "Hello! How can I help you today?" },
          { sender: "System", message: "Please start speaking." },
        ]);
        //if muted, add message to unmute
        if (!micOn.current) {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "System",
              message:
                "You are currently muted. Please unmute to speak. You can alternatively turn on your camera to communicate.",
            },
          ]);
        }
        if (
          sourceParameters.current.roomName !== agentRoom.current &&
          sourceParameters.current.roomName !== ""
        ) {
          agentRoom.current = sourceParameters.current.roomName;
          if (!isCapturing) {
            setTimeout(() => {
              startCapture();
            }, 500);
          }
        }
        showToast("Connected to the agent room!", "success");

        socket.current?.on("image", ({ jpegBuffer }) => {});
        socket.current?.on("audio", ({ audioBuffer }) => {});
        socket.current?.on("silenceDetected", ({ silent }) => {});
        socket.current?.on("pipelineResult", (data) => {
          // pipeline events for LLM text, TTS audio, etc.
          if (data.text) {
            setChatMessages((prev) => [
              ...prev,
              { sender: "Agent", message: data.text },
            ]);
          }
          if (data.transcript) {
            setTranscript(data.transcript);
          }
          if (data.audio) {
            playQueuedBase64(data.audio);
          }
        });
        socket.current?.on("pipelineResultVision", (data) => {
          if (data.text) {
            setChatMessages((prev) => [
              ...prev,
              { sender: "Agent", message: data.text },
            ]);
          }
          if (data.audio !== null) {
            playQueuedBase64(data.audio);
          }
        });

        socket.current?.on("pipelineError", (data) => {
          showToast(`Voice pipeline error: ${data.error}`, "error");
        });

        socket.current?.on("pipelineErrorVision", (data) => {
          showToast(`Vision pipeline error: ${data.error}`, "error");
        });
        socket.current?.on("disconnect", () => {
          roomConnected.current = false;
          setChatMessages((prev) => [
            ...prev,
            { sender: "System", message: "You have been disconnected." },
          ]);
          showToast("You have been disconnected.", "error");
          setTimeout(() => {
            window.location.reload();
          }, 500);
        });
      }

      if (sourceParameters.current.alertMessage) {
        showToast(sourceParameters.current.alertMessage, "info");
        if (
          sourceParameters.current.alertMessage.includes(
            "You have been disconnected"
          )
        ) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    }
  }, [sourceChanged, videoOn, selectedVideoInput]);

  useEffect(() => {
    return () => {
      try {
        socket.current?.off("pipelineResult", () => {});
        socket.current?.off("pipelineResultVision", () => {});
        socket.current?.off("silenceDetected", () => {});
        socket.current?.off("pipelineError", () => {});
        socket.current?.off("pipelineErrorVision", () => {});
        socket.current?.off("disconnect", () => {});
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (roomConnected.current) {
        disconnectRoom({ sourceParameters: sourceParameters.current });
      }
    };
  }, []);

  function startCapture() {
    if (!roomConnected.current) {
      showToast("Cannot capture until room is connected.", "error");
      return;
    }

    if (isCapturing) {
      return;
    }
    if (socket.current && agentRoom.current && socket.current?.id) {
      socket.current.on("startBuffers", () => {
        console.log("Buffers started");
        socket.current?.emit(
          "startBuffer",
          { roomName: agentRoom.current, member: "agent" },
          (response: any) => {
            if (response.success) {
              setIsCapturing(true);
            } else {
              showToast(`Failed to initiate buffer for agent.`, "error");
            }
          }
        );
      });

      socket.current.emit(
        "startDataBuffer",
        { roomName: agentRoom.current, config },
        (response: any) => {
          if (response.success) {
            setIsCapturing(true);
          } else {
            const messageDisplay = response?.reason.includes(
              "Failed to get AI credentials"
            )
              ? response.reason
              : "Check your connection and try again.";
            showToast(`Failed to start session. ${messageDisplay}`, "error");
          }
        }
      );
    }
  }

  function toggleDarkMode() {
    setIsDarkMode((prev) => !prev);
  }

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (showRoom) return;
    if (!sessionChecked.current) {
      const sessionCheck = checkSessionLimit();
      if (!sessionCheck.allowed) {
        showToast(sessionCheck.reason!, "error");
        setChatMessages((prev) => [
          ...prev,
          { sender: "System", message: sessionCheck.reason! },
        ]);
        return;
      }
    }
    setShowRoom(true);

    sessionChecked.current = true;
    startNewSession();
  }, [showRoom]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]); // Scroll chat box to bottom when new messages are added

  useEffect(() => {
    const interval = setInterval(() => {
      if (!micOn.current && !videoOn && isCapturing) {
        if (Date.now() - lastMicAlert.current > 30000) {
          showToast(
            "Your microphone is off. Click the mic button to start speaking."
          );
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "Agent",
              message:
                "I can't hear you. Please unmute your microphone to speak. You can alternatively turn on your camera to communicate.",
            },
          ]);
          lastMicAlert.current = Date.now();
        }
      } else {
        lastMicAlert.current = Date.now();
      }
    }, 10000);

    return () => clearInterval(interval); // Clean up the interval on unmount
  }, [videoOn, isCapturing]);

  return (
    <div className="container">
      {showRoom && showRoomDetails.current && (
        <MediaSFUHandler
          action={showRoomDetails.current.action}
          duration={showRoomDetails.current.duration}
          capacity={showRoomDetails.current.capacity}
          name={showRoomDetails.current.name}
          meetingID={showRoomDetails.current.meetingID}
          sourceParameters={sourceParameters.current}
          updateSourceParameters={updateSourceParameters}
        />
      )}

      {/* Top Bar */}
      <div className="header-bar">
        <div className="header-left">
          <h1>MediaSFU AI Agent</h1>
        </div>
        <div className="header-right">
          <div className="status-indicator">
            <span
              className={`status-dot ${
                roomConnected.current ? "connected" : "disconnected"
              }`}
            />
            <span
              className={`status-text ${
                roomConnected.current ? "active" : "inactive"
              }`}
            >
              {roomConnected.current ? "active" : "inactive"}
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="darkModeToggle"
            title="Toggle Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
          </button>
        </div>
      </div>
      {toast && (
        <div id="toast-container" className={`toast ${toastType}`}>
          {toast}
        </div>
      )}

      {/* Main Content - Left: video feed & transcript */}
      <div className="content">
        <div className="leftColumn">
          <div className="audioCard">
            <h2>Transcript</h2>
            <div className="transcriptBox">
              {transcript || "No speech detected."}
            </div>
          </div>
        </div>

        {/* Right: Audio visualizer, maybe nothing else */}
        <div className="rightColumn">
          {showChat && (
            <div className="chatCard">
              <h2>Chat</h2>
              <div className="chatBox" ref={chatBoxRef}>
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chatMessage ${
                      msg.sender === "You"
                        ? "user"
                        : msg.sender === "Agent" || msg.sender === "Agent"
                        ? "agent"
                        : "system"
                    }`}
                  >
                    <strong>{msg.sender}:</strong> {msg.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          <AudioVisualizer animate={animate} />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoRef={selfVideoRef}
        audioLevel={audioLevel.current}
        hasVideoFeed={videoOn}
      />

      {/* Bottom Bar Controls */}
      <div className="bottomBar">
        <button
          onClick={toggleMic}
          className={`iconButton ${micOn.current ? "active" : "inactive"}`}
          title={micOn.current ? "Turn Mic Off" : "Turn Mic On"}
          aria-label={
            micOn.current ? "Turn microphone off" : "Turn microphone on"
          }
          aria-pressed={micOn.current}
          disabled={isAudioPlaying.current}
        >
          <FontAwesomeIcon
            icon={micOn.current ? faMicrophone : faMicrophoneSlash}
          />
        </button>

        <button
          onClick={toggleCamera}
          className={`iconButton ${videoOn ? "active" : "inactive"}`}
          title={videoOn ? "Turn Video Off" : "Turn Video On"}
          aria-label={videoOn ? "Turn video off" : "Turn video on"}
          aria-pressed={videoOn}
        >
          <FontAwesomeIcon icon={videoOn ? faVideo : faVideoSlash} />
        </button>

        {videoOn && (
          <button
            className="toggle-cam-btn"
            onClick={swapCamera}
            title="Switch Camera"
          >
            <FontAwesomeIcon icon={faSyncAlt} /> Cam
          </button>
        )}
        {videoInputs.length > 1 && (
          <div className="cam-controls">
            <label>
              <FontAwesomeIcon icon={faCamera} />
            </label>
            <select
              value={selectedVideoInput || ""}
              onChange={(e) => pickCamera({ deviceId: e.target.value })}
              className="form-control"
            >
              {videoInputs.map((input) => (
                <option key={input.deviceId} value={input.deviceId}>
                  {input.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => setIsModalOpen((prev) => !prev)}
          className="iconButton self-view-button"
          title="Toggle Self Video"
          aria-label="Toggle Self Video"
        >
          {isModalOpen ? (
            <FontAwesomeIcon icon={faEyeSlash} />
          ) : (
            <FontAwesomeIcon icon={faEye} />
          )}
        </button>

        <button
          onClick={() => setShowChat((prev) => !prev)}
          className="iconButton chat-button"
          title="Toggle Chat"
          aria-label="Toggle Chat"
        >
          {!showChat ? (
            <FontAwesomeIcon icon={faComments} />
          ) : (
            <FontAwesomeIcon icon={faCommentSlash} />
          )}
        </button>

        {/* Do Acoustic Echo Cancellation */}
        <button
          onClick={() => {
            doAEC.current = !doAEC.current;
            showToast(
              `AEC ${
                doAEC.current
                  ? "enabled; only useful if you have echo issues on loudspeaker. You may experience performance issues."
                  : "disabled; you may experience echo but better performance."
              }`,
              "info"
            );
          }}
          className="iconButton aec-button"
          title="Toggle AEC"
          aria-label="Toggle AEC"
        >
          <FontAwesomeIcon
            icon={doAEC.current ? faDeaf : faAssistiveListeningSystems}
          />
        </button>
      </div>
    </div>
  );
};

export default App;
