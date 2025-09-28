import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  description: string | null;
  is_active: boolean;
  launch_date: string | null;
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CityContextType {
  currentCity: City | null;
  cities: City[];
  loading: boolean;
  switchCity: (citySlug: string) => void;
  isValidCity: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidCity, setIsValidCity] = useState(false);
  
  const { city: citySlug } = useParams<{ city: string }>();
  const navigate = useNavigate();

  // Fetch all cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("*")
          .order("name");

        if (error) {
          console.error("Error fetching cities:", error);
          return;
        }

        setCities(data || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  // Set current city based on URL param
  useEffect(() => {
    if (cities.length > 0 && citySlug) {
      const city = cities.find(c => c.slug === citySlug);
      if (city) {
        setCurrentCity(city);
        setIsValidCity(true);
      } else {
        setCurrentCity(null);
        setIsValidCity(false);
      }
      setLoading(false);
    } else if (cities.length > 0 && !citySlug) {
      // If no city in URL, default to Chicago if available
      const defaultCity = cities.find(c => c.slug === "chicago") || cities[0];
      setCurrentCity(defaultCity);
      setIsValidCity(true);
      setLoading(false);
    }
  }, [cities, citySlug]);

  const switchCity = (newCitySlug: string) => {
    const city = cities.find(c => c.slug === newCitySlug);
    if (city) {
      navigate(`/${newCitySlug}`);
    }
  };

  const value = {
    currentCity,
    cities,
    loading,
    switchCity,
    isValidCity,
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

export const useCityContext = () => {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error("useCityContext must be used within a CityProvider");
  }
  return context;
};