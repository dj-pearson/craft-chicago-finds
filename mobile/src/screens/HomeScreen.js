import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useCity} from '../contexts/CityContext';

const HomeScreen = ({navigation}) => {
  const {selectedCity} = useCity();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to {selectedCity}</Text>
        <Text style={styles.subtitle}>
          Discover local artisans and their crafts
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <Text style={styles.placeholderText}>
          Featured products will appear here
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <Text style={styles.placeholderText}>
          Categories will appear here
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Sellers</Text>
        <Text style={styles.placeholderText}>
          Featured sellers will appear here
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
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
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

export default HomeScreen;
