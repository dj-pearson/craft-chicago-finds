import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Craft Chicago Finds</Text>
      <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
