/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback} from 'react';
import {Text, View, StyleSheet} from 'react-native';

import {useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../Navigation';
import IconButton from '../Components/IconButton';
import {useWebRTC} from '../Providers/WebRCTProvider';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type CallingScreenRouteProp = RouteProp<RootStackParamList, 'Calling'>;

const Calling = () => {
  const params = useRoute<CallingScreenRouteProp>();
  const otherUserId = params.params.otherId;
  const {setOtherUserId, processCall, leave} = useWebRTC();
  useFocusEffect(
    useCallback(() => {
      setOtherUserId(otherUserId);
      processCall(otherUserId);
    }, [otherUserId]),
  );
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Calling...</Text>
      <View style={styles.myId}>
        <Text style={styles.idText}>{otherUserId}</Text>
      </View>
      <View style={styles.content}>
        <IconButton
          backgroundColor="red"
          onPress={() => leave()}
          IconComponent={
            <MaterialIcons name="call-end" size={22} color={'#ffffff'} />
          }
        />
      </View>
    </View>
  );
};

export default Calling;

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
