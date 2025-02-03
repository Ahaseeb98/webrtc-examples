import React from 'react';
import Navigation from './src/Navigation';
import {StatusBar} from 'react-native';

const App = () => {
  return (
    <>
      <StatusBar translucent barStyle={'dark-content'} />
      <Navigation />
    </>
  );
};

export default App;
