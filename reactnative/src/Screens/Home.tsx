import React from 'react';
import {Text, View, StyleSheet} from 'react-native';

const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Home</Text>
    </View>
  );
};

export default Home;

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
