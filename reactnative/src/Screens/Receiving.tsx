import React, {useCallback} from 'react';
import {Text, View, StyleSheet} from 'react-native';

import {useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../Navigation';
import IconButton from '../Components/IconButton';
import {useWebRTC} from '../Providers/WebRCTProvider';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type ReceivingScreenRouteProp = RouteProp<RootStackParamList, 'Receiving'>;

const Receiving = () => {
  const params = useRoute<ReceivingScreenRouteProp>();
  const otherUserId = params.params.otherId;
  const roomId = params.params.roomId;
  const {processAccept, joinRoom} = useWebRTC();
  useFocusEffect(
    useCallback(() => {
      joinRoom(roomId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]),
  );
  console.log(params.params, 'params.params');
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Call from..</Text>
      <View style={styles.myId}>
        <Text style={styles.idText}>{otherUserId}</Text>
      </View>
      <View style={styles.content}>
        <IconButton
          backgroundColor="green"
          onPress={() => processAccept(roomId)}
          IconComponent={
            <MaterialIcons name="call" size={22} color={'#ffffff'} />
          }
        />
      </View>
    </View>
  );
};

export default Receiving;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  idText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  myId: {
    backgroundColor: 'lightgrey',
    padding: 20,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
});
