import {
    ClickAudioOptions, clickAudio, ConfirmExitOptions, confirmExit, ControlMediaOptions,
    controlMedia,
    Participant,
    RemoveParticipantsOptions,
    removeParticipants,
    ClickVideoOptions,
    clickVideo,
    SwitchVideoAltOptions,
    switchVideoAlt,
    SwitchVideoOptions,
    switchVideo,
} from "mediasfu-reactjs";

interface UseAudioVideoSDKProps {
    sourceParameters: Record<string, any>;
    deviceId?: string;
}

interface MediaControlsProps {
    sourceParameters: Record<string, any>;
    remoteMember: String;
    mediaType?: "audio" | "video" | "screenshare" | "all";
}

export const disconnectRoom = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // Disconnect the room
            const options: ConfirmExitOptions = {
                member: sourceParameters.member,
                socket: sourceParameters.socket,
                localSocket: sourceParameters.localSocket!,
                roomName: sourceParameters.roomName,
                ban: false,
            };

            await confirmExit(options);
        }
    } catch (error) {
        console.error("Error disconnecting room:", error);
    }
}

export const toggleAudio = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {

    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // Toggle audio
            const options: ClickAudioOptions = {
                parameters: sourceParameters as ClickAudioOptions["parameters"],
            };

            await clickAudio(options);
        }
    } catch (error) {
        console.error("Error toggling audio:", error);
    }
}

export const toggleVideo = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // Toggle video
            const options: ClickVideoOptions = {
                parameters: sourceParameters as ClickVideoOptions["parameters"],
            };

            await clickVideo(options);
        }
    } catch (error) {
        console.error("Error toggling video:", error);
    }
}

export const switchCamera = async ({ sourceParameters }: UseAudioVideoSDKProps): Promise<void> => {
    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // Switch camera
            const options: SwitchVideoAltOptions = {
                parameters: sourceParameters as SwitchVideoAltOptions["parameters"],
            };

            await switchVideoAlt(options);
        }
    } catch (error) {
        console.error("Error switching camera:", error);
    }
}

export const selectCamera = async ({ sourceParameters, deviceId }: UseAudioVideoSDKProps): Promise<void> => {
    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // Select camera
            const options: SwitchVideoOptions = {
                parameters: sourceParameters as SwitchVideoOptions["parameters"],
                videoPreference: deviceId!,
            };

            await switchVideo(options);
        }
    } catch (error) {
        console.error("Error selecting camera:", error);
    }
}

export const restrictMedia = async ({ sourceParameters, remoteMember, mediaType }: MediaControlsProps): Promise<void> => {
    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // you must be the host to restrict media
            const isHost = sourceParameters.islevel === "2";

            if (!isHost) {
                console.error("You must be the host to restrict media.");
                return;
            }

            // Restrict media uses ControlMediaOptions
            const participant = sourceParameters.participants.find((p: Participant) => p.name === remoteMember);
            if (!participant) {
                console.error("Participant not found");
                return;
            }
            const options: ControlMediaOptions = {
                participantId: participant.id || "",
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
            await controlMedia(options);
        }
    } catch (error) {
        console.error("Error restricting media:", error);
    }
}

export const removeMember = async ({ sourceParameters, remoteMember }: MediaControlsProps): Promise<void> => {

    try {
        // First check object keys length
        if (Object.keys(sourceParameters).length > 0) {
            // you must be the host to remove a member
            const isHost = sourceParameters.islevel === "2";
            if (!isHost) {
                console.error("You must be the host to remove a member.");
                return;
            }

            // Remove member
            const participant = sourceParameters.participants.find((p: Participant) => p.name === remoteMember);
            if (!participant) {
                console.error("Participant not found");
                return;
            }
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
            await removeParticipants(options);
        }
    } catch (error) {
        console.error("Error removing member:", error);
    }
}

