import React from 'react';
import Navigation from './src/Navigation';
import {StatusBar} from 'react-native';
import {WebRTCProvider} from './src/Providers/WebRCTProvider';

const App = () => {
  return (
    <>
      <StatusBar translucent barStyle={'dark-content'} />
      <WebRTCProvider>
        <Navigation />
      </WebRTCProvider>
    </>
  );
};

export default App;
