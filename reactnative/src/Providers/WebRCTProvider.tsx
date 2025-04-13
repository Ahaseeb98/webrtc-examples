/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';
import io, {Socket} from 'socket.io-client';
import {AppState, Platform} from 'react-native';
import inCallManager from 'react-native-incall-manager';
import {navigate, navigationRef} from '../Utils/navigationRef';
import {MMKV} from 'react-native-mmkv';

import RNCallKeep from 'react-native-callkeep';

const options = {
  ios: {
    appName: 'My app name',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    additionalPermissions: [],
    // Required to get audio in background when using Android 11
    foregroundService: {
      channelId: 'call',
      channelName: 'Foreground service for my app',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
};

const SOCKET_SERVER_URL = 'http://192.168.100.128:3500';

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerId: string | null;
  otherUserId: string | null;
  setOtherUserId: (id: string) => void;
  processCall: (roomId: string) => Promise<void>;
  processAccept: (roomId: string) => Promise<void>;
  leave: (isSocket?: boolean, roomId?: string) => void;
  switchCamera: () => void;
  toggleCamera: () => void;
  toggleMic: () => void;
  localMicOn: boolean;
  localWebcamOn: boolean;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

interface WebRTCProviderProps {
  children: ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({children}) => {
  const appState = useRef(AppState.currentState);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [myId, setMyId] = useState('');
  const otherUserId = useRef<string | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<Socket | null>(null);
  const remoteRTCMessage = useRef<any>(null);
  const [localMicOn, setLocalMicOn] = useState(true);
  const [localWebcamOn, setLocalWebcamOn] = useState(true);
  useEffect(() => {
    const storage = new MMKV();
    const storedValue = storage.getString('myId');
    if (!storedValue) {
      storage.set('myId', myId);
    } else {
      setMyId(storedValue);
    }
  }, [myId]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    RNCallKeep.addEventListener('answerCall', async ({callUUID}) => {
      const storage = new MMKV();
      const pendingCallId = storage.getString('pendingCall');
      console.log('callUUID', pendingCallId, callUUID);
      if (pendingCallId === callUUID) {
        await processAccept(callUUID);
        RNCallKeep.backToForeground();
        storage.delete('pendingCall'); // Clear pending call tracking
      }
    });

    RNCallKeep.addEventListener('endCall', ({callUUID}) => {
      console.log(`Call rejected: ${callUUID}`);
      leave(); // Ensure cleanup

      console.log(callUUID, 'callUUID', myId);
    });

    return () => {
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
    };
  }, []);

  useEffect(() => {
    RNCallKeep.setup(options)
      .then(accepted => {
        if (accepted) {
          RNCallKeep.setAvailable(true);
        }
      })
      .catch(error => {
        console.log(error, 'Error');
      });
  }, []);

  useEffect(() => {
    socket.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      query: {callerId: myId},
    });

    socket.current?.on('connect', () => {
      console.log('Connected to signaling server');
    });

    socket.current?.on('callEnded', () => {
      console.log('CALL_ENDED', Platform.OS);
      leave(true);
    });

    socket.current?.on('newCall', data => {
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      console.log(data, 'LOLOLOl');
      const callUUID = data.roomId; // Unique ID for CallKeep

      // Track the call for post-answer logic
      const storage = new MMKV();
      // Save room ID for CallKeep's answerCall event
      storage.set('pendingCall', callUUID);
      if (appState.current !== 'active') {
        RNCallKeep.displayIncomingCall(
          callUUID,
          data.callerId || 'Unknown Caller',
          'Incoming Video Call',
          'generic',
          true,
        );
      } else {
        console.log(
          'App is in the foreground. Skipping CallKeep notification.',
        );
        navigate('Receiving', {otherId: data.callerId});
      }
      // navigate('Receiving', {otherId: data.callerId});
    });

    socket.current?.on('callAnswered', data => {
      remoteRTCMessage.current = data.rtcMessage;
      peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current),
      );
      navigate('InCall', {});
    });

    socket.current?.on('ICEcandidate', data => {
      console.log(data, 'IN ICE REC');
      if (peerConnection.current) {
        peerConnection.current
          .addIceCandidate(new RTCIceCandidate(data.rtcMessage))
          .then(() => console.log('ICE candidate added'))
          .catch(err => console.error('Error adding ICE candidate:', err));
      }
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [myId]);

  const setupMediaStream = async () => {
    try {
      const mediaConstraints = {
        audio: true,
        video: localWebcamOn
          ? {
              mandatory: {
                minWidth: 500,
                minHeight: 300,
                minFrameRate: 30,
              },
              facingMode: 'user',
            }
          : false,
      };
      const stream = await mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(stream);
      stream
        .getTracks()
        .forEach(track => peerConnection.current?.addTrack(track, stream));

      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
    }
  };

  const processCall = async (roomId: string) => {
    try {
      if (!peerConnection.current) {
        initializePeerConnection();
      }
      await setupMediaStream();
      const offer = await peerConnection.current?.createOffer({});
      await peerConnection.current?.setLocalDescription(offer);
      console.log('CALLLLL', roomId, otherUserId.current);
      socket.current?.emit('call', {
        calleeId: otherUserId.current,
        rtcMessage: offer,
        roomId,
      });
    } catch (error) {
      console.log(error, 'error-processCall');
    }
  };

  const processAccept = async (roomId: string) => {
    if (!peerConnection.current) {
      initializePeerConnection();
    }
    await setupMediaStream();

    await peerConnection.current?.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current),
    );
    const answer = await peerConnection.current?.createAnswer();
    await peerConnection.current?.setLocalDescription(answer);
    socket.current?.emit('answerCall', {
      callerId: otherUserId.current,
      rtcMessage: answer,
      roomId,
    });

    console.log('processAccept', roomId, otherUserId.current);

    setTimeout(() => {
      navigate('InCall', {otherId: roomId});
    }, 500); // Add a slight delay to ensure connection stability
  };

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
      ],
    });
    // @ts-ignore
    peerConnection.current.onicecandidate = event => {
      console.log('ONICE');
      if (event.candidate) {
        socket.current?.emit('ICEcandidate', {
          calleeId: otherUserId.current,
          rtcMessage: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      } else {
        console.log('End of candidates.');
      }
    };

    // @ts-ignore
    peerConnection.current.ontrack = event => {
      console.log('ONTRACK');
      const remoteStream1 = event.streams[0];
      setRemoteStream(remoteStream1);
    };
  };
  const leave = (isSocket?: boolean, roomId?: string) => {
    console.log(roomId, 'WHAT_ID BRUH');
    localStream?.getTracks().forEach(track => track.stop());

    peerConnection.current?.getTransceivers().forEach(transceiver => {
      transceiver.stop();
    });
    peerConnection.current?.close();
    peerConnection.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    inCallManager.stop();
    if (!isSocket) {
      socket.current?.emit('endCall', {calleeId: otherUserId.current, roomId});
    }
    otherUserId.current = null;

    if (roomId) {
      RNCallKeep.endCall(roomId as string);
    }

    setTimeout(() => {
      navigationRef?.navigate('Home');
    }, 500);
  };

  const switchCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      setLocalWebcamOn(!localWebcamOn);
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !localWebcamOn;
      });
    }
  };

  const toggleMic = () => {
    if (localStream) {
      setLocalMicOn(!localMicOn);
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !localMicOn;
      });
    }
  };

  const value: WebRTCContextType = {
    localStream,
    remoteStream,
    callerId: myId,
    otherUserId: otherUserId.current,
    setOtherUserId: (id: string) => {
      otherUserId.current = id;
    },
    processCall,
    processAccept,
    leave,
    switchCamera,
    toggleCamera,
    toggleMic,
    localMicOn,
    localWebcamOn,
  };

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
