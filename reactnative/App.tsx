import React, {useEffect} from 'react';
import Navigation from './src/Navigation';
import {StatusBar} from 'react-native';
import {WebRTCProvider} from './src/Providers/WebRCTProvider';
import RNCallKeep from 'react-native-callkeep';

const options = {
  ios: {
    appName: 'My app name',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'phone_account_icon',
    additionalPermissions: [],
    // Required to get audio in background when using Android 11
    foregroundService: {
      channelId: 'com.company.my',
      channelName: 'Foreground service for my app',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
};

const App = () => {
  useEffect(() => {
    RNCallKeep.setup(options)
      .then(accepted => {
        console.log(accepted, 'ACCERPTED');
      })
      .catch(error => {
        console.log(error, 'Error');
      });
  }, []);
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
