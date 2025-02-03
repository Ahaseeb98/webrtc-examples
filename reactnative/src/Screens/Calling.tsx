import React from 'react';
import {Text, View, StyleSheet} from 'react-native';

import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../Navigation';

type CallingScreenRouteProp = RouteProp<RootStackParamList, 'Calling'>;

const Calling = () => {
  const params = useRoute<CallingScreenRouteProp>();
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Calling...</Text>
      <View style={styles.myId}>
        <Text style={styles.idText}>{params.params.otherId}</Text>
      </View>
    </View>
  );
};

export default Calling;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
