// ignore_for_file: constant_identifier_names
import 'dart:async';
import 'dart:convert';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:mediasfu_sdk/mediasfu_sdk.dart' hide MediaStream;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'components/agents/audio_visualizer.dart';
import 'components/agents/custom_modal.dart';
import 'components/mediasfu_handler.dart';
import '../services/use_mediasfu_sdk.dart';

/// ------------------------------------------------------------------
/// 1) UPDATED SESSION LOGIC
///    - Large constants: 200000 / 500000
///    - Error strings remain the same
/// ------------------------------------------------------------------
const String SESSION_KEY = 'user_sessions';
const int MAX_HOURLY_SESSIONS = 200000;
const int MAX_DAILY_SESSIONS = 500000;

Future<Map<String, dynamic>> checkSessionLimit() async {
  final now = DateTime.now().millisecondsSinceEpoch;
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  try {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(SESSION_KEY);
    List<int> sessions = data != null ? List<int>.from(jsonDecode(data)) : [];

    // Keep only sessions within the last day
    sessions = sessions.where((ts) => now - ts < oneDay).toList();
    final hourlySessions = sessions.where((ts) => now - ts < oneHour).toList();

    if (hourlySessions.length >= MAX_HOURLY_SESSIONS) {
      return {
        'allowed': false,
        'reason': 'You can only start two sessions per hour.',
      };
    }
    if (sessions.length >= MAX_DAILY_SESSIONS) {
      return {
        'allowed': false,
        'reason': 'You can only start five sessions per day.',
      };
    }
    return {'allowed': true};
  } catch (error) {
    debugPrint('Error checking session limit: $error');
    return {'allowed': false, 'reason': 'Session check failed.'};
  }
}

Future<bool> startNewSession() async {
  final now = DateTime.now().millisecondsSinceEpoch;
  try {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(SESSION_KEY);
    List<int> sessions = data != null ? List<int>.from(jsonDecode(data)) : [];
    sessions.add(now);
    await prefs.setString(SESSION_KEY, jsonEncode(sessions));
    return true;
  } catch (error) {
    debugPrint('Error starting new session: $error');
    return false;
  }
}

/// ------------------------------------------------------------------
/// 2) UPDATED PIPELINE CONFIG
///    - sttNickName, llmNickName, ttsNickName => "yourSTT"/"youryourLLM"/"yourTTS"
///    - fps => 0.5
///    - returnAudioFormat => 'base64'
/// ------------------------------------------------------------------
final Map<String, dynamic> config = {
  'audio': {
    'format': 'wav',
    'channels': 1,
    'sampleRate': 16000,
    'denoise': {
      'enable': true,
      'highpass': 200,
      'lowpass': 3000,
      'detectSilence': true,
      'silenceThreshold': -35,
      'silenceDuration': 0.25,
      'silenceMinDuration': 0.25,
      'pauseOnSilence': true,
    },
    'pipeline': ['stt', 'ttllm', 'tts'],
    'sttNickName': 'yourSTT',
    'llmNickName': 'yourllm',
    'ttsNickName': 'yourTTS',
    'returnAll': true,
    'returnAudioFormat': 'base64',
  },
  'vision': {
    'fps': 1,
    'pipeline': ['visionllm', 'tts'],
    'llmNickName': 'yourllm',
    'ttsNickName': 'yourTTS',
    'returnAll': true,
    'returnAudioFormat': 'base64',
  },
};

/// ----------------------------------------------------------------------
/// Main App
/// ----------------------------------------------------------------------
void main() {
  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: App(),
  ));
}

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

/// If you prefer a small chat model
class _ChatMessage {
  final String sender; // 'Agent', 'You', or 'System'
  final String message;
  _ChatMessage({required this.sender, required this.message});
}

class _AppState extends State<App> {
  // -----------------------------------------------------------------
  // Audio queue logic
  //    - We'll store base64 strings (or raw bytes) in a queue
  //    - Then decode base64 to bytes before playing
  // -----------------------------------------------------------------
  final AudioPlayer _audioPlayer = AudioPlayer();
  final List<String> _audioQueue = [];
  bool _isAudioPlaying = false;

  // Transcript & states
  String _transcript = '';
  bool _isCapturing = false;
  bool _micOn = false;
  bool _tempMicOn = false;
  bool _videoOn = false;
  bool _roomConnected = false;
  bool _isModalOpen = true;
  bool _animate = false; // For AudioVisualizer
  io.Socket? socket;

  double audioLevel = 0;
  MediaStream? _localStream;

  // AEC Toggle
  bool _doAEC = true;

  // Device enumeration
  List<MediaDeviceInfo> _videoInputs = [];
  String? _selectedVideoInput;

  // Room/pipeline references
  String _agentRoom = '';

  // The data you'd receive from mediasfu
  // Or from a hooking mechanism
  final ValueNotifier<MediasfuParameters?> mediasfuParams =
      ValueNotifier<MediasfuParameters?>(null);
  final ValueNotifier<MediaSFUHandlerOptions?> showRoomDetails =
      ValueNotifier<MediaSFUHandlerOptions?>(null);
  final ValueNotifier<bool> mediasfuChanged = ValueNotifier<bool>(false);

  updateMediasfuParams(MediasfuParameters? params) {
    mediasfuParams.value = params;
    mediasfuChanged.value = !mediasfuChanged.value;
  }

  // Chat
  final ScrollController _chatScrollController = ScrollController();
  bool _showChat = true;
  final List<_ChatMessage> _chatMessages = [
    _ChatMessage(sender: 'System', message: 'Welcome to the AI Agent!'),
    _ChatMessage(
      sender: 'System',
      message: 'Please wait while we connect you to the agent room.',
    ),
  ];

  // Periodic reminder
  DateTime _lastMicAlert = DateTime.now();
  Timer? _reminderTimer;

  // Banner messages
  String? _bannerMessage;
  String _bannerType = 'info';

  @override
  void initState() {
    super.initState();

    // Session check
    _initSession();

    // Show the MediaSFUHandler
    showRoomDetails.value = MediaSFUHandlerOptions(
      action: 'create',
      name: 'agent',
      sourceParameters: mediasfuParams.value,
      updateSourceParameters: updateMediasfuParams,
    );

    // Start periodic reminder
    _reminderTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      _checkMicReminder();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Listen for changes
    mediasfuChanged.addListener(() {
      _updateStateParameters(mediasfuParams.value);
    });
  }

  @override
  void dispose() {
    _reminderTimer?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  /// ----------------------------------------------------------------------
  /// 1) Periodic Reminder: if capturing but mic & camera both off
  /// ----------------------------------------------------------------------
  void _checkMicReminder() {
    final now = DateTime.now();
    final sinceLastAlert = now.difference(_lastMicAlert).inMilliseconds;

    if (_isCapturing && !_micOn && !_videoOn && !_isAudioPlaying) {
      if (sinceLastAlert > 30000) {
        _showBanner(
          "Your microphone is off. Click the mic button to start speaking.",
          'info',
        );
        setState(() {
          _chatMessages.add(
            _ChatMessage(
              sender: "Agent",
              message:
                  "I can't hear you. Please unmute your mic or turn on your camera.",
            ),
          );
        });
        _lastMicAlert = now;
      }
    } else {
      // If user turned on mic/cam or we're not capturing, reset
      _lastMicAlert = now;
    }
  }

  /// ----------------------------------------------------------------------
  /// 2) Session check
  /// ----------------------------------------------------------------------
  Future<void> _initSession() async {
    final sessionStatus = await checkSessionLimit();
    if (sessionStatus['allowed'] == true) {
      final started = await startNewSession();
      if (!started) {
        _showBanner('Failed to initialize session.', 'error');
      }
    } else {
      _showBanner(sessionStatus['reason'], 'error');
    }
  }

  /// ----------------------------------------------------------------------
  /// 3) React to changes from MediaSFU
  /// ----------------------------------------------------------------------
  void _updateStateParameters(MediasfuParameters? params) {
    if (!mounted) return;
    if (params == null ||
        params.roomName.isEmpty ||
        params.roomName == 'none') {
      return;
    }

    if (_videoOn != params.videoAlreadyOn) {
      setState(() => _videoOn = params.videoAlreadyOn);
    }

    if (_micOn != params.audioAlreadyOn) {
      setState(() => _micOn = params.audioAlreadyOn);
    }

    // audioLevel
    if (params.audioLevel != null && params.audioLevel != audioLevel) {
      setState(() => audioLevel = params.audioLevel!);
    }

    // localStream
    if (params.localStreamVideo != _localStream) {
      setState(() => _localStream = params.localStreamVideo);
    }

    // socket
    if (params.localSocket != null &&
        params.localSocket!.id?.isNotEmpty == true) {
      socket = params.localSocket;
    } else if (params.socket != null) {
      socket = params.socket;
    }

    // If newly connected
    if (params.socket?.id?.isNotEmpty == true && !_roomConnected) {
      setState(() => _roomConnected = true);
      _showBanner('Connected to the agent room!', 'success');

      // Add a quick "Agent" greet
      setState(() {
        _chatMessages.add(
          _ChatMessage(
              sender: "System", message: "Connected to the agent room."),
        );
        _chatMessages.add(
          _ChatMessage(
              sender: "Agent", message: "Hello! How can I help you today?"),
        );
        _chatMessages.add(
          _ChatMessage(sender: "System", message: "Please start speaking."),
        );
      });

      if (!params.audioAlreadyOn) {
        _showBanner(
          'You are currently muted. Please unmute to speak. You can alternatively turn on your camera to communicate.',
          'info',
        );
        _chatMessages.add(
          _ChatMessage(
            sender: 'System',
            message:
                'You are currently muted. Please unmute to speak. You can alternatively turn on your camera to communicate.',
          ),
        );
      }

      // Room
      if (_agentRoom != params.roomName &&
          params.roomName.isNotEmpty &&
          params.roomName != 'none') {
        setState(() => _agentRoom = params.roomName);
        if (!_isCapturing) {
          Future.delayed(const Duration(milliseconds: 500), () {
            _startCapture();
          });
        }
      }

      // default camera
      if (params.userDefaultVideoInputDevice.isNotEmpty &&
          params.userDefaultVideoInputDevice != _selectedVideoInput) {
        setState(
            () => _selectedVideoInput = params.userDefaultVideoInputDevice);
      }

      // Example events
      socket?.on('image', (data) {
        // Handle image data
      });
      socket?.on('audio', (data) {
        // Handle audio data
      });
      socket?.on('silenceDetected', (data) {
        // Handle silence detection
      });
      socket?.on('pipelineResult', (data) {
        if (data['transcript'] != null && data['transcript'].isNotEmpty) {
          setState(() => _transcript = data['transcript']);
        }
        if (data['audio'] != null && data['audio'].isNotEmpty) {
          playQueuedBase64(data['audio']);
        }
        if (data['text'] != null && data['text'].isNotEmpty) {
          setState(() {
            _chatMessages.add(
              _ChatMessage(sender: "Agent", message: data['text']),
            );
          });
          Future.delayed(const Duration(milliseconds: 100), () {
            _chatScrollController.animateTo(
              _chatScrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          });
        }
      });
      socket?.on('pipelineResultVision', (data) {
        if (data['audio'] != null && data['audio'].isNotEmpty) {
          playQueuedBase64(data['audio']);
        }
        if (data['text'] != null && data['text'].isNotEmpty) {
          setState(() {
            _chatMessages.add(
              _ChatMessage(sender: "Agent", message: data['text']),
            );
          });
          Future.delayed(const Duration(milliseconds: 100), () {
            _chatScrollController.animateTo(
              _chatScrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          });
        }
      });
      socket?.on('pipelineError', (data) {
        _showBanner('Voice pipeline error: ${data['error']}', 'error');
      });
      socket?.on('pipelineErrorVision', (data) {
        _showBanner('Vision pipeline error: ${data['error']}', 'error');
      });
      socket?.on('disconnect', (_) {
        _showBanner('Disconnected from the agent room.', 'error');
        setState(() => _roomConnected = false);
        socket?.disconnect();
      });
    }

    // alertMessage => banner
    if (params.alertMessage.isNotEmpty &&
        params.alertMessage != _bannerMessage) {
      _showBanner(params.alertMessage, 'info');
    }
  }

  /// ----------------------------------------------------------------------
  /// 4) Start capturing data => "startDataBuffer" with pipeline config
  /// ----------------------------------------------------------------------
  void _startCapture() {
    if (!_roomConnected) {
      _showBanner('Cannot capture until room is connected.', 'error');
      return;
    }

    if (_isCapturing) return;

    socket?.emitWithAck(
        'startDataBuffer', {'roomName': _agentRoom, 'config': config},
        ack: (res) {
      if (res != null && res['success'] == true) {
        setState(() => _isCapturing = true);
        _showBanner('Session capture started.', 'success');

        // If server also emits "startBuffers"
        socket?.on('startBuffers', (_) {
          socket?.emitWithAck(
              'startBuffer', {'roomName': _agentRoom, 'member': 'agent'},
              ack: (res) {
            if (res != null && res['success'] == true) {
              _showBanner('Buffer started.', 'success');
            } else {
              _showBanner('Failed to start buffer.', 'error');
            }
          });
        });
      } else {
        debugPrint('Failed to start session: $res');
        final reason = (res != null && res['reason'] != null)
            ? res['reason']
            : 'Check your connection and try again.';
        _showBanner('Failed to start session. $reason', 'error');
      }
    });
  }

  /// ----------------------------------------------------------------------
  /// PLAY BASE64 AUDIO
  /// ----------------------------------------------------------------------
  Future<void> playQueuedBase64(String base64Audio) async {
    if (_isAudioPlaying) {
      _audioQueue.add(base64Audio);
      return;
    }
    setState(() {
      _isAudioPlaying = true;
      _animate = true;
    });

    if (_micOn && _doAEC) {
      setState(() => _tempMicOn = true);
      await _handleToggleMic();
    }

    try {
      final bytes = base64Decode(base64Audio);
      await _audioPlayer.play(BytesSource(bytes));
      _audioPlayer.onPlayerComplete.listen((_) {
        setState(() {
          _isAudioPlaying = false;
          _animate = false;
        });
        if (_tempMicOn && !_micOn) {
          setState(() => _tempMicOn = false);
          _handleToggleMic();
        }
        if (_audioQueue.isNotEmpty) {
          final nextAudio = _audioQueue.removeAt(0);
          playQueuedBase64(nextAudio);
        }
      });
    } catch (e) {
      debugPrint("Error playing base64 audio: $e");
      setState(() {
        _isAudioPlaying = false;
        _animate = false;
      });
      if (_tempMicOn && !_micOn) {
        setState(() => _tempMicOn = false);
        _handleToggleMic();
      }
    }
  }

  /// ----------------------------------------------------------------------
  /// 5) Toggle mic / camera
  ///    Call your "toggleAudio/video" from mediasfu
  /// ----------------------------------------------------------------------
  Future<void> _handleToggleMic() async {
    await toggleAudio(sourceParameters: mediasfuParams.value);
  }

  Future<void> _handleToggleCamera() async {
    await toggleVideo(sourceParameters: mediasfuParams.value);
    // If turning on camera, enumerate devices
    if (!_videoOn && _videoInputs.isEmpty) {
      _enumerateDevices();
      if (!_isModalOpen) {
        setState(() => _isModalOpen = true);
      }
    }
  }

  Future<void> _handleSwapCamera() async {
    await switchCamera(sourceParameters: mediasfuParams.value);
  }

  Future<void> _handlePickCamera(String deviceId) async {
    await selectCamera(
        sourceParameters: mediasfuParams.value, deviceId: deviceId);
    setState(() => _selectedVideoInput = deviceId);
  }

  /// Enumerate camera devices
  Future<void> _enumerateDevices() async {
    final devices = await navigator.mediaDevices.enumerateDevices();
    final cameras = devices.where((d) => d.kind == 'videoinput').toList();
    setState(() {
      _videoInputs = cameras;
      if (cameras.isNotEmpty && _selectedVideoInput == null) {
        _selectedVideoInput = cameras.first.deviceId;
      }
    });
  }

  /// ----------------------------------------------------------------------
  /// BANNER
  /// ----------------------------------------------------------------------
  void _showBanner(String msg, String type) {
    setState(() {
      _bannerMessage = msg;
      _bannerType = type;
    });
    Timer(const Duration(seconds: 5), () {
      if (!mounted) return;
      setState(() => _bannerMessage = null);
    });
  }

  /// ----------------------------------------------------------------------
  /// UI BUILD
  /// ----------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // Header
                _buildHeader(),

                // Banner
                if (_bannerMessage != null)
                  _MessageBanner(message: _bannerMessage!, type: _bannerType),

                // Main Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      children: [
                        // Show the MediaSFUHandler
                        ValueListenableBuilder<MediaSFUHandlerOptions?>(
                          valueListenable: showRoomDetails,
                          builder: (context, options, child) {
                            if (options == null) return const SizedBox.shrink();
                            return MediaSFUHandler(options: options);
                          },
                        ),
                        const SizedBox(height: 20),
                        _buildMainColumns(),
                      ],
                    ),
                  ),
                ),

                // Bottom bar
                _buildBottomBar(),
              ],
            ),

            // Self-view modal
            CustomModal(
              isOpen: _isModalOpen,
              onClose: () => setState(() => _isModalOpen = false),
              videoStream: _localStream,
              audioLevel: audioLevel,
              hasVideoFeed: _videoOn,
            ),
          ],
        ),
      ),
    );
  }

  /// HEADER
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFDFDFD),
        border: const Border(bottom: BorderSide(color: Color(0xFFE0E0E0))),
        boxShadow: [
          BoxShadow(
            color: Colors.black12.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'MediaSFU AI Agent',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF007BFF),
              ),
            ),
          ),
          // Status Indicator
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: _roomConnected ? Colors.green : Colors.red,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                _roomConnected ? 'active' : 'inactive',
                style: TextStyle(
                  fontSize: 14,
                  color: _roomConnected ? Colors.green : Colors.red,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// MAIN COLUMNS
  Widget _buildMainColumns() {
    final width = MediaQuery.of(context).size.width;
    final isSmallScreen = width < 600;

    if (isSmallScreen) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTranscriptCard(),
          const SizedBox(height: 10),
          if (_showChat) _buildChatCard(),
          const SizedBox(height: 10),
          AudioVisualizer(animate: _animate),
        ],
      );
    } else {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _buildTranscriptCard()),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              children: [
                if (_showChat) _buildChatCard(),
                const SizedBox(height: 10),
                AudioVisualizer(animate: _animate),
              ],
            ),
          ),
        ],
      );
    }
  }

  /// TRANSCRIPT CARD
  Widget _buildTranscriptCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFDFDFD),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            'Transcript',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF007BFF),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE0E0E0)),
            ),
            padding: const EdgeInsets.all(10),
            child: SingleChildScrollView(
              child: Text(
                _transcript.isNotEmpty ? _transcript : 'No speech detected.',
                style: const TextStyle(
                  color: Color(0xFF222222),
                  fontSize: 14,
                  height: 1.4,
                  fontFamily: 'Courier',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// CHAT CARD
  Widget _buildChatCard() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFDFDFD),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      padding: const EdgeInsets.all(15),
      child: Column(
        children: [
          const Text(
            'Chat',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF007BFF),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE0E0E0)),
            ),
            child: ListView.builder(
              controller: _chatScrollController,
              itemCount: _chatMessages.length,
              itemBuilder: (context, index) {
                final msg = _chatMessages[index];
                return _buildChatBubble(msg);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatBubble(_ChatMessage msg) {
    // Example color-coding
    final sender = msg.sender.toLowerCase();
    Color bgColor;
    Color textColor;
    CrossAxisAlignment align;

    if (sender == 'agent') {
      bgColor = const Color(0xFF6C757D);
      textColor = Colors.white;
      align = CrossAxisAlignment.start;
    } else if (sender == 'you') {
      bgColor = const Color(0xFFACBFD5);
      textColor = Colors.white;
      align = CrossAxisAlignment.end;
    } else {
      // "system"
      bgColor = const Color(0xFFD9D8D8);
      textColor = Colors.black87;
      align = CrossAxisAlignment.start;
    }

    return Column(
      crossAxisAlignment: align,
      children: [
        Container(
          margin: const EdgeInsets.all(5),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '${msg.sender}: ${msg.message}',
            style: TextStyle(color: textColor),
          ),
        ),
      ],
    );
  }

  /// BOTTOM BAR
  Widget _buildBottomBar() {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: const Color(0xFFFDFDFD),
        border: const Border(top: BorderSide(color: Color(0xFFE0E0E0))),
        boxShadow: [
          BoxShadow(
            color: Colors.black12.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // Mic
          InkWell(
            onTap: _isAudioPlaying ? null : _handleToggleMic,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFFDFDFD),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _micOn ? Colors.green : const Color(0xFF6C757D),
                ),
              ),
              child: Icon(
                _micOn
                    ? FontAwesomeIcons.microphone
                    : FontAwesomeIcons.microphoneSlash,
                color:
                    _micOn ? const Color(0xFF28A745) : const Color(0xFF6C757D),
                size: 16,
              ),
            ),
          ),

          // Camera
          InkWell(
            onTap: _handleToggleCamera,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFFDFDFD),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _videoOn ? Colors.green : const Color(0xFF6C757D),
                ),
              ),
              child: Icon(
                _videoOn ? FontAwesomeIcons.video : FontAwesomeIcons.videoSlash,
                color: _videoOn
                    ? const Color(0xFF28A745)
                    : const Color(0xFF6C757D),
                size: 16,
              ),
            ),
          ),

          // Swap Cam
          if (_videoOn)
            InkWell(
              onTap: _handleSwapCamera,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDFDFD),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: const Color(0xFFE0E0E0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      offset: const Offset(0, 2),
                      blurRadius: 2,
                    ),
                  ],
                ),
                child: const Row(
                  children: [
                    Icon(FontAwesomeIcons.rotate,
                        size: 14, color: Color(0xFF6C757D)),
                    SizedBox(width: 5),
                    Text(
                      'Cam',
                      style: TextStyle(color: Color(0xFF6C757D), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),

          // Camera Dropdown
          if (_videoOn && _videoInputs.length > 1)
            Row(
              children: [
                const Icon(FontAwesomeIcons.camera,
                    size: 14, color: Color(0xFF6C757D)),
                const SizedBox(width: 5),
                Container(
                  width: 130,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: const Color(0xFFdddddd)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedVideoInput,
                      items: _videoInputs.map((input) {
                        return DropdownMenuItem<String>(
                          value: input.deviceId,
                          child: Text(
                            input.label.isNotEmpty ? input.label : 'Camera',
                            style: const TextStyle(fontSize: 12),
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          _handlePickCamera(value);
                        }
                      },
                      hint: const Text('Select Camera',
                          style: TextStyle(fontSize: 12)),
                      isExpanded: true,
                    ),
                  ),
                ),
              ],
            ),

          // Self-View Modal Toggle
          InkWell(
            onTap: () => setState(() => _isModalOpen = !_isModalOpen),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFFDFDFD),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE0E0E0)),
              ),
              child: Icon(
                _isModalOpen ? FontAwesomeIcons.eyeSlash : FontAwesomeIcons.eye,
                color: const Color(0xFF6C757D),
                size: 16,
              ),
            ),
          ),

          // Toggle Chat
          InkWell(
            onTap: () => setState(() => _showChat = !_showChat),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFFDFDFD),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE0E0E0)),
              ),
              child: Icon(
                _showChat
                    ? FontAwesomeIcons.commentSlash
                    : FontAwesomeIcons.comments,
                color: const Color(0xFF6C757D),
                size: 16,
              ),
            ),
          ),

          // Do AEC
          InkWell(
            onTap: () {
              setState(() => _doAEC = !_doAEC);
              _showBanner(
                _doAEC
                    ? "AEC enabled; if you have echo issues on loudspeaker."
                    : "AEC disabled; better performance but possible echo.",
                'info',
              );
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFFDFDFD),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE0E0E0)),
              ),
              child: Icon(
                _doAEC ? FontAwesomeIcons.earDeaf : FontAwesomeIcons.earListen,
                color:
                    _doAEC ? const Color(0xFF28A745) : const Color(0xFF6C757D),
                size: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A minimal in-app banner
class _MessageBanner extends StatelessWidget {
  final String message;
  final String type; // 'error', 'success', 'info'

  const _MessageBanner({required this.message, required this.type});

  Color _getColor() {
    switch (type) {
      case 'error':
        return Colors.red;
      case 'success':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  IconData _getIcon() {
    switch (type) {
      case 'error':
        return Icons.error;
      case 'success':
        return Icons.check_circle;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _getColor(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Icon(_getIcon(), color: Colors.white),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
