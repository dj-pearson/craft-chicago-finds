import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// Screens
import ProfileScreen from '../../screens/ProfileScreen';
import OrdersScreen from '../../screens/OrdersScreen';
import OrderDetailScreen from '../../screens/OrderDetailScreen';
import SettingsScreen from '../../screens/SettingsScreen';

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{title: 'Profile'}}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{title: 'My Orders'}}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{title: 'Order Details'}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
