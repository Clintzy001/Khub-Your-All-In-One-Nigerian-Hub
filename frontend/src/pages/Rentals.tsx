import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OpenStreetMap from '../components/Map/OpenStreetMap';
import { Home, Car, Store, MapPin, DollarSign, Bed, Bath, Maximize } from 'lucide-react';

interface Rental {
  id: string;
  type: 'house' | 'shop' | 'car' | 'land';
  title: string;
  description: string;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  features: any;
  images: string[];
  owner: any;
}

export default function Rentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.081999, 8.675277]); // Nigeria center

  useEffect(() => {
    fetchRentals();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          setMapCenter(location);
          filterByProximity(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchRentals = async () => {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, owner:profiles(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRentals(data);
      setFilteredRentals(data);
    }
    setLoading(false);
  };

  const filterByProximity = (location: [number, number]) => {
    const filtered = rentals.filter(rental => {
      if (!rental.latitude || !rental.longitude) return true;
      
      const distance = calculateDistance(
        location[0], location[1],
        rental.latitude, rental.longitude
      );
      
      return distance <= searchRadius;
    });
    
    setFilteredRentals(filtered);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'house': return <Home className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'shop': return <Store className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const mapMarkers = filteredRentals.map(rental => ({
    position: [rental.latitude || 9.081999, rental.longitude || 8.675277] as [number, number],
    title: rental.title,
    description: `₦${rental.price.toLocaleString()}/month`,
    icon: undefined
  }));

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-6">Rentals</h1>
      
      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {['all', 'house', 'shop', 'car', 'land'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-6 py-2 rounded-full font-semibold transition whitespace-nowrap ${
              selectedType === type
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Location Filter</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm">Radius:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm font-semibold">{searchRadius}km</span>
              </div>
            </div>
            <OpenStreetMap
              center={mapCenter}
              zoom={12}
              markers={mapMarkers}
              radius={searchRadius * 1000}
              height="500px"
            />
          </div>
        </div>

        {/* Listings Section */}
        <div className="order-1 lg:order-2">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRentals
                .filter(r => selectedType === 'all' || r.type === selectedType)
                .map((rental) => (
                  <Link to={`/rental/${rental.id}`} key={rental.id} className="card block">
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={rental.images[0] || '/placeholder-rental.jpg'}
                          alt={rental.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getIcon(rental.type)}
                              <span className="text-xs text-gray-500 capitalize">{rental.type}</span>
                            </div>
                            <h3 className="font-semibold text-lg">{rental.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="w-4 h-4" />
                              <span>{rental.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-bold">₦{rental.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">/month</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 mt-3 text-sm text-gray-600">
                          {rental.type === 'house' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Bed className="w-4 h-4" /> {rental.features?.bedrooms || 0} beds
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath className="w-4 h-4" /> {rental.features?.bathrooms || 0} baths
                              </span>
                              <span className="flex items-center gap-1">
                                <Maximize className="w-4 h-4" /> {rental.features?.sqft || 0} sqft
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
