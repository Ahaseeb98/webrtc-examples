/* eslint-disable react-native/no-inline-styles */
import React, {useCallback} from 'react';
import {Text, View, StyleSheet, Platform} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RouteProp, useFocusEffect, useRoute} from '@react-navigation/native';
import inCallManager from 'react-native-incall-manager';
import {useWebRTC} from './../Providers/WebRCTProvider';
import IconButton from '../Components/IconButton';
import {RootStackParamList} from '../Navigation';

type CallingScreenRouteProp = RouteProp<RootStackParamList, 'Calling'>;

const InCall = () => {
  const params = useRoute<CallingScreenRouteProp>();
  const otherUserId = params.params.otherId;
  const {
    localStream,
    remoteStream,
    leave,
    switchCamera,
    toggleCamera,
    toggleMic,
    localMicOn,
    localWebcamOn,
  } = useWebRTC();

  useFocusEffect(
    useCallback(() => {
      inCallManager.start();
      inCallManager.setKeepScreenOn(true);
      inCallManager.setForceSpeakerphoneOn(true);
      return () => {
        inCallManager.stop();
      };
    }, []),
  );

  console.log(remoteStream, 'REMOTE', Platform.Version);

  return (
    <View style={styles.container}>
      <View style={{flex: 1, zIndex: 10}}>
        {remoteStream ? (
          <RTCView
            objectFit={'cover'}
            style={styles.remoteStream}
            streamURL={remoteStream.toURL()}
          />
        ) : (
          <View style={styles.paused}>
            <Text style={{color: '#fff'}}>Remote video is paused</Text>
          </View>
        )}
        {localStream && localWebcamOn ? (
          <RTCView
            objectFit={'cover'}
            style={styles.localStream}
            streamURL={localStream.toURL()}
          />
        ) : (
          <></>
        )}
      </View>

      {/* Controls */}
      <View
        style={{
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          backgroundColor: '#222',
        }}>
        <IconButton
          onPress={() => leave(false, otherUserId)}
          IconComponent={
            <MaterialIcons name="call-end" size={22} color="#FFF" />
          }
        />
        <IconButton
          style={{
            backgroundColor: !localMicOn ? '#fff' : 'transparent',
          }}
          onPress={toggleMic}
          IconComponent={
            localMicOn ? (
              <MaterialIcons name="mic" size={22} color="#FFF" />
            ) : (
              <MaterialIcons name="mic-off" size={22} color="#1D2939" />
            )
          }
        />
        <IconButton
          style={{
            backgroundColor: !localWebcamOn ? '#fff' : 'transparent',
          }}
          onPress={toggleCamera}
          IconComponent={
            localWebcamOn ? (
              <MaterialIcons name="videocam" size={22} color="#FFF" />
            ) : (
              <MaterialIcons name="videocam-off" size={22} color="#1D2939" />
            )
          }
        />
        <IconButton
          disabled={!localWebcamOn}
          onPress={switchCamera}
          IconComponent={
            <MaterialIcons name="cameraswitch" size={22} color="#FFF" />
          }
        />
      </View>
    </View>
  );
};

export default InCall;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  remoteStream: {
    flex: 1,
    backgroundColor: '#050A0E',
    marginTop: 8,
    width: '100%',
  },
  localStream: {
    backgroundColor: '#050A0E',
    marginTop: 8,
    width: 100,
    height: 200,
    borderRadius: 10,
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  paused: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
});
