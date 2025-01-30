import React from 'react';
import {Text, View, StyleSheet} from 'react-native';

const InCall = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>InCall</Text>
    </View>
  );
};

export default InCall;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
