# MediaSFU Demo Agents APP (Angular)

This Angular starter application demonstrates how to integrate and use the **MediaSFU** packages within an Angular project to create Voice and Vision Agents. The app is designed to be a starting point for developers to build upon and customize based on their requirements. It includes the necessary components and services to interact with the MediaSFU API and create or join rooms for voice and video communication.

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

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v14 or later)
- **[npm](https://www.npmjs.com/)** (comes with Node.js) or **[Yarn](https://yarnpkg.com/)**
- **[Angular CLI](https://angular.io/cli)**

## Getting Started

### Clone the Repository

If you haven't cloned the main repository yet, do so now:

```bash
git clone https://github.com/MediaSFU/Agents.git
cd Agents/mediasfu_angular
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
ng serve
```

Navigate to `http://localhost:4200/` in your web browser. The application will automatically reload if you change any of the source files.

## [MediaSFU Agents Guide](https://mediasfu.com/agents)

The MediaSFU Agents Guide provides detailed information on how to use the MediaSFU packages to create Voice and Vision Agents. It includes instructions on how to set up and configure the agents, as well as how to interact with the MediaSFU API to create or join rooms for voice and video communication.

## Notes

By default, the app auto-connects and runs on startup. You might want to edit the HTML of the app to hide conditionally:

```html
<!-- ============ MediaSFUHandler ============ -->
<div *ngIf="showRoomDetails.value" class="media-sfu-handler">
  <app-media-sfu-handler
    [options]="showRoomDetails.value!"
  ></app-media-sfu-handler>
</div>
```

### Acoustic Echo Cancellation (AEC)

By default, Acoustic Echo Cancellation (AEC) is disabled. This is achieved by disabling the mic during sound playback from the server and reopening it afterward. This might introduce some marginal latencies. You could consider turning this off if the user is on a headset or using some noise cancellation approach.

The parameter to look for is `doAEC`. Set it to `true` to enable AEC and `false` to disable it. You can also remove it from the HTML as desired. Here's an example of how to toggle AEC:

```typescript
\\ Just a sample function to toggle AEC
toggleAEC(): void {
  this.doAEC = !this.doAEC;
  if (this.doAEC) {
    this.showToast(
      'AEC enabled (for echo issues on loudspeaker).',
      'info'
    );
  } else {
    this.showToast(
      'AEC disabled (faster, but might echo).',
      'info'
    );
  }
}
```

## Example Modification

This starter app demonstrates how to integrate MediaSFU packages within an Angular environment. Follow the steps below to modify:

### 1. Primary File of Interest

   The primary files you'll be working with are:

- `AppComponent (app.component.ts)`, located in the `src/app` folder. In `AppComponent`, you can customize the app to render various views or enable specific modes based on your development needs. In this file you may:

- Update AI Agent credentials.
- Customize rendering options and UI.
- Configure state management or navigation.

#### Update Credentials

  Locate the config line in `AppComponent` and update the AI Agent credentials:
  
  ```typescript
   config: any = {
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
        pauseOnSilence: true
      },
      pipeline: ['stt', 'ttllm', 'tts'],
      sttNickName: "yourSTT",
      llmNickName: "yourLLM",
      ttsNickName: "yourTTS",
      returnAll: true,
      returnAudioFormat: 'buffer'
    },
    vision: {
      fps: 1,
      pipeline: ['visionllm', 'tts'],
      llmNickName: "yourLLM",
      ttsNickName: "yourTTS",
      returnAll: true,
      returnAudioFormat: 'buffer'
    }
  };

  ```

#### Rendering Options

You can configure your agents credentials directly in  `AppComponent` file.

### 2. Secondary File of Interest

- `MediaSFUHandler (media-sfu-handler.component.ts)`, located in the `src/app/components/media-sfu-handler-components` folder. In `MediaSFUHandler`, you can configure the app to handle MediaSFU actions such as creating or joining rooms. Ensure you configure your credentials in the `credentials` part of the component:

     ```typescript
     credentials: Credentials = {
       apiUserName: 'yourDevUser',
       apiKey: 'yourDevApiKey1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
     };
     ```

     Note: `recordOnly` can be set to `true` to indicate one-way traffic (no consumption endpoints); however, a current bug prevents agents' usage if using MediaSFU Cloud alone with no community edition. They need to keep it as `false` (or leave out); defaults to `false`.

    Ensure you replace the `apiUserName` and `apiKey` with your actual values. These credentials allow seamless communication with the MediaSFU API.

2. **Configuration**

   Ensure any necessary credentials or settings are configured based on the [MediaSFU Documentation](https://github.com/MediaSFU/MediaSFU-Angular) to enable full functionality of the MediaSFU components.

## Troubleshooting

- **Angular CLI Not Found**

  If you encounter an error related to Angular CLI, install it globally:

  ```bash
  npm install -g @angular/cli
  ```

- **Dependency Issues**

  If you encounter issues during installation, try deleting `node_modules` and reinstalling:

  ```bash
  rm -rf node_modules
  npm install
  ```

- **Port Already in Use**

  If port `4200` is already in use, specify a different port:

  ```bash
  ng serve --port 4300
  ```

## Learn More

- **[Angular Documentation](https://angular.io/docs)**
- **[MediaSFU Agents Guide](https://mediasfu.com/agents)**
- **[Angular CLI](https://angular.io/cli)**
- **[Angular Material](https://material.angular.io/)** (if applicable)

---

*Happy Coding with Angular and MediaSFU! 🚀🌐*
