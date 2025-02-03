import React, {useCallback, useState} from 'react';
import {Text, View, StyleSheet, Alert} from 'react-native';
import {MMKV} from 'react-native-mmkv';
import {generateUID} from '../Utils/generateUID';
import Input from '../Components/Input';
import Button from '../Components/Button';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NavigationProps} from '../Navigation';

const Home = () => {
  const navigation = useNavigation<NavigationProps>();
  const [myId, setMyId] = useState(generateUID());
  const [otherId, setOtherId] = useState('');
  useFocusEffect(
    useCallback(() => {
      const storage = new MMKV();
      const storedValue = storage.getString('myId');
      if (!storedValue) {
        storage.set('myId', myId);
      } else {
        setMyId(storedValue);
      }
    }, [myId]),
  );

  const handleCallStart = () => {
    if (!otherId) {
      Alert.alert('Other user id is required');
    } else {
      navigation.navigate('Calling', {otherId});
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.myId}>
        <Text style={styles.idText}>Id = {myId}</Text>
      </View>
      <View style={styles.input}>
        <Input value={otherId} onChangeText={setOtherId} />
      </View>
      <View style={styles.input}>
        <Button title="Call" onPress={handleCallStart} />
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  input: {
    margin: 20,
  },
});
