import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CityContext = createContext({});

const CITY_STORAGE_KEY = '@craft_chicago_finds:selected_city';
const DEFAULT_CITY = 'chicago';

export const CityProvider = ({children}) => {
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [loading, setLoading] = useState(true);

  // Load selected city from storage on mount
  useEffect(() => {
    loadCity();
  }, []);

  // Save selected city to storage whenever it changes
  useEffect(() => {
    if (!loading) {
      saveCity();
    }
  }, [selectedCity, loading]);

  const loadCity = async () => {
    try {
      const storedCity = await AsyncStorage.getItem(CITY_STORAGE_KEY);
      if (storedCity) {
        setSelectedCity(storedCity);
      }
    } catch (error) {
      console.error('Error loading city:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCity = async () => {
    try {
      await AsyncStorage.setItem(CITY_STORAGE_KEY, selectedCity);
    } catch (error) {
      console.error('Error saving city:', error);
    }
  };

  const changeCity = city => {
    setSelectedCity(city.toLowerCase());
  };

  const value = {
    selectedCity,
    changeCity,
    loading,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
