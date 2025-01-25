declare module 'react-native-webrtc-web-shim' {
    import { Component } from 'react';

    // Define the RTCView component
    export class RTCView extends Component<{
      streamURL: string;
      objectFit?: 'contain' | 'cover';
      mirror?: boolean;
      zOrder?: number;
      [key: string]: any;
    }> {}

    // Define the MediaStream class
    export class MediaStream extends EventTarget {
      tracks: any[];
      toURL(): string;
      addTrack(track: MediaStreamTrack): void;
      removeTrack(track: MediaStreamTrack): void;
      getTracks(): any[];
      [key: string]: any;
    }

    export class MediaStreamTrack extends EventTarget {
        [key: string]: any;
    }

    export const mediaDevices: any;

    export const registerGlobals: any;


    // Other exports or types as needed
  }
