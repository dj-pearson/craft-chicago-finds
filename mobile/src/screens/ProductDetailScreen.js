import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useCart} from '../contexts/CartContext';

const ProductDetailScreen = ({navigation, route}) => {
  const {addToCart} = useCart();
  const {productId} = route.params || {};

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', productId);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.imageContainer}>
          <Text style={styles.placeholderText}>Product Image</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Product Name</Text>
          <Text style={styles.price}>$0.00</Text>
          <Text style={styles.description}>
            Product description will appear here
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <TouchableOpacity
            style={styles.sellerButton}
            onPress={() => navigation.navigate('SellerProfile')}>
            <Text style={styles.sellerButtonText}>View Seller Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Icon name="shopping-cart" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  sellerButton: {
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sellerButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ProductDetailScreen;
