/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

// Default fallback
// Fallback for mediaDevices with support for getUserMedia
export const mediaDevices = {
    getUserMedia: async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      // Fallback logic or mock implementation for getUserMedia
      console.warn('getUserMedia is not implemented in this environment.');
      return new MediaStream(); // Return an empty MediaStream as a fallback
    },

    getDisplayMedia: async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
        // Fallback logic or mock implementation for getDisplayMedia
        console.warn('getDisplayMedia is not implemented in this environment.');
        return new MediaStream(); // Return an empty MediaStream as a fallback
    },


    enumerateDevices: async (): Promise<MediaDeviceInfo[]> => {
        // Fallback logic or mock implementation for enumerateDevices
        console.warn('enumerateDevices is not implemented in this environment.');
        return []; // Return an empty array as a fallback
    },
};

export function registerGlobals() {}

export class MediaStream {
    tracks: any[];

    constructor(tracks: any[] = []) {
        this.tracks = tracks; // Assign tracks to the MediaStream instance
    }

    // You can add additional methods or properties if needed
    [key: string]: any;
}

export class MediaStreamTrack {
    [key: string]: any;
}

export class RTCView extends React.Component<any> {
    render(): JSX.Element {
        return null; // Empty RTCView implementation
    }
}