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
import {Platform} from 'react-native';
import inCallManager from 'react-native-incall-manager';
import {navigate, navigationRef} from '../Utils/navigationRef';
import {MMKV} from 'react-native-mmkv';

const SOCKET_SERVER_URL = 'http://192.168.100.87:3500';

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
      navigate('Receiving', {calleeId: data.roomId});
    });

    socket.current?.on('callAnswered', data => {
      remoteRTCMessage.current = data.rtcMessage;
      peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current),
      );
      navigate('InCall', {});
    });

    socket.current?.on('ICEcandidate', data => {
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
      console.log('CALLLLL');
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

    navigate('InCall', {calleeId: roomId});
  };

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'turn:turnserver.erpaccesspro.com:3478',
          username: 'username1:password1',
          credential: 'username2:password2',
        },
      ],
    });
  };

  const leave = (isSocket?: boolean, roomId?: string) => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    inCallManager.stop();
    if (!isSocket) {
      socket.current?.emit('endCall', {calleeId: otherUserId.current, roomId});
    }
    otherUserId.current = null;
    navigationRef?.canGoBack() && navigationRef?.goBack();
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
