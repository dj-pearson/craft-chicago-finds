import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// Screens
import CartScreen from '../../screens/CartScreen';
import CheckoutScreen from '../../screens/CheckoutScreen';

const Stack = createStackNavigator();

const CartStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CartMain"
        component={CartScreen}
        options={{title: 'Shopping Cart'}}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{title: 'Checkout'}}
      />
    </Stack.Navigator>
  );
};

export default CartStackNavigator;
