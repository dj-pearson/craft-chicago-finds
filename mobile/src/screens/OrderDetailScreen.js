import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const OrderDetailScreen = ({route}) => {
  const {orderId} = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order #{orderId}</Text>
        <Text style={styles.placeholderText}>
          Order details will appear here
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
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default OrderDetailScreen;
