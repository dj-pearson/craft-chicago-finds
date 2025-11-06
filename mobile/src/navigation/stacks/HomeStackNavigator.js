import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// Screens
import HomeScreen from '../../screens/HomeScreen';
import ProductDetailScreen from '../../screens/ProductDetailScreen';
import SellerProfileScreen from '../../screens/SellerProfileScreen';

const Stack = createStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{title: 'Craft Chicago Finds'}}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{title: 'Product Details'}}
      />
      <Stack.Screen
        name="SellerProfile"
        component={SellerProfileScreen}
        options={{title: 'Seller Profile'}}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
