import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '../Navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: string, params: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
