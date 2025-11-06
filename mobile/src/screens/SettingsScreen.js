import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SettingsScreen = () => {
  const settingsItems = [
    {title: 'Notifications', icon: 'bell'},
    {title: 'Privacy', icon: 'shield'},
    {title: 'Language', icon: 'globe'},
    {title: 'Payment Methods', icon: 'credit-card'},
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.menuContainer}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Icon name={item.icon} size={24} color="#6B7280" />
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 15,
  },
});

export default SettingsScreen;
