import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const OrdersScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySubtext}>
          Your order history will appear here
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default OrdersScreen;
