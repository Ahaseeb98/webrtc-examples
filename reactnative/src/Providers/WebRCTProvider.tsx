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
import {AppState} from 'react-native';
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
    foregroundService: {
      channelId: 'call',
      channelName: 'Foreground service for my app',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
};

const SOCKET_SERVER_URL = 'http://192.168.100.180:3500';

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
  joinRoom: (roomId: string) => void;
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
  const currentRoomId = useRef<string | null>(null);

  useEffect(() => {
    const storage = new MMKV();
    const storedValue = storage.getString('myId');
    if (!storedValue) {
      const newId = Math.random().toString(36).substring(7);
      storage.set('myId', newId);
      setMyId(newId);
    } else {
      setMyId(storedValue);
    }
  }, []);

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
      if (pendingCallId === callUUID) {
        await processAccept(callUUID);
        RNCallKeep.backToForeground();
        storage.delete('pendingCall');
      }
    });

    RNCallKeep.addEventListener('endCall', ({callUUID}) => {
      leave(true, callUUID);
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
        console.log('CallKeep setup error:', error);
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
      console.log('Call ended by remote party');
      leave(true);
    });

    socket.current?.on(
      'incomingCall',
      (data: {callerId: string; roomId: string}) => {
        otherUserId.current = data.callerId;
        currentRoomId.current = data.roomId;

        const callUUID = data.roomId;
        const storage = new MMKV();
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
            'App is in the foreground. Navigating to receiving screen.',
          );
          navigate('Receiving', {otherId: data.callerId, roomId: data.roomId});
        }
      },
    );

    socket.current?.on(
      'inviteResponse',
      async (data: {accepted: boolean; roomId: string}) => {
        if (data.accepted) {
          // Join the room first

          currentRoomId.current = data.roomId;

          // Then proceed with call setup
          if (remoteRTCMessage.current) {
            await peerConnection.current?.setRemoteDescription(
              new RTCSessionDescription(remoteRTCMessage.current),
            );
          }
          navigate('InCall', {roomId: data.roomId});
        } else {
          leave(true, data.roomId);
        }
      },
    );

    // Add room joined confirmation handler
    socket.current?.on('roomJoined', (roomId: string) => {
      console.log(`Successfully joined room: ${roomId}`);
      // You can add any additional logic needed after joining
    });

    socket.current?.on('signal', (data: {type: string; data: any}) => {
      console.log('SIGNAL', 'type', data);
      if (data.type === 'ice-candidate') {
        peerConnection.current
          ?.addIceCandidate(new RTCIceCandidate(data.data))
          .catch(e => console.error('Error adding ICE candidate:', e));
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
      inCallManager.start({media: 'video'});

      if (peerConnection.current) {
        stream.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      throw error;
    }
  };

  const processCall = async (roomId: string) => {
    try {
      if (!peerConnection.current) {
        initializePeerConnection();
      }
      await setupMediaStream();

      // Join the room first
      socket.current?.emit('joinRoom', {roomId});
      currentRoomId.current = roomId;

      // Then create and send offer
      const offer = await peerConnection.current?.createOffer({});
      await peerConnection.current?.setLocalDescription(offer);

      socket.current?.emit('inviteToCall', {
        calleeId: otherUserId.current,
        roomId,
      });

      // Send the offer as a signal
      socket.current?.emit('signal', {
        roomId,
        type: 'offer',
        data: offer,
      });
    } catch (error) {
      console.error('Error in processCall:', error);
      leave(false, roomId);
    }
  };

  const processAccept = async (roomId: string) => {
    try {
      if (!peerConnection.current) {
        initializePeerConnection();
      }
      await setupMediaStream();

      // Join the room first
      socket.current?.emit('joinRoom', {roomId});
      currentRoomId.current = roomId;

      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current),
      );

      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);

      socket.current?.emit('inviteResponse', {
        callerId: otherUserId.current,
        accepted: true,
        roomId,
      });

      // Send the answer as a signal
      socket.current?.emit('signal', {
        roomId,
        type: 'answer',
        data: answer,
      });

      navigate('InCall', {roomId});
    } catch (error) {
      console.error('Error in processAccept:', error);
      leave(false, roomId);
    }
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
      if (event.candidate && currentRoomId.current) {
        socket.current?.emit('signal', {
          roomId: currentRoomId.current,
          type: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    // @ts-ignore
    peerConnection.current.ontrack = event => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
  };

  const leave = (isSocket?: boolean, roomId?: string) => {
    const roomToLeave = roomId || currentRoomId.current;

    if (roomToLeave) {
      // Leave the room on socket.io
      socket.current?.emit('leaveRoom', {roomId: roomToLeave});
    }
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());

    peerConnection.current?.getTransceivers().forEach(transceiver => {
      transceiver.stop();
    });
    peerConnection.current?.close();
    peerConnection.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    inCallManager.stop();

    if (!isSocket && roomToLeave) {
      socket.current?.emit('endCall', {roomId: roomToLeave});
      RNCallKeep.endCall(roomToLeave);
    }

    currentRoomId.current = null;
    otherUserId.current = null;

    setTimeout(() => {
      navigationRef?.navigate('Home');
    }, 500);
  };

  const switchCamera = () => {
    localStream?.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  const toggleCamera = () => {
    const newState = !localWebcamOn;
    setLocalWebcamOn(newState);
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = newState;
    });
  };

  const toggleMic = () => {
    const newState = !localMicOn;
    setLocalMicOn(newState);
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = newState;
    });
  };
  const joinRoom = (roomId: string) => {
    console.log('JOIN_ROOM');
    socket.current?.emit('joinRoom', {roomId});
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
    joinRoom,
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
