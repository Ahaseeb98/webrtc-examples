/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import 'react-native-gesture-handler';

AppRegistry.registerHeadlessTask(
  'RNCallKeepBackgroundMessage',
  () =>
    ({name, callUUID, handle}) => {
      // Make your call here
      console.log(name, callUUID, handle, 'HEADLESS');
      return Promise.resolve();
    },
);

AppRegistry.registerComponent(appName, () => App);
