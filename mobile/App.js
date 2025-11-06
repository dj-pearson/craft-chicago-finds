import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'react-native';

// Context Providers
import {AuthProvider} from './src/contexts/AuthContext';
import {CartProvider} from './src/contexts/CartContext';
import {CityProvider} from './src/contexts/CityContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Styles
import {StyleSheet} from 'react-native';

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <CityProvider>
          <AuthProvider>
            <CartProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </CityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
