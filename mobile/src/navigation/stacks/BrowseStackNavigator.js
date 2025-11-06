import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// Screens
import BrowseScreen from '../../screens/BrowseScreen';
import ProductDetailScreen from '../../screens/ProductDetailScreen';
import CategoryScreen from '../../screens/CategoryScreen';

const Stack = createStackNavigator();

const BrowseStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BrowseMain"
        component={BrowseScreen}
        options={{title: 'Browse Products'}}
      />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={{title: 'Category'}}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{title: 'Product Details'}}
      />
    </Stack.Navigator>
  );
};

export default BrowseStackNavigator;
