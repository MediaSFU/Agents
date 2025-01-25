import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { FontAwesome5 as Icon} from '@expo/vector-icons';
import AudioLevelBars from './AudioLevelBars';
import { MediaStream } from 'mediasfu-reactnative-expo';
import { RTCView } from '../custom/webrtc/webrtc';
interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoStream: MediaStream | null;
  audioLevel: number;
  hasVideoFeed: boolean;
}

/**
 * CustomModal replicates:
 * - Draggable by user.
 * - Displays AudioLevelBars in the header and an RTCView in the body.
 * - If no video feed, shows a placeholder box.
 */
const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  videoStream,
  audioLevel,
  hasVideoFeed,
}) => {
  const pan = useRef<any>(new Animated.ValueXY()).current;
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (videoStream && localStream.current !== videoStream) {
      localStream.current = videoStream;
    }
  }, [videoStream]);  
  

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan?.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  useEffect(() => {
    if (isOpen) {
      // Reset position when the modal opens
      pan.setValue({ x: 0, y: 0 });
    }
  }, [isOpen, pan]);

  if (!isOpen) {return null;}

  return (
    <>
      <Animated.View
        style={[
          styles.modalContainer,
          { transform: pan.getTranslateTransform() },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.modalHeader}>
          {/* AudioLevelBars here */}
          <View style={styles.audioLevelBars}>
            <AudioLevelBars audioLevel={audioLevel} />
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close Modal"
            accessibilityRole="button"
          >
            <Icon name="times" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          {hasVideoFeed && videoStream ? (
            Platform.OS === "web" ? (
              <RTCView
                stream={localStream.current}
                style={styles.video}
              />
            ) : (
              <RTCView
                streamURL={localStream.current?.toURL()}
                style={styles.video}
                objectFit="cover"
                mirror={true}
              />
            )
          ) : (
            <View style={styles.placeholderVideo}>
              <Text style={styles.placeholderText}>No video feed available</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute', // Ensure it floats over the background
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -70 }],
    width: 140,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  } as ViewStyle, // Explicit ViewStyle

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle, // Explicit ViewStyle

  closeButton: {
    padding: 4,
  } as ViewStyle, // Explicit ViewStyle

  modalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle, // Explicit ViewStyle

  video: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  } as ViewStyle, // Explicit ViewStyle for the RTCView

  placeholderVideo: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle, // Explicit ViewStyle

  placeholderText: {
    color: '#555',
    fontSize: 12,
  } as TextStyle, // Explicit TextStyle

  audioLevelBars: {
    flex: 0.9,
  } as ViewStyle, // Explicit ViewStyle
});
