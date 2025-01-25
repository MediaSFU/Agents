/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef } from "react";
import {
  CreateMediaSFURoomOptions,
  JoinMediaSFURoomOptions,
  Credentials,
} from "mediasfu-reactjs";
import { MediasfuGeneric, PreJoinPage } from "mediasfu-reactjs";


export interface MediaSFUHandlerProps {
  action: "create" | "join";
  duration?: number;
  capacity?: number;
  name: string;
  meetingID?: string; // Optional for create, required for join
  sourceParameters: Record<string, any>;
  updateSourceParameters: (params: Record<string, any>) => void;
}

/**
 * MediaSFUHandler Component
 *
 * This component takes inputs for `action`, `duration`, `capacity`, `name`, sourceParameters`, and `updateSourceParameters`.
 * updates `sourceParameters` using `updateSourceParameters`, and performs the
 * necessary action (create or join) using MediaSFU methods.
 * It renders the `MediasfuGeneric` component with 0 width and height.
 *
 * @param {MediaSFUHandlerProps} props - The component props.
 */
const MediaSFUHandler: React.FC<MediaSFUHandlerProps> = ({
  action,
  duration,
  capacity,
  name,
  meetingID,
  sourceParameters,
  updateSourceParameters,
}) => {
  const noUIOptions = useRef<
    CreateMediaSFURoomOptions | JoinMediaSFURoomOptions | undefined
  >(undefined);
  const apiUserName = process.env.REACT_APP_MEDIASFU_API_USERNAME || "";
  const apiKey = process.env.REACT_APP_MEDIASFU_API_KEY || "";
  const credentials = useRef<Credentials | undefined>({ apiUserName, apiKey });

  // Do not use real credentials in production; follow MediaSFU documentation for secure handling by using dummy credentials
  // here and passing custom createRoomOnMediaSFU and joinRoomOnMediaSFU functions to handle credentials securely
  // Your function shoudl ideally intercept the payload meant for the MediaSFU server and add replace the dummy credentials with real ones

  try {
    if (action === "create") {
      // Prepare parameters for creating a room for MediaSFU with one-way production and egress support
      noUIOptions.current = {
        action: "create",
        duration: duration || 15,
        capacity: capacity || 5,
        userName: name || "agent",
        eventType: "conference",
        recordOnly: true, // One-way production and egress support
        dataBuffer: true, // Buffer data for egress support
        bufferType: "all",
      };
    } else if (action === "join") {
      if (!meetingID) {
        throw new Error("Meeting ID is required for joining a room.");
      }

      // Prepare parameters for joining a room
      noUIOptions.current = {
        action: "join",
        userName: name || "agent",
        meetingID,
      };
    } else {
      throw new Error('Invalid action. Must be either "create" or "join".');
    }
  } catch (error) {
    console.error("Error handling MediaSFU action:", error);
  }

  return (
    <div
      style={{
        width: 0,
        height: 0,
        maxHeight: 0,
        maxWidth: 0,
        overflow: "hidden",
      }}
    >
      {noUIOptions.current && (
        <MediasfuGeneric
          PrejoinPage={PreJoinPage}
          sourceParameters={sourceParameters}
          updateSourceParameters={updateSourceParameters}
          returnUI={false}
          noUIPreJoinOptions={noUIOptions.current}
          connectMediaSFU={true}
          credentials={credentials.current}
        />
      )}
    </div>
  );
};

export default MediaSFUHandler;
