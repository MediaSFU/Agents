# MediaSFU Demo Agents APP (Flutter)

This Flutter starter application demonstrates how to integrate and use the **MediaSFU** packages within an Flutter project to create Voice and Vision Agents. The app is designed to be a starting point for developers to build upon and customize based on their requirements. It includes the necessary components and services to interact with the MediaSFU API and create or join rooms for voice and video communication.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Install Dependencies](#install-dependencies)
  - [Run the Application](#run-the-application)
- [MediaSFU Agents Guide](https://mediasfu.com/agents)
- [Notes](#notes)
  - [Acoustic Echo Cancellation (AEC)](#acoustic-echo-cancellation-aec)
- [Example Modification](#example-modification)
- [Troubleshooting](#troubleshooting)
- [Learn More](#learn-more)

## Prerequisites

Before you begin, ensure you have the following installed and set up:

- **[Flutter SDK](https://flutter.dev/docs/get-started/install)** (version 2.0 or later)
- **[Dart SDK](https://dart.dev/get-dart)** (comes with Flutter)
- **[Android Studio](https://developer.android.com/studio)** or **[Xcode](https://developer.apple.com/xcode/)** (for iOS development)
- **[VS Code](https://code.visualstudio.com/)** or **[Android Studio](https://developer.android.com/studio)** (recommended IDEs)

## Getting Started

### Clone the Repository

If you haven't cloned the main repository yet, do so now:

```bash
git clone https://github.com/MediaSFU/Agents.git
cd Agents/mediasfu_flutter
```

### Install Dependencies

Fetch the required packages using Flutter's package manager:

```bash
flutter pub get
```

### Run the Application

#### On an Emulator or Physical Device

1. **Start an Emulator**: Launch an Android emulator or connect a physical device.
2. **Run the App**:

   ```bash
   flutter run
   ```

   To reduce logs during testing, you can use:

   ```bash
   flutter run | sed '/^.\// { /^\(V\|I\|W\|E\)\/flutter/!d }'
   ```

   This will build and install the app on the selected device.

#### On Web (Optional)

Flutter also supports web deployment. To run the app on a web browser (example: edge browser):

```bash
flutter run -d edge
```

The application should now be running on your selected device or emulator.

## [MediaSFU Agents Guide](https://mediasfu.com/agents)

The MediaSFU Agents Guide provides detailed information on how to use the MediaSFU packages to create Voice and Vision Agents. It includes instructions on how to set up and configure the agents, as well as how to interact with the MediaSFU API to create or join rooms for voice and video communication.

## Notes

By default, the app auto-connects and runs on startup. You might want to edit the 'main.dart' file to conditionally render it:

```dart
 ValueListenableBuilder<MediaSFUHandlerOptions?>(
                          valueListenable: showRoomDetails,
                          builder: (context, options, child) {
                            if (options == null) return const SizedBox.shrink();
                            return MediaSFUHandler(options: options);
                          },
                        ),
  ```

### Acoustic Echo Cancellation (AEC)

By default, Acoustic Echo Cancellation (AEC) is enabled. This is achieved by disabling the mic during sound playback from the server and reopening it afterward. This might introduce some marginal latencies. You could consider turning this off if the user is on a headset or using some noise cancellation approach.

The parameter to look for is `doAEC`.

In `mediasfu_handler.dart`, AEC is enabled by default using the `_doAEC` variable:

```dart
  bool _doAEC = true;
```

To toggle AEC, use the following code snippet, which updates the state and shows a notification:

```dart
  onTap: () {
    setState(() => _doAEC = !_doAEC);
    _showBanner(
      _doAEC
          ? "AEC enabled; if you have echo issues on loudspeaker."
          : "AEC disabled; better performance but possible echo.",
      'info',
    );
  }
```

## Example Modification

This starter app demonstrates how to integrate **MediaSFU** packages within a Flutter environment. Follow the steps below to customize the app based on your specific development needs.

### 1. Primary and Secondary Files of Interest

In the standard Flutter project structure, the main files of interest for configuring MediaSFU are:

- **Primary File**: `./lib/main.dart`
- **Secondary File**: `./lib/mediasfu_handler.dart`

In `main.dart`, you can customize the app to render various views or enable specific modes for your integration with MediaSFU.

- Update AI Agent credentials.
- Customize rendering options and UI.
- Configure state management or navigation.

```dart
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
```

In `mediasfu_handler.dart`, you can configure the app to handle MediaSFU actions such as creating or joining rooms. This file is also where Acoustic Echo Cancellation (AEC) is toggled.

### 2. Update Credentials

To connect the application directly with MediaSFU, locate the following line in `main.dart`:

```dart
    Credentials credentials = Credentials(
          apiUserName: 'yourDevUser',
          apiKey:
              'yourDevApiKey1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
```

Replace `'yourDevUser'` and `'yourDevApiKey1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'` with your actual credentials. This allows the app to make requests to MediaSFU for creating or joining rooms, enabling seamless authenticated access.

Note: `recordOnly` can be set to `true` to indicate one-way traffic (no consumption endpoints); however, a current bug prevents agents' usage if using MediaSFU Cloud alone with no community edition. They need to keep it as `false` (or leave out); defaults to `false`.

## Troubleshooting

- **Flutter SDK Issues**

  Ensure that the Flutter SDK is correctly installed and added to your system's `PATH`. Verify by running:

  ```bash
  flutter doctor
  ```

  Address any issues highlighted by the `flutter doctor` command.

- **Dependency Conflicts**

  If you encounter dependency conflicts, try running:

  ```bash
  flutter pub upgrade
  ```

- **Build Failures**

  Clean the build cache and rebuild:

  ```bash
  flutter clean
  flutter pub get
  flutter run
  ```

- **iOS Build Issues**

  Ensure that you have the latest Xcode installed and that you have accepted the Xcode license agreements:

  ```bash
  sudo xcodebuild -license
  ```

- **Android Build Issues**

  Ensure that your Android SDK is up to date and that the `ANDROID_HOME` environment variable is set correctly.

## Learn More

- **[Flutter Documentation](https://flutter.dev/docs)**
- **[Dart Documentation](https://dart.dev/guides)**
- **[MediaSFU Documentation](https://www.mediasfu.com/documentation/)**
- **[Flutter Packages](https://pub.dev/)**
- **[Flutter Theming](https://flutter.dev/docs/cookbook/design/themes)**

---

*Happy Coding with Flutter and MediaSFU! 🚀📱*
