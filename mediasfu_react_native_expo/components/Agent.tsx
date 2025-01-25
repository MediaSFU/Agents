import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Socket } from "socket.io-client";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { mediaDevices, MediaStream } from "./custom/webrtc/webrtc";
import { Audio } from "expo-av";
import RNRestart from "react-native-restart";
import * as FileSystem from "expo-file-system";

// Replace with your local imports
import AudioVisualizer from "./agents/AudioVisualizer";
import CustomModal from "./agents/Modal";
import MediaSFUHandler, { MediaSFUHandlerProps } from "./MediaSFUHandler";
import {
  toggleAudio,
  toggleVideo,
  disconnectRoom,
  switchCamera,
  selectCamera,
} from "../hooks/useAudioVideoSDK";

// If using a dropdown for camera selection:
import DropDownPicker from "react-native-dropdown-picker";

/* ------------------------------------------------------------------
   SESSION LOGIC CHANGES
   (Max sessions changed to 200000 and 500000)
   ------------------------------------------------------------------ */
const SESSION_KEY = "user_sessions";
const MAX_HOURLY_SESSIONS = 200000;
const MAX_DAILY_SESSIONS = 500000;

async function checkSessionLimit() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    const sessions: number[] = data ? JSON.parse(data) : [];

    // Keep only sessions within the last day
    const validSessions = sessions.filter(
      (timestamp) => now - timestamp < oneDay
    );
    const hourlySessions = validSessions.filter(
      (timestamp) => now - timestamp < oneHour
    );

    if (hourlySessions.length >= MAX_HOURLY_SESSIONS) {
      return {
        allowed: false,
        reason: `You have reached the hourly session limit of ${MAX_HOURLY_SESSIONS}.`,
      };
    }
    if (validSessions.length >= MAX_DAILY_SESSIONS) {
      return {
        allowed: false,
        reason: `You have reached the daily session limit of ${MAX_DAILY_SESSIONS}.`,
      };
    }
    return { allowed: true };
  } catch (error) {
    console.error("Error checking session limit:", error);
    return { allowed: false, reason: "Session check failed." };
  }
}

async function startNewSession() {
  const now = Date.now();
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    const sessions: number[] = data ? JSON.parse(data) : [];
    sessions.push(now);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error("Error starting new session:", error);
    return false;
  }
}

/* ------------------------------------------------------------------
   UPDATED PIPELINE CONFIG
   ------------------------------------------------------------------ */
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
    llmNickName: "yourLLM",
    ttsNickName: "yourTTS",
    returnAll: true,
    returnAudioFormat: "base64",
  },
  vision: {
    fps: 0.5,
    pipeline: ["visionllm", "tts"],
    llmNickName: "yourLLM",
    ttsNickName: "yourTTS",
    returnAudioFormat: "base64",
    returnAll: true,
  },
};

const App: React.FC = () => {
  // ----- REFS -----
  const socket = useRef<Socket | null>(null);
  const audioQueue = useRef<string[]>([]); // For audio playback queue
  const lastMicAlert = useRef<number>(0); // For mic inactivity reminders
  const [showDropdown, setShowDropdown] = useState(false);

  // ----- STATE: capturing, mic/cam, transcripts, etc. -----
  const isAudioPlaying = useRef(false);
  const [transcript, setTranscript] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const micOn = useRef(false);
  const tempMicOn = useRef(false);
  const doAEC = useRef(true);
  const [videoOn, setVideoOn] = useState(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoInput, setSelectedVideoInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const localStream = useRef<MediaStream | null>(null);

  // ----- Chat UI states -----
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; message: string }[]
  >([
    { sender: "System", message: "Welcome to the AI Agent!" },
    {
      sender: "System",
      message: "Please wait while we connect you to the agent room.",
    },
  ]);

  const scrollViewRef = useRef<ScrollView | null>(null);

  // Whether we've done the session limit check
  const sessionChecked = useRef<boolean>(false);

  // showRoom => if false, do NOT render MediaSFUHandler
  const [showRoom, setShowRoom] = useState<boolean>(false);

  // Room connection states
  const roomConnected = useRef<boolean>(false);
  const agentRoom = useRef<string>("");

  // For hooking into MediaSFUHandler
  const sourceParameters = useRef<Record<string, any>>({});
  const [sourceChanged, setSourceChanged] = useState(0);
  function updateSourceParameters(data: Record<string, any>) {
    sourceParameters.current = data;
    setSourceChanged((prev) => prev + 1);
  }

  // Animate audio visualizer
  const [animate, setAnimate] = useState(false);
  const audioLevel = useRef<number>(0);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  // Decide whether to show <MediaSFUHandler />
  const showRoomDetails = useRef<MediaSFUHandlerProps | null>({
    action: "create",
    name: "agent",
    sourceParameters: sourceParameters.current,
    updateSourceParameters,
  });

  // Reset all states
  const resetState = () => {
    micOn.current = false;
    setVideoOn(false);
    setTranscript("");
    setChatMessages([]);
    setIsCapturing(false);
    roomConnected.current = false;
    agentRoom.current = "";
    sourceParameters.current = {};
    setSourceChanged(0);
    setAnimate(false);
    audioQueue.current = [];
    lastMicAlert.current = 0;
    setIsModalOpen(false);
    localStream.current = null;
    sessionChecked.current = false;

    try {
      if (socket.current) {
        socket.current?.off("pipelineResult");
        socket.current?.off("pipelineResultVision");
        socket.current?.off("pipelineError");
        socket.current?.off("pipelineErrorVision");
        socket.current?.off("disconnect");
      }
    } catch {
      // Ignore errors
    }

    RNRestart.Restart();
  };

  /* ------------------------------------------------------------------
     TOAST HELPER (increasing to ~6s)
     ------------------------------------------------------------------ */
  const showToast = (
    msg: string,
    type: "error" | "success" | "info" = "info",
    timeMs: number = 6000
  ) => {
    Toast.show({
      type,
      text1: msg,
      position: "top",
      topOffset: 0,
      visibilityTime: timeMs,
      text1Style: { fontSize: 12 },
    });
  };

  /* ------------------------------------------------------------------
     ON MOUNT: check session limit (if not checked), decide showRoom
     ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      if (sessionChecked.current) {
        return;
      }
      const sessionStatus = await checkSessionLimit();
      if (!sessionStatus.allowed) {
        showToast(sessionStatus.reason!, "error");
        setChatMessages((prev) => [
          ...prev,
          { sender: "System", message: sessionStatus.reason! },
        ]);
        return;
      }
      sessionChecked.current = true;
      setShowRoom(true); // Let the MediaSFUHandler render
      await startNewSession();
    })();
  }, []);

  /* ------------------------------------------------------------------
     Once we showRoom => the MediaSFUHandler is displayed.
     The connection logic picks up in the effect below once
     sourceParameters is updated from inside MediaSFUHandler.
     ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     SOCKET CLEANUP
     ------------------------------------------------------------------ */
  useEffect(() => {
    return () => {
      try {
        if (!socket.current) {
          return;
        }
        socket.current?.off("pipelineResult");
        socket.current?.off("pipelineResultVision");
        socket.current?.off("pipelineError");
        socket.current?.off("pipelineErrorVision");
        socket.current?.off("disconnect");
      } catch (err) {
        console.error("Error cleaning up socket:", err);
      }
    };
  }, []);

  /* ------------------------------------------------------------------
     WATCH for changes in sourceParameters, and wire up socket, etc.
     ------------------------------------------------------------------ */
  useEffect(() => {
    const p = sourceParameters.current;
    if (Object.keys(p).length > 0) {
      // Sync mic
      if (p.audioAlreadyOn !== micOn.current) {
        micOn.current = p.audioAlreadyOn;
      }
      // Sync camera
      if (p.videoAlreadyOn !== videoOn) {
        setVideoOn(p.videoAlreadyOn);
      }

      // Socket assignment
      if (p.socket && !socket.current) {
        socket.current = p.socket;
      }
      if (p.localSocket && p.localSocket.id && !socket.current) {
        socket.current = p.localSocket;
      }

      // Sync room audioLevel & localStream
      if (p.audioLevel !== audioLevel.current) {
        audioLevel.current = p.audioLevel;
      }

      if (p.localStreamVideo !== localStream.current) {
        localStream.current = p.localStreamVideo;
      }

      if (
        p.userDefaultVideoInputDevice !== "" &&
        p.userDefaultVideoInputDevice !== selectedVideoInput
      ) {
        setSelectedVideoInput(p.userDefaultVideoInputDevice);
      }

      // If newly connected
      if (p.socket?.id && !roomConnected.current) {
        roomConnected.current = true;
        // On connect: push a few initial messages
        setChatMessages((prev) => [
          ...prev,
          { sender: "System", message: "Connected to the agent room." },
          { sender: "Agent", message: "Hello! How can I help you today?" },
          { sender: "System", message: "Please start speaking." },
        ]);
        // If currently muted, add a note
        if (!p.audioAlreadyOn) {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "System",
              message:
                "You are currently muted. Please unmute to speak. You can alternatively turn on your camera to communicate.",
            },
          ]);
        }

        // Sync room name
        if (p.roomName && p.roomName !== agentRoom.current) {
          agentRoom.current = p.roomName;
          console.log("Agent room:", agentRoom.current);
          if (!isCapturing) {
            setTimeout(() => {
              startCapture();
            }, 500);
          }

          showToast("Connected to the agent room!", "success");

          // Setup pipeline events
          // socket.current!.on(
          //   'audio',
          //   ({audioBuffer}: {audioBuffer: string}) => {
          //     playQueuedBase64(audioBuffer);
          //   },
          // );

          socket.current!.on("pipelineResult", (data: any) => {
            if (data.text) {
              // Agent's text
              setChatMessages((prev) => [
                ...prev,
                { sender: "Agent", message: data.text },
              ]);
            }
            if (data.transcript) {
              // recognized user speech
              setTranscript(data.transcript);
            }
            if (data.audio) {
              playQueuedBase64(data.audio);
            }
          });

          socket.current!.on("pipelineResultVision", (data: any) => {
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

          socket.current!.on("pipelineError", (data: any) => {
            showToast(`Voice pipeline error: ${data.error}`, "error");
          });

          socket.current!.on("pipelineErrorVision", (data: any) => {
            showToast(`Vision pipeline error: ${data.error}`, "error");
          });

          socket.current!.on("disconnect", () => {
            roomConnected.current = false;
            showToast("Disconnected from the agent room.", "info");

            // Cleanup
            if (socket.current) {
              socket.current?.off("audio");
              socket.current?.off("pipelineResult");
              socket.current?.off("pipelineResultVision");
              socket.current?.off("pipelineError");
              socket.current?.off("pipelineErrorVision");
              socket.current?.off("disconnect");
            }

            // Reset state
            resetState();
          });
        }
      }

      // userDefaultVideoInputDevice changed?
      if (
        p.userDefaultVideoInputDevice &&
        p.userDefaultVideoInputDevice !== selectedVideoInput
      ) {
        setSelectedVideoInput(p.userDefaultVideoInputDevice);
      }

      // alertMessage from server
      if (p.alertMessage) {
        showToast(p.alertMessage, "info");
        if (p.alertMessage.includes("You have been disconnected")) {
          Alert.alert(
            "Disconnected",
            "You have been disconnected from the room."
          );
          resetState();
        }
      }
    }
  }, [sourceChanged, videoOn, isCapturing, selectedVideoInput]);

  /* ------------------------------------------------------------------
     CLEANUP on UNMOUNT: if connected, disconnect
     ------------------------------------------------------------------ */
  useEffect(() => {
    return () => {
      if (roomConnected.current) {
        disconnectRoom({ sourceParameters: sourceParameters.current });
      }
    };
  }, []);

  /* ------------------------------------------------------------------
     START CAPTURE - triggers data buffering with config
     ------------------------------------------------------------------ */
  const startCapture = () => {
    if (!roomConnected.current) {
      showToast("Cannot capture until room is connected.", "error");
      return;
    }
    if (isCapturing) {
      return;
    }
    if (!socket.current) {
      return;
    }

    socket.current.on("startBuffers", () => {
      console.log("Buffers started");
      socket.current?.emit(
        "startBuffer",
        { roomName: agentRoom.current, member: "agent" },
        (res: any) => {
          if (res.success) {
            setIsCapturing(true);
          } else {
            showToast("Failed to initiate buffer for agent.", "error");
          }
        }
      );
    });
    socket.current.emit(
      "startDataBuffer",
      { roomName: agentRoom.current, config },
      (res: any) => {
        if (res.success) {
          setIsCapturing(true);
        } else {
          // Check if server gave a reason
          const messageDisplay = res?.reason?.includes(
            "Failed to get AI credentials"
          )
            ? res.reason
            : "Check your connection and try again.";
          showToast(`Failed to start session. ${messageDisplay}`, "error");
        }
      }
    );
  };

  /* ------------------------------------------------------------------
     PLAY AUDIO BLOB (queue if something is playing)
     ------------------------------------------------------------------ */
  const playQueuedBase64 = async (base64Audio: string) => {
    if (isAudioPlaying.current) {
      // Add to queue if audio is already playing
      audioQueue.current.push(base64Audio);
      return;
    }

    isAudioPlaying.current = true;
    setAnimate(true); // Start animating audio visualizer

    try {
      if (Platform.OS === "web") {
        // Web-specific implementation
        const { sound } = await Audio.Sound.createAsync({
          uri: `data:audio/mp3;base64,${base64Audio}`,
        });

        // Set the volume to 0.5
        await sound.setVolumeAsync(0.5);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            isAudioPlaying.current = false;
            if (tempMicOn.current && !micOn.current) {
              tempMicOn.current = false;
              handleToggleMic();
            }
            setAnimate(false);

            // Unload the audio to free resources
            sound.unloadAsync();

            // Check for the next item in the queue
            if (audioQueue.current.length > 0) {
              const nextAudio = audioQueue.current.shift();
              if (nextAudio) {
                playQueuedBase64(nextAudio);
              }
            }
          }
        });

        if (micOn.current && doAEC.current) {
          tempMicOn.current = true;
          await handleToggleMic();
        }
        await sound.playAsync();
      } else {
        // Non-web (native) implementation
        const fileName = `audio_${Date.now()}.mp3`; // Use appropriate format
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(filePath, base64Audio, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Load and play the audio
        const { sound } = await Audio.Sound.createAsync({ uri: filePath });

        // Set the volume to 0.5
        await sound.setVolumeAsync(0.5);

        // Play the audio
        if (micOn.current && doAEC.current) {
          tempMicOn.current = true;
          await handleToggleMic();
        }
        await sound.playAsync();

        // Handle playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            isAudioPlaying.current = false;
            if (tempMicOn.current && !micOn.current) {
              tempMicOn.current = false;
              handleToggleMic();
            }
            setAnimate(false);

            // Unload the audio to free resources
            sound.unloadAsync();

            // Check for the next item in the queue
            if (audioQueue.current.length > 0) {
              const nextAudio = audioQueue.current.shift();
              if (nextAudio) {
                playQueuedBase64(nextAudio);
              }
            }
          }
        });
      }
    } catch (error) {
      isAudioPlaying.current = false;
      console.error("Error playing audio:", error);
      if (tempMicOn.current && !micOn.current) {
        tempMicOn.current = false;
        handleToggleMic();
      }
      setAnimate(false);
    }
  };

  /* ------------------------------------------------------------------
     TOGGLE MIC / CAMERA
     ------------------------------------------------------------------ */
  const handleToggleMic = async () => {
    if (!Object.keys(sourceParameters.current).length) {
      return;
    }
    await toggleAudio({ sourceParameters: sourceParameters.current });
  };

  const handleToggleCamera = async () => {
    if (!Object.keys(sourceParameters.current).length) {
      return;
    }
    await toggleVideo({ sourceParameters: sourceParameters.current });

    // If turning camera on, enumerate devices
    if (!videoOn && videoInputs.length === 0) {
      const devices =
        (await mediaDevices.enumerateDevices()) as MediaDeviceInfo[];
      const cameraList = devices.filter((d) => d.kind === "videoinput");
      setVideoInputs(cameraList);
      if (!isModalOpen) {
        setIsModalOpen(true);
      }
    }
  };

  const handleSwapCamera = async () => {
    if (!Object.keys(sourceParameters.current).length) {
      return;
    }
    await switchCamera({ sourceParameters: sourceParameters.current });
    showToast("Camera switched.", "success");
  };

  const handlePickCamera = async (deviceId: string) => {
    if (!Object.keys(sourceParameters.current).length) {
      return;
    }
    await selectCamera({
      deviceId,
      sourceParameters: sourceParameters.current,
    });
    setSelectedVideoInput(deviceId);
  };

  /* ------------------------------------------------------------------
     PERIODIC REMINDER if user is capturing but mic & video are both off 
     ------------------------------------------------------------------ */
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        isCapturing &&
        !micOn.current &&
        !videoOn &&
        !isAudioPlaying.current
      ) {
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
    }, 15000);

    return () => clearInterval(interval);
  }, [videoOn, isCapturing]);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>MediaSFU AI Agent</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                roomConnected.current
                  ? styles.dotConnected
                  : styles.dotDisconnected,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                roomConnected.current ? styles.textActive : styles.textInactive,
              ]}
            >
              {roomConnected.current ? "active" : "inactive"}
            </Text>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT SCROLL */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: "auto" },
        ]}
        style={styles.scrollView}
      >
        <View
          style={[
            styles.columnsContainer,
            { flexDirection: isSmallScreen ? "column" : "row" },
          ]}
        >
          {/* LEFT COLUMN => Transcript */}
          <View style={styles.leftColumn}>
            <View style={styles.audioCard}>
              <Text style={styles.cardHeading}>Transcript</Text>
              <ScrollView style={styles.transcriptBox}>
                <Text style={styles.transcriptText}>
                  {transcript || "No speech detected."}
                </Text>
              </ScrollView>
            </View>
            <Toast position="top" />
          </View>

          {/* RIGHT COLUMN => Chat + Audio Visualizer */}
          <View style={styles.rightColumn}>
            {showChat && (
              <View style={styles.chatCard}>
                <Text style={styles.chatHeading}>Chat</Text>
                <ScrollView
                  style={styles.chatBox}
                  ref={scrollViewRef}
                  onContentSizeChange={(w, h) => {
                    // auto-scroll to bottom
                    if (h > 200) {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }
                  }}
                >
                  {chatMessages.map((msg, index) => {
                    let messageType = "system";
                    if (msg.sender === "You") {
                      messageType = "user";
                    } else if (msg.sender === "Agent") {
                      messageType = "agent";
                    }

                    return (
                      <View
                        key={index}
                        style={[styles.chatMessage, styles[messageType]]}
                      >
                        <Text
                          style={[
                            styles.chatSender,
                            styles[`${messageType}Text`],
                          ]}
                        >
                          {msg.sender}:
                        </Text>
                        <Text
                          style={[
                            styles.chatText,
                            styles[`${messageType}Text`],
                          ]}
                        >
                          {msg.message}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <AudioVisualizer animate={animate} />
          </View>
        </View>

        {/* SELF VIEW MODAL */}
        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoStream={localStream.current!}
          audioLevel={audioLevel.current}
          hasVideoFeed={videoOn}
        />

        {/* Only render MediaSFUHandler once showRoom is true */}
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
      </ScrollView>

      {/* BOTTOM BAR CONTROLS */}
      <View style={styles.bottomBar}>
        {/* Mic Button */}
        <TouchableOpacity
          onPress={handleToggleMic}
          disabled={isAudioPlaying.current}
          style={[
            styles.iconButton,
            micOn.current ? styles.activeButton : styles.inactiveButton,
          ]}
          accessibilityLabel={
            micOn.current ? "Turn microphone off" : "Turn microphone on"
          }
          accessibilityRole="button"
        >
          <Icon
            name={micOn.current ? "microphone" : "microphone-slash"}
            size={16}
            color={micOn.current ? "#28a745" : "#6c757d"}
          />
        </TouchableOpacity>

        {/* Camera Button */}
        <TouchableOpacity
          onPress={handleToggleCamera}
          style={[
            styles.iconButton,
            videoOn ? styles.activeButton : styles.inactiveButton,
          ]}
          accessibilityLabel={videoOn ? "Turn video off" : "Turn video on"}
          accessibilityRole="button"
        >
          <Icon
            name={videoOn ? "video" : "video-slash"}
            size={16}
            color={videoOn ? "#28a745" : "#6c757d"}
          />
        </TouchableOpacity>

        {/* Swap Camera */}
        {videoOn && (
          <TouchableOpacity
            style={styles.toggleCamBtn}
            onPress={handleSwapCamera}
            accessibilityLabel="Switch camera"
            accessibilityRole="button"
          >
            <Icon name="sync-alt" size={18} color="#6c757d" />
            <Text style={styles.toggleCamText}> Cam</Text>
          </TouchableOpacity>
        )}

        {/* Camera Dropdown */}
        {!isSmallScreen && videoOn && videoInputs.length > 1 && (
          <View style={styles.camControls}>
            <Icon name="camera" size={16} color="#6c757d" />
            <DropDownPicker
              open={showDropdown}
              value={selectedVideoInput}
              items={videoInputs.map((input) => ({
                label: input.label || "Camera",
                value: input.deviceId,
              }))}
              setOpen={() => setShowDropdown((prev) => !prev)}
              setValue={(callback) => {
                const newValue = callback(selectedVideoInput);
                handlePickCamera(newValue);
              }}
              setItems={() => {}}
              placeholder="Select Camera"
              dropDownDirection="TOP"
              containerStyle={styles.dropdownContainer}
              style={styles.picker}
              dropDownContainerStyle={styles.dropDownContainer}
              zIndex={1000} // Ensure dropdown appears above other elements
              zIndexInverse={3000}
            />
          </View>
        )}

        {/* Self-View Modal Toggle */}
        <TouchableOpacity
          onPress={() => setIsModalOpen((prev) => !prev)}
          style={styles.iconButton}
          accessibilityLabel="Toggle Self Video"
          accessibilityRole="button"
        >
          <Icon
            name={isModalOpen ? "eye-slash" : "eye"}
            size={16}
            color="#6c757d"
          />
        </TouchableOpacity>

        {/* Toggle Chat */}
        <TouchableOpacity
          onPress={() => setShowChat((prev) => !prev)}
          style={styles.iconButton}
          accessibilityLabel="Toggle Chat"
          accessibilityRole="button"
        >
          <Icon
            name={!showChat ? "comments" : "comment-slash"}
            size={16}
            color="#6c757d"
          />
        </TouchableOpacity>

        {/* Do Acoustic Echo Cancellation */}
        <TouchableOpacity
          onPress={() => {
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
          style={styles.iconButton}
          accessibilityLabel="Toggle AEC"
          accessibilityRole="button"
        >
          <Icon
            name={doAEC.current ? "deaf" : "assistive-listening-systems"}
            size={16}
            color={doAEC.current ? "#28a745" : "#6c757d"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default App;

/* ------------------------------------------------------------------
   STYLES
   ------------------------------------------------------------------ */
const styles: { [key: string]: any } = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 10,
    paddingBottom: 0, // space for bottom bar
  },

  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fdfdfd",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
  },
  headerLeft: {
    flexGrow: 1,
  },
  headerTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: "600",
    color: "#007bff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Status
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 6,
  },
  dotConnected: {
    backgroundColor: "#2ecc71",
  },
  dotDisconnected: {
    backgroundColor: "#e74c3c",
  },
  statusText: {
    fontSize: 14,
  },
  textActive: {
    color: "#2ecc71",
  },
  textInactive: {
    color: "#e74c3c",
  },

  // Columns
  columnsContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  leftColumn: {
    flex: 1,
    marginRight: 0,
  },
  rightColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  // Audio card & transcript
  audioCard: {
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
    marginBottom: 8,
  },
  transcriptBox: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    maxHeight: 200,
    minHeight: 120,
    padding: 10,
  },

  // Chat
  chatBox: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    backgroundColor: "#fff",
    height: 200, // fixed height
    padding: 10,
  },

  // Shared chat message style
  chatMessage: {
    marginBottom: 5,
    padding: 8,
    borderRadius: 8,
    maxWidth: "80%",
  },
  chatSender: {
    fontWeight: "bold",
  },
  chatText: {
    flexShrink: 1,
  },

  // Color-coded roles
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#ACBFD5FF",
  },
  userText: {
    color: "#ffffff",
  },

  agent: {
    alignSelf: "flex-start",
    backgroundColor: "#6c757d",
  },
  agentText: {
    color: "#ffffff",
  },

  system: {
    alignSelf: "flex-start",
    backgroundColor: "#D9D8D8FF",
    opacity: 0.95,
  },
  systemText: {
    color: "#333333",
  },

  transcriptText: {
    color: "#222",
    fontSize: 14,
    lineHeight: 20,
  },

  // Chat card
  chatCard: {
    width: "100%",
    backgroundColor: "#fdfdfd",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 10,
  },
  chatHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
    marginBottom: 8,
  },

  // Bottom Bar
  bottomBar: {
    height: 60,
    backgroundColor: "#fdfdfd",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fdfdfd",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeButton: {
    borderColor: "#28a745",
  },
  inactiveButton: {
    borderColor: "#6c757d",
  },
  toggleCamBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdfdfd",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleCamText: {
    marginLeft: 5,
    color: "#6c757d",
    fontSize: 14,
  },
  camControls: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  dropdown: {
    height: 40,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    fontSize: 12,
    paddingHorizontal: 2,
    flex: 1,
  },
  dropDownContainer: {
    borderColor: "#ddd",
    backgroundColor: "#fff",
    maxHeight: 150,
    maxWidth: 150,
    borderRadius: 6,
  },
  dropdownContainer: {
    flex: 1,
    maxWidth: 150,
  },

  picker: {
    height: 30,
    minHeight: 30,
    flex: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    fontSize: 12,
    paddingHorizontal: 5,
  },
});
