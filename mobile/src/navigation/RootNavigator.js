import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../contexts/AuthContext';

// Navigators
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';

// Screens
import SplashScreen from '../screens/SplashScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const {user, loading} = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {user ? (
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
