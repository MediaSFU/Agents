# MediaSFU Demo Agents APP (React Native Expo)

This React Native (Expo) starter application demonstrates how to integrate and use the **MediaSFU** packages within an React Native (Expo) project to create Voice and Vision Agents. The app is designed to be a starting point for developers to build upon and customize based on their requirements. It includes the necessary components and services to interact with the MediaSFU API and create or join rooms for voice and video communication.

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
  - [1. Primary File of Interest](#1-primary-file-of-interest)
  - [2. Secondary File of Interest](#2-secondary-file-of-interest)
- [Troubleshooting](#troubleshooting)
- [Learn More](#learn-more)

## Prerequisites

Before you begin, ensure you have the following installed and set up:

- **[Node.js](https://nodejs.org/)** (v14 or later)
- **[npm](https://www.npmjs.com/)** (comes with Node.js) or **[Yarn](https://yarnpkg.com/)**
- **[Expo CLI](https://docs.expo.dev/get-started/installation/)**
- **[Expo Go](https://expo.dev/client)** app installed on your iOS or Android device (optional, for testing on physical devices)
- **[VS Code](https://code.visualstudio.com/)** or **[Atom](https://atom.io/)** (recommended IDEs)

## Getting Started

### Clone the Repository

If you haven't cloned the main repository yet, do so now:

```bash
git clone https://github.com/MediaSFU/Agents.git
cd Agents/mediasfu_react_native_expo
```

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

Start the Expo development server:

```bash
npx expo start
```

This will open the Expo Dev Tools in your browser. From here, you can:

- **Run on Web**: Press `w`
- **Run on Android Emulator**: Press `a`
- **Run on iOS Simulator**: Press `i` (macOS only)
- **Run on Physical Device**: Scan the QR code using the Expo Go app

The application should now be running on your selected device or emulator.

## [MediaSFU Agents Guide](https://mediasfu.com/agents)

The MediaSFU Agents Guide provides detailed information on how to use the MediaSFU packages to create Voice and Vision Agents. It includes instructions on setting up and configuring agents, as well as interacting with the MediaSFU API to create or join rooms for voice and video communication.

## Notes

By default, the app auto-connects and runs on startup. You might want to edit the `Agent.tsx` file located in the ./app/components directory to conditionally render it:

```tsx
{showRoomDetails && (
  <MediaSFUHandler options={showRoomDetails} />
)}
```

### Acoustic Echo Cancellation (AEC)

By default, Acoustic Echo Cancellation (AEC) is enabled. This is achieved by disabling the mic during sound playback from the server and reopening it afterward. This might introduce some marginal latencies. You can consider turning this off if the user is on a headset or using some noise cancellation approach.

The parameter to look for is `doAEC`. Set it to `false` to disable AEC.

```tsx
import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MediaSFUHandler = () => {
  const doAEC = useRef(true);

  const toggleAEC = () => {
    doAEC.current = !doAEC.current;
    showToast(
      `AEC ${
        doAEC.current
          ? 'enabled; useful for echo issues on loudspeaker. Some performance issues may occur.'
          : 'disabled; better performance but possible echo.'
      }`,
      'info',
    );
  };

  return (
    <TouchableOpacity
      onPress={toggleAEC}
      style={styles.iconButton}
      accessibilityLabel="Toggle AEC"
      accessibilityRole="button">
      <Icon
        name={doAEC.current ? 'deaf' : 'assistive-listening-systems'}
        size={16}
        color={doAEC.current ? '#28a745' : '#6c757d'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    // Your styles here
  },
});

export default MediaSFUHandler;
```

## Example Modification

This starter app demonstrates how to integrate **MediaSFU** packages within an Expo-managed React Native environment. Follow the steps below to customize the app:

### 1. Primary File of Interest

The primary file you'll be working with is `Agent.tsx`, located in the `./app/components` directory. In `Agent.tsx`, you can:

- **Update AI Agent Credentials**: Configure your API credentials for authenticated access.
- **Customize Rendering Options and UI**: Modify how the MediaSFU components are rendered.
- **Configure State Management or Navigation**: Integrate with state management libraries or navigation systems as needed.

-- Note that the Agent.tsx is imported and used in the `./app/(tabs)/index.tsx` file.

#### Update Credentials

Locate the config line in `Agent.tsx` and update them as follows:

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

You can configure different rendering modes directly in the `Agent.tsx` file:

### 2. Secondary File of Interest

The secondary file is `MediaSFUHandler`, located in the `./app/components` folder. This component is responsible for handling MediaSFU interactions such as creating or joining rooms. Update the credentials in `MediaSFUHandler` as follows:

```tsx
import React, { useRef } from 'react';
import { Credentials } from 'mediasfu-reactnative-expo';

const MediaSFUHandler = ({ credentials }) => {
  const apiUserName = 'yourDevUser';
  const apiKey = 'yourDevApiKey1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const credentialsRef = useRef<Credentials | undefined>({ apiUserName, apiKey });

  // Rest of your MediaSFUHandler component logic

  return (
    // Your JSX here
  );
};

export default MediaSFUHandler;
```

Ensure you replace the `apiUserName` and `apiKey` with your actual values. These credentials allow seamless communication with the MediaSFU API.

## Troubleshooting

- **Expo CLI Not Found**

  If you encounter an error related to Expo CLI, install it globally:

  ```bash
  npm install -g expo-cli
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

- **Metro Bundler Issues**

  If the Metro bundler hangs or crashes, try resetting the cache:

  ```bash
  npx expo start -c
  ```

- **Port Already in Use**

  If port `19000` (default Expo port) is already in use, specify a different port by modifying the `expo start` command:

  ```bash
  npx expo start --dev-client --port 19001
  ```

- **Physical Device Issues**

  - **iOS**: Ensure your device is connected to the same network as your development machine.
  - **Android**: Ensure USB debugging is enabled and your device is recognized by running `adb devices`.

## Learn More

- **[Expo Documentation](https://docs.expo.dev/)**
- **[MediaSFU Agents Guide](https://mediasfu.com/agents)**
- **[React Native Documentation](https://reactnative.dev/docs/getting-started)**
- **[MediaSFU Documentation](https://www.mediasfu.com/documentation/)**
- **[React Navigation](https://reactnavigation.org/)**
- **[Redux Documentation](https://redux.js.org/)** (if using Redux)
- **[Context API](https://reactjs.org/docs/context.html)** (for state management)

---

*Happy Coding with Expo and MediaSFU! 🚀📱*