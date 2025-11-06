import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

// Stack Navigators
import HomeStackNavigator from './stacks/HomeStackNavigator';
import BrowseStackNavigator from './stacks/BrowseStackNavigator';
import CartStackNavigator from './stacks/CartStackNavigator';
import ProfileStackNavigator from './stacks/ProfileStackNavigator';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Browse':
              iconName = 'search';
              break;
            case 'Cart':
              iconName = 'shopping-cart';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}>
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Browse" component={BrowseStackNavigator} />
      <Tab.Screen name="Cart" component={CartStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
