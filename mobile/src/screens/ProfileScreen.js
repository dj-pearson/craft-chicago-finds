import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useAuth} from '../contexts/AuthContext';

const ProfileScreen = ({navigation}) => {
  const {user, signOut} = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    {title: 'My Orders', icon: 'shopping-bag', screen: 'Orders'},
    {title: 'Settings', icon: 'settings', screen: 'Settings'},
    {title: 'Help & Support', icon: 'help-circle', screen: null},
    {title: 'About', icon: 'info', screen: null},
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="user" size={40} color="#8B5CF6" />
        </View>
        <Text style={styles.name}>{user?.email || 'Guest User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}>
            <Icon name={item.icon} size={24} color="#6B7280" />
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Icon name="log-out" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 10,
  },
});

export default ProfileScreen;
