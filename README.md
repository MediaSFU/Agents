<p align="center">
  <img src="https://www.mediasfu.com/logo192.png" width="100" alt="MediaSFU Logo">
</p>

<p align="center">
  <a href="https://twitter.com/media_sfu">
    <img src="https://img.icons8.com/color/48/000000/twitter--v1.png" alt="Twitter" style="margin-right: 10px;">
  </a>
  <a href="https://www.mediasfu.com/forums">
    <img src="https://img.icons8.com/color/48/000000/communication--v1.png" alt="Community Forum" style="margin-right: 10px;">
  </a>
  <a href="https://github.com/MediaSFU">
    <img src="https://img.icons8.com/fluent/48/000000/github.png" alt="Github" style="margin-right: 10px;">
  </a>
  <a href="https://www.mediasfu.com/">
    <img src="https://img.icons8.com/color/48/000000/domain--v1.png" alt="Website" style="margin-right: 10px;">
  </a>
  <a href="https://www.youtube.com/channel/UCELghZRPKMgjih5qrmXLtqw">
    <img src="https://img.icons8.com/color/48/000000/youtube--v1.png" alt="Youtube" style="margin-right: 10px;">
  </a>
</p>

# MediaSFU Quick Start & Agents Overview

MediaSFU offers a cutting-edge streaming experience that empowers you to customize your recordings and engage your audience with high-quality streams. Whether you're a content creator, educator, or business professional, MediaSFU provides the tools you need to elevate your streaming game.

---

## Quick Start Guide

Follow these three simple steps to integrate MediaSFU into your app in under 15 minutes:

1. **Get a MediaSFU Account**  
   Sign up for your account on [MediaSFU's website](https://www.mediasfu.com/).

2. **Create Your AI Credentials**  
   Use the MediaSFU Sandbox or Dashboard to generate your AI credentials. Follow the on-screen instructions to obtain your unique credential nicknames and tokens.

3. **Integrate with Your App**  
   Edit your application according to the individual SDK guides. Pass your AI credentials' nicknames as directed.  
   > **Tip:** If your integration endpoint requires it, remember to whitelist `mediasfu.com` and its subdomains.

---

## Agents Repository Overview

Welcome to the **Agents** repository! This monorepo contains starter applications for various frameworks, designed to help you effectively use MediaSFU packages.

- **[MediaSFU Agents Overview](https://mediasfu.com/agents)**

> **Important:** The current default support in these starter apps is for either voice or vision pipelines—not both simultaneously (i.e., true multimodal). Developers wishing to integrate multimodal capabilities can adapt these samples by running partial or custom pipelines and relaying specific events or data to other services or client-side logic.

### Table of Contents

- [Available Starter Apps](#available-starter-apps)
  - [MediaSFU ReactJS](./mediasfu_reactjs/README.md)
  - [MediaSFU React Native](./mediasfu_react_native/README.md)
  - [MediaSFU React Native Expo](./mediasfu_react_native_expo/README.md)
  - [MediaSFU Flutter](./mediasfu_flutter/README.md)
  - [MediaSFU Angular](./mediasfu_angular/README.md)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Choose a Starter App](#choose-a-starter-app)
- [Contributing](#contributing)
- [License](#license)

## Available Starter Apps

Explore the starter application that best fits your development framework:

- **[MediaSFU ReactJS](./mediasfu_reactjs/README.md):** A web application built with ReactJS demonstrating MediaSFU integration.
- **[MediaSFU React Native](./mediasfu_react_native/README.md):** A mobile application for iOS and Android using React Native.
- **[MediaSFU React Native Expo](./mediasfu_react_native_expo/README.md):** A React Native application powered by Expo for simplified development and deployment.
- **[MediaSFU Flutter](./mediasfu_flutter/README.md):** A cross-platform mobile application built with Flutter.
- **[MediaSFU Angular](./mediasfu_angular/README.md):** A web application built with Angular showcasing MediaSFU package usage.

## Getting Started

### Clone the Repository

Clone the entire repository to your local machine:

```bash
git clone https://github.com/MediaSFU/Agents.git
cd Agents
```

### Choose a Starter App

Navigate to the directory corresponding to your framework of choice and follow the specific setup instructions in its `README.md`. For example, to get started with the ReactJS starter app:

```bash
cd mediasfu_reactjs
# Follow the setup instructions in mediasfu_reactjs/README.md
```

## Contributing

We welcome contributions! Please refer to our [Contributing Guidelines](./CONTRIBUTING.md) for more details on how to get involved.

## License

This project is licensed under the [MIT License](./LICENSE).

---

*Happy Coding! 🚀*