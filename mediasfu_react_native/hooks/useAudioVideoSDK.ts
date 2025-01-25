import {
  clickVideo, ClickVideoOptions, clickAudio, ClickAudioOptions, confirmExit, ConfirmExitOptions,
  controlMedia, ControlMediaOptions, switchVideoAlt, SwitchVideoAltOptions, switchVideo, SwitchVideoOptions,
  removeParticipants, RemoveParticipantsOptions,
  Participant,
} from 'mediasfu-reactnative';

interface UseAudioVideoSDKProps {
  sourceParameters: Record<string, any>;
  deviceId?: string;
}

interface MediaControlsProps {
  sourceParameters: Record<string, any>;
  remoteMember: String;
  mediaType?: 'audio' | 'video' | 'screenshare' | 'all';
}

export const disconnectRoom = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      const options: ConfirmExitOptions = {
        member: sourceParameters.member,
        socket: sourceParameters.socket,
        localSocket: sourceParameters.localSocket!,
        roomName: sourceParameters.roomName,
        ban: false,
      };
      await confirmExit(
        options
      );
    }
  } catch (e) {
    console.error(e);
  }
};

export const toggleAudio = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      const options: ClickAudioOptions = {
        parameters: sourceParameters.getUpdatedAllParams(),
      };
      await clickAudio(options);
    }
  } catch (e) {
    console.error(e);
  }
};

export const toggleVideo = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      const options: ClickVideoOptions = {
        parameters: sourceParameters.getUpdatedAllParams(),
      };
      await clickVideo(options);
    }
  } catch (e) {
    console.error(e);
  }
};

export const restrictMedia = async ({ sourceParameters, remoteMember, mediaType }: MediaControlsProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      sourceParameters = sourceParameters.getUpdatedAllParams();
      const isHost = sourceParameters.islevel === '2';

      if (isHost) {
        const participant = sourceParameters.participants.find((p: Participant) => p.name === remoteMember);
        const options: ControlMediaOptions = {
          participantId: participant.id || '',
          participantName: participant.name,
          type: mediaType!,
          socket: sourceParameters.socket,
          roomName: sourceParameters.roomName,
          coHostResponsibility: sourceParameters.coHostResponsibility,
          showAlert: sourceParameters.showAlert,
          coHost: sourceParameters.coHost,
          participants: sourceParameters.participants,
          member: sourceParameters.member,
          islevel: sourceParameters.islevel,
        };
        controlMedia(options);
      } else {
        throw new Error('You are not the host');
      }
    }
  } catch (e) {
    console.error(e);
  }
};


//add during explanation
export const switchCamera = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      const options: SwitchVideoAltOptions = {
        parameters: sourceParameters.getUpdatedAllParams(),
      };
      await switchVideoAlt(options);
    }
  } catch (e) {
    console.error(e);
  }
};

export const selectCamera = async ({ sourceParameters, deviceId }: UseAudioVideoSDKProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      const options: SwitchVideoOptions = {
        videoPreference: deviceId!,
        parameters: sourceParameters.getUpdatedAllParams(),
      };
      switchVideo(options);
    }
  } catch (e) {
    console.error(e);
  }
};

export const removeMember = async ({ sourceParameters, remoteMember }: MediaControlsProps): Promise<void> => {
  try {
    if (Object.keys(sourceParameters).length > 0) {
      sourceParameters = sourceParameters.getUpdatedAllParams();
      const isHost = sourceParameters.islevel === '2';

      if (isHost) {
        const participant = sourceParameters.participants.find((p: Participant) => p.name === remoteMember);
        const options: RemoveParticipantsOptions = {
          coHostResponsibility: sourceParameters.coHostResponsibility,
          participant: participant,
          member: sourceParameters.member,
          islevel: sourceParameters.islevel,
          showAlert: sourceParameters.showAlert,
          coHost: sourceParameters.coHost,
          participants: sourceParameters.participants,
          socket: sourceParameters.socket,
          roomName: sourceParameters.roomName,
          updateParticipants: sourceParameters.updateParticipants,
        };
        removeParticipants(options);
      } else {
        throw new Error('You are not the host');
      }
    }
  } catch (e) {
    console.error(e);
  }
};


