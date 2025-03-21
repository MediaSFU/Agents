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

# MediaSFU Agents Monorepo

This monorepo contains starter applications for various frameworks—**ReactJS**, **React Native**, **Flutter**, and more—that demonstrate how to integrate [MediaSFU](https://mediasfu.com/) for **real-time streaming**, **multimodal AI pipelines**, and **agent-based** voice/vision workflows.

---

## Quick Start

> **Note:**  
See the [Agents Overview](https://mediasfu.com/agents) on the MediaSFU site for a broader  explanation of how these samples fit together.

1. **Create a MediaSFU Account**  
   Sign up at [MediaSFU](https://mediasfu.com/) and retrieve your AI credentials or placeholders.

2. **Clone the Agents Repository**  
   ```bash
   git clone https://github.com/MediaSFU/Agents.git
   cd Agents
   ```
   Choose a starter app directory (e.g., `mediasfu_reactjs`) and follow its `README.md`.

3. **Build & Run**  
   Depending on your chosen starter framework, install dependencies and run the development server.

4. **Credential Setup**  
   - **Option 1**: Use **dashboard credentials** by referencing your `nickName`.  
   - **Option 2**: For **ephemeral** usage, set `skipNickNameVerificationForAI` in your pipeline’s config and provide all necessary fields (`apiKey`, `baseURL`, etc.) on the frontend.  

---

## Live Preview

Explore the MediaSFU Agents demo live at [**agents.mediasfu.com**](https://agents.mediasfu.com).

### Quick Access Links:
- **[Basic](https://agents.mediasfu.com/basic)**  
  Preview the core functionality without needing any API keys.
- **[Advanced](https://agents.mediasfu.com/advanced)**  
  Experiment with more advanced features like custom STT, TTS, and LLM providers without needing API keys.
- **[Playground](https://agents.mediasfu.com/playground)**  
  Test advanced configurations—custom TTS, STT, multiple LLMs, and ephemeral key setups.
- **[Preconfigured Providers](#providers--configuration)**
  View detailed information on supported STT, LLM, and TTS providers.
- **[Configuration Guide](#ephemeral-vs-dashboard-credentials)**  
  Learn how to set up ephemeral keys, dashboard credentials, and customize your pipelines.

> **Note:**  
> No API keys? No problem—preview with limited functionality, or supply your own keys for full access.

---

## Monorepo Structure

This repository includes multiple subdirectories, each corresponding to a reference starter application:

- **`mediasfu_reactjs/`**: Demonstrates integration in a ReactJS web app.
- **`mediasfu_react_native/`**: A React Native mobile app (iOS & Android).
- **`mediasfu_react_native_expo/`**: A React Native app powered by Expo.
- **`mediasfu_flutter/`**: Shows how to integrate in a Flutter app.
- **`mediasfu_angular/`**: Angular-based reference for building a web application.
  
Each subdirectory includes a `README.md` explaining how to install, configure, and run that starter app.  

> **Note:**  
You can also see the [Agents Overview](https://mediasfu.com/agents) on the MediaSFU site for a broader explanation of how these samples fit together.

---

## Providers & Configuration

Below are the main AI providers supported, grouped by **LLM**, **TTS**, and **STT** services. Fields such as `baseURL`, `model`, `apiKey`, etc., must be strings if passing them as ephemeral overrides. If you rely on the MediaSFU Dashboard, you can simply reference the `nickName` you set.

### LLM Providers

| Key             | Display Name         | Website                                                                  | Description                                              | Basic Params (Example)                                                                                                              | Advanced Params                                |
|-----------------|----------------------|--------------------------------------------------------------------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| **openai_gpt4**     | OpenAI GPT‑4          | [openai.com](https://openai.com/)                                                    | OpenAI GPT‑4 model for text generation.                   | baseURL: `https://api.openai.com/v1/chat/completions`, model: `gpt-4o-mini`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI GPT‑4`        | stop, topP, presencePenalty, frequencyPenalty  |
| **anthropic_claude** | Anthropic Claude      | [anthropic.com](https://www.anthropic.com/)                                          | Anthropic Claude for conversational tasks.              | baseURL: `https://api.anthropic.com/v1/messages`, model: `claude-3-haiku-20240307`, maxTokens: `"50"`, temperature: `"0.7"`, service: `Anthropic Claude` | anthropicVersion, stop, topP                    |
| **gemini**          | Google Gemini         | [cloud.google.com/vertex-ai/generative-language](https://cloud.google.com/vertex-ai/generative-language) | Google Gemini for generative language tasks.             | baseURL: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, model: `gemini-1.5-flash`, maxTokens: `"50"`, temperature: `"0.7"`, service: `Gemini` | stop, topP                                     |
| **deepseek**        | DeepSeek              | [deepseek.com](https://deepseek.com/)                                               | DeepSeek (OpenAI‑compatible).                           | baseURL: `https://api.deepseek.com/v1/chat/completions`, model: `deepseek-chat-67b`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group`             | —                                               |
| **cerebras**        | Cerebras              | [cerebras.ai](https://www.cerebras.ai/)                                             | Cerebras AI with an OpenAI‑like interface.              | baseURL: `https://api.cerebras.ai/v1/chat/completions`, model: `llama3.1-8b`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group`                   | —                                               |
| **fireworks**       | Fireworks             | [fireworks.ai](https://www.fireworks.ai/)                                           | Fireworks AI with an OpenAI‑like interface.             | baseURL: `https://api.fireworks.ai/inference/v1/chat/completions`, model: `llama-v3p3-70b-instruct`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group` | —                                               |
| **groq_llm**        | Groq LLM              | [groq.com](https://www.groq.com/)                                                   | Groq LLM using an OpenAI‑like endpoint.                  | baseURL: `https://api.groq.com/openai/v1/chat/completions`, model: `llama3-8b-8192`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group`              | —                                               |
| **perplexity**      | Perplexity AI         | [perplexity.ai](https://www.perplexity.ai/)                                        | Perplexity AI in an OpenAI‑compatible format.           | baseURL: `https://api.perplexity.ai/chat/completions`, model: `llama-3.1-sonar-small-128k-chat`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group`   | —                                               |
| **together**        | Together AI           | [together.xyz](https://www.together.xyz/)                                          | Together AI for advanced LLM tasks.                     | baseURL: `https://api.together.xyz/v1/chat/completions`, model: `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group` | —                                               |
| **x_ai**            | xAI                   | [x.ai](https://www.x.ai/)                                                           | xAI with an OpenAI‑compatible endpoint.                 | baseURL: `https://api.x.ai/v1/chat/completions`, model: `grok-2-public`, maxTokens: `"50"`, temperature: `"0.7"`, service: `OpenAI-SDK-Group`                         | —                                               |

### TTS Providers

| Key              | Display Name   | Website                                                                   | Description                                     | Basic Params (Example)                                                                                                                            | Advanced Params                                                      |
|------------------|----------------|---------------------------------------------------------------------------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| **google_tts**       | Google TTS      | [cloud.google.com/text-to-speech](https://cloud.google.com/text-to-speech)               | High‑quality text-to‑speech conversion.          | baseURL: `https://texttospeech.googleapis.com/v1beta1/text:synthesize`, languageCode: `"en-US"`, voiceName: `"en-US-Wavenet-D"`, audioEncoding: `"LINEAR16"`, service: `Google-TTS` | —                                                                    |
| **elevenlabs**       | ElevenLabs      | [elevenlabs.io](https://elevenlabs.io/)                                  | Expressive and customizable TTS.                 | baseURL: `https://api.elevenlabs.io/v1/text-to-speech`, voiceId: `"9BWtsMINqrJLrRacOk9x"`, format: `"wav"`, service: `ElevenLabs`                                       | —                                                                    |
| **cartesia_tts**     | Cartesia TTS    | [cartesia.ai](https://www.cartesia.ai/)                                  | Advanced text-to‑speech solutions.               | baseURL: `https://api.cartesia.ai/tts/bytes`, modelId: `"sonic"`, voiceId: `"794f9389-aac1-45b6-b726-9d9369183238"`, cartesiaVersion: `"2024-06-10"`, service: `Cartesia-TTS`      | sampleRate (`"44100"`), bitRate (`"128000"`), container (`"mp3"`)    |
| **openai_tts**       | OpenAI TTS       | [openai.com](https://openai.com/)                                        | TTS via OpenAI's API.                             | baseURL: `https://api.openai.com/v1/audio/speech`, voiceId: `"alloy"`, model: `"tts-1"`, service: `OpenAI-TTS`                                                           | —                                                                    |
| **deepgram_tts**     | Deepgram TTS     | [deepgram.com](https://deepgram.com/)                                    | Real‑time or batch TTS.                          | baseURL: `https://api.deepgram.com/v1/speak`, model: `"aura-asteria-en"`, encoding: `"wav"`, service: `Deepgram-TTS`                                                    | —                                                                    |
| **playht_tts**       | Play.ht TTS      | [play.ht](https://play.ht/)                                              | Realistic voice synthesis.                       | baseURL: `https://api.play.ht/api/v2/tts/stream`, userId: `"playht"`, voiceId: *(PlayHT config)*, voiceEngine: `"Play3.0-mini"`, service: `PlayHT-TTS`                    | —                                                                    |
| **rime_tts**         | Rime TTS         | [rime.ai](https://www.rime.ai/)                                          | Advanced synthetic speech.                       | baseURL: `https://users.rime.ai/v1/rime-tts`, modelId: `"mistv2"`, voiceId: `"Allison"`, service: `Rime-TTS`                                                             | sampleRate (`"44100"`), speedAlpha, reduceLatency, pauseBetweenBrackets |

### **STT Providers**  

| Key                   | Display Name                  | Website                                                      | Description                                         | Basic Params (Example)                                                                                                                                               | Advanced Params |
|-----------------------|-----------------------------|--------------------------------------------------------------|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| **deepgram**          | Deepgram STT                | [deepgram.com](https://deepgram.com/)                        | Real‑time or batch speech‑to‑text.                 | `baseURL`: `"https://api.deepgram.com/v1/listen"`, `language`: `"en-US"`, `service`: `"Deepgram"`                                                                    | —               |
| **whisper**           | OpenAI Whisper              | [openai.com](https://openai.com/)                            | Speech‑to‑text by OpenAI Whisper.                  | `baseURL`: `"https://api.openai.com/v1/audio/transcriptions"`, `model`: `"whisper-1"`, `language`: `"en"`, `service`: `"Whisper"`                                    | —               |
| **assemblyai**        | AssemblyAI                  | [assemblyai.com](https://www.assemblyai.com/)                | Advanced audio transcription.                      | `baseURL`: `"https://api.assemblyai.com/v2/transcript"`, `webhook_url`: `""`, `language`: `"en-US"`, `service`: `"AssemblyAI"`                                       | —               |
| **google_stt**        | Google STT                  | [cloud.google.com/speech-to-text](https://cloud.google.com/speech-to-text) | Speech‑to‑text conversion. | `baseURL`: `"https://speech.googleapis.com/v1/speech:recognize"`, `languageCode`: `"en-US"`, `encoding`: `"LINEAR16"`, `sampleRateHertz`: `"16000"`, `service`: `"Google-STT"` | —               |
| **groq_stt**          | Groq STT                    | [groq.com](https://www.groq.com/)                            | Advanced speech‑to‑text conversion.                | `baseURL`: `"https://api.groq.com/openai/v1/audio/transcriptions"`, `language`: `"en"`, `service`: `"Groq-STT"`, `model`: `"whisper-large-v3-turbo"`                 | —               |
| **speechmatics**      | Speechmatics STT            | [speechmatics.com](https://www.speechmatics.com/)            | High-quality real-time or batch STT.               | `baseURL`: `"https://asr.api.speechmatics.com/v2"`, `language`: `"en"`, `service`: `"Speechmatics"`, `operatingPoint`: `"standard"`                                  | —               |
| **speechmatics_rt**   | Speechmatics (Real-Time)    | [speechmatics.com](https://www.speechmatics.com/)            | Real-time STT by Speechmatics.                     | `baseURL`: `"wss://eu2.rt.speechmatics.com/v2"`, `language`: `"en"`, `service`: `"Speechmatics-RT"`, `operatingPoint`: `"standard"`, `maxDelay`: `"0.7"`              | —               |
| **elevenlabs_scribe** | ElevenLabs STT              | [elevenlabs.io](https://elevenlabs.io/)                      | Expressive speech-to-text conversion.               | `baseURL`: `"https://api.elevenlabs.io/v1/speech-to-text"`, `model`: `"scribe_v1"`, `language`: `"en"`, `service`: `"ElevenLabs-Scribe"`                             | —               |

---

## Ephemeral vs. Dashboard Credentials

1. **Dashboard Credentials**  
   - Create a credential in the MediaSFU dashboard.  
   - Use `sttNickName="MyWhisper"`, `ttsNickName="GoogleTTS"`, `llmNickName="MyOpenAI"`, etc.  
   - If a field (like `apiKey`) is set in the dashboard, it has higher priority than ephemeral overrides.

2. **Ephemeral Credentials**  
   - Set your pipeline’s NickName to `skipNickNameVerificationForAI`.  
   - Pass all **required** fields in `llmParams`, `sttParams`, or `ttsParams`.  
   - Great for ephemeral or user-supplied keys if you don’t want them stored on the server.  
   - Must supply numeric fields (e.g. `temperature`, `maxTokens`) as **strings** (e.g. `"0.7"`, `"100"`).

```ts
// Example ephemeral usage for a voice pipeline:
audio: {
  format: "wav",
  pipeline: ["stt", "ttllm", "tts"],
  sttNickName: "skipNickNameVerificationForAI",
  sttParams: {
    baseURL: "https://api.openai.com/v1/audio/transcriptions",
    model: "whisper-1",
    apiKey: "<OPENAI_KEY>",
    language: "en",
    service: "Whisper"
  },
  llmNickName: "skipNickNameVerificationForAI",
  llmParams: {
    baseURL: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    apiKey: "<OPENAI_KEY>",
    temperature: "0.5",
    maxTokens: "50",
    service: "OpenAI-SDK-Group"
  },
  ttsNickName: "googleTTS", // This might be a registered credential in the dashboard
  ...
}
```

---

## Limitations & Next Steps

1. **Rate Limits**  
   If you hit your STT/LLM/TTS provider’s rate limits, try ephemeral keys from a paid plan or the official dashboard credentials.  
2. **Latency Optimization**  
   - Use local or lower-latency providers if you require sub–300ms responses.  
   - Turn off silence detection if you want continuous streaming.  
3. **Multimodal**  
   - If running both **audio** and **vision**, set `fps` to 0.5–1 for best performance if you only need occasional frames.  
4. **Production Deployment**  
   - Use a robust architecture for your ephemeral key management.  
   - Monitor usage logs to prevent accidental overbilling from certain providers.

---

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