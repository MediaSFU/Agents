# MediaSFU Demo Agents APP (React Native)

This React Native starter application demonstrates how to integrate and use the **MediaSFU** packages within an React Native project to create Voice and Vision Agents. The app is designed to be a starting point for developers to build upon and customize based on their requirements. It includes the necessary components and services to interact with the MediaSFU API and create or join rooms for voice and video communication.


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
  - [Primary File](#1-primary-file-of-interest)
  - [Secondary File](#2-secondary-file-of-interest)
- [Troubleshooting](#troubleshooting)
- [Learn More](#learn-more)

## Prerequisites

Before you begin, ensure you have the following installed and set up:

- **[Node.js](https://nodejs.org/)** (v14 or later)
- **[npm](https://www.npmjs.com/)** (comes with Node.js) or **[Yarn](https://yarnpkg.com/)**
- **[React Native CLI](https://reactnative.dev/docs/environment-setup)** (for React Native development)
- **[Xcode](https://developer.apple.com/xcode/)** (for iOS development, macOS only)
- **[Android Studio](https://developer.android.com/studio)** (for Android development)
- **[VS Code](https://code.visualstudio.com/)** or **[Atom](https://atom.io/)** (recommended IDEs)

## Getting Started

### Clone the Repository

If you haven't cloned the main repository yet, do so now:

```bash
git clone https://github.com/MediaSFU/Agents.git
cd Agents/mediasfu_react_native
```

> **Note**: React Native may encounter issues when building from long path names. To avoid potential errors, copy the `mediasfu_react_native` folder to a shorter directory (e.g., `C:/Projects/mediasfu_react_native` on Windows) before proceeding.

### Install Dependencies

Using **npm**:

```bash
npm install
```

Or using **Yarn**:

```bash
yarn install
```

### Run the Application

#### For iOS

Ensure you have Xcode installed. Then, run:

```bash
npx react-native run-ios
```

#### For Android

Ensure you have an Android emulator running or a device connected. Then, run:

```bash
npx react-native run-android
```

The application should now be running on your selected device or emulator.

## [MediaSFU Agents Guide](https://mediasfu.com/agents)

The MediaSFU Agents Guide provides detailed information on how to use the MediaSFU packages to create Voice and Vision Agents. It includes instructions on setting up and configuring agents, as well as interacting with the MediaSFU API to create or join rooms for voice and video communication.

## Notes

By default, the app auto-connects and runs on startup. You might want to edit the `App.tsx` file to conditionally render it:

```tsx
{showRoomDetails && (
  <MediaSFUHandler options={showRoomDetails} />
)}
```

### Acoustic Echo Cancellation (AEC)

By default, Acoustic Echo Cancellation (AEC) is enabled. This is achieved by disabling the mic during sound playback from the server and reopening it afterward. This might introduce some marginal latencies. You can consider turning this off if the user is on a headset or using some noise cancellation approach.

The parameter to look for is `doAEC`. Set it to `false` to disable AEC.

```tsx
const doAEC = useRef(true);

<TouchableOpacity
  onPress={() => {
    doAEC.current = !doAEC.current;
    showToast(
      `AEC ${
        doAEC.current
          ? 'enabled; useful for echo issues on loudspeaker. Some performance issues may occur.'
          : 'disabled; better performance but possible echo.'
      }`,
      'info',
    );
  }}
  style={styles.iconButton}
  accessibilityLabel="Toggle AEC"
  accessibilityRole="button">
  <Icon
    name={doAEC.current ? 'deaf' : 'assistive-listening-systems'}
    size={16}
    color={doAEC.current ? '#28a745' : '#6c757d'}
  />
</TouchableOpacity>
```

## Example Modification

This starter app demonstrates how to integrate **MediaSFU** packages within a React Native environment. Follow the steps below to customize the app:

### 1. Primary File of Interest

The primary file you'll be working with is `App.tsx`, located in the root of the project directory. In `App.tsx`, you can:

- Update AI Agent credentials.
- Customize rendering options and UI.
- Configure state management or navigation.

#### Update Credentials

Locate the config line in `App.tsx`:

```tsx
const config = {
  audio: {
    format: 'wav',
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
    pipeline: ['stt', 'ttllm', 'tts'],
    sttNickName: 'yourSTT',
    llmNickName: 'yourllm',
    ttsNickName: 'yourtts',
    returnAll: true,
    returnAudioFormat: 'base64',
  },
  vision: {
    fps: 1,
    pipeline: ['visionllm', 'tts'],
    llmNickName: 'yourLLM',
    ttsNickName: 'yourTTS',
    returnAll: true,
    returnAudioFormat: 'base64',
  },
};
```

#### Rendering Options

You can configure your agents credentials directly in the `App.tsx` file.

### 2. Secondary File of Interest

The secondary file is `MediaSFUHandler`, located in the `components` folder. This component is responsible for handling MediaSFU interactions such as creating or joining rooms. Update the credentials in `MediaSFUHandler` as follows:

```tsx
const apiUserName = 'yourDevUser';
const apiKey = 'yourDevApiKey1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const credentials = useRef<Credentials | undefined>({ apiUserName, apiKey });
```

Ensure you replace the `apiUserName` and `apiKey` with your actual values. These credentials allow seamless communication with the MediaSFU API.

---

## Troubleshooting

- **Port Already in Use**

  If port `8081` (default React Native port) is already in use, you can specify a different port by modifying the command (e.g., use port 8008):

  ```bash
  npx react-native start --reset-cache --port 8008
  ```

- **Dependency Issues**

  If you encounter issues during installation, try deleting `node_modules` and reinstalling:

  ```bash
  rm -rf node_modules
  npm install
  ```

  Or with Yarn:

  ```bash
  rm -rf node_modules
  yarn install
  ```

- **iOS Build Issues**

  Ensure that you have the latest Xcode installed and that you have accepted the Xcode license agreements:

  ```bash
  sudo xcodebuild -license
  ```

- **Android Build Issues**

  Ensure that your Android SDK is up to date and that the `ANDROID_HOME` environment variable is set correctly.


- **Clear Android Studio Cache**
  - Open Android Studio.
  - Go to **File** > **Invalidate Caches / Restart**.
  - Select **Invalidate and Restart** to clear cached files and restart Android Studio.
- **Metro Bundler Issues**

  If the Metro bundler hangs or crashes, try resetting the cache:

  ```bash
  npx react-native start --reset-cache
  ```
## Learn More

- **[React Native Documentation](https://reactnative.dev/docs/getting-started)**
- **[MediaSFU Agents Guide](https://mediasfu.com/agents)**
- **[MediaSFU Documentation](https://www.mediasfu.com/documentation/)**
- **[React Navigation](https://reactnavigation.org/)**
- **[Redux Documentation](https://redux.js.org/)** (if using Redux)
- **[Context API](https://reactjs.org/docs/context.html)** (for state management)

---

*Happy Coding with React Native and MediaSFU! 📱🎉* 
