# MediaSFU Demo Agents APP (ReactJS)

This MediaSFU ReactJS starter application demonstrates how to integrate and use the **MediaSFU** packages within a ReactJS project to create Voice and Vision Agents. The app is designed as a starting point for developers to build upon and customize based on their requirements. It includes the necessary components and services to interact with the MediaSFU API and create or join rooms for voice and video communication.

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

## Getting Started

### Clone the Repository

If you haven't cloned the main repository yet, do so now:

```bash
git clone https://github.com/MediaSFU/Agents.git
cd Agents/mediasfu_reactjs
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

Start the development server:

```bash
npm start
```

The application will open in your default web browser at `http://localhost:3000/`.

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

By default, Acoustic Echo Cancellation (AEC) is disabled. This is achieved by disabling the mic during sound playback from the server and reopening it afterward. This might introduce some marginal latencies. You can consider turning this off if the user is on a headset or using some noise cancellation approach.

The parameter to look for is `doAEC`. Set it to `true` to enable AEC and `false` to disable it. Here's an example of how to toggle AEC:

```jsx
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
```

## Example Modification

This starter app demonstrates how to integrate **MediaSFU** packages within a ReactJS environment. Follow the steps below to customize the app:

### 1. Primary File of Interest

The primary file you'll be working with is `App.tsx`, located in the root of the project directory. In `App.tsx`, you can:

- **Update AI Agent Credentials**: Configure your API credentials for authenticated access.
- **Customize Rendering Options and UI**: Modify how the MediaSFU components are rendered.
- **Configure State Management or Routing**: Integrate with state management libraries or routing systems as needed.

#### Update Credentials

Locate the credentials configuration in `App.tsx` and update them as follows:

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
    llmNickName: 'yourLLM',
    ttsNickName: 'yourTTS',
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

  If port `3000` (default ReactJS port) is already in use, you can specify a different port:

  ```bash
  npm start -- --port 3001
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

## Learn More

- **[ReactJS Documentation](https://reactjs.org/docs/getting-started.html)**
- **[MediaSFU Agents Guide](https://mediasfu.com/agents)**
- **[MediaSFU Documentation](https://www.mediasfu.com/documentation/)**
- **[React Router](https://reactrouter.com/)**
- **[Redux Documentation](https://redux.js.org/)** (if using Redux)
- **[Context API](https://reactjs.org/docs/context.html)** (for state management)

---

*Happy Coding with ReactJS and MediaSFU! 🚀🌐*

