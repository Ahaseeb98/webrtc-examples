import React from 'react';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import Home from '../Screens/Home';
import Calling from '../Screens/Calling';
import Receiving from '../Screens/Receiving';
import InCall from '../Screens/InCall';
import {NavigationContainer} from '@react-navigation/native';
import {navigationRef} from '../Utils/navigationRef';

export type RootStackParamList = {
  Home: undefined;
  Calling: {
    otherId: string;
  };
  Receiving: {
    otherId: string;
  };
  InCall: {
    otherId: string;
  };
};
export type NavigationProps = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Calling" component={Calling} />
        <Stack.Screen name="Receiving" component={Receiving} />
        <Stack.Screen name="InCall" component={InCall} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
