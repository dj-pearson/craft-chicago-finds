import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronDown } from "lucide-react";
import { useCityContext } from "@/hooks/useCityContext";

export const CitySelector = () => {
  const { currentCity, cities, switchCity } = useCityContext();

  if (!currentCity) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCity.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Select City</p>
        </div>
        {cities.map((city) => (
          <DropdownMenuItem
            key={city.id}
            onClick={() => city.is_active && switchCity(city.slug)}
            disabled={!city.is_active}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{city.name}, {city.state}</span>
            </div>
            <div className="flex gap-1">
              {city.slug === currentCity.slug && (
                <Badge variant="default" className="text-xs">Current</Badge>
              )}
              {!city.is_active && (
                <Badge variant="secondary" className="text-xs">Soon</Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};