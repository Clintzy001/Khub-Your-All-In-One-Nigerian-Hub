import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import OpenStreetMap from '../components/Map/OpenStreetMap';
import { Truck, MapPin, Package, Clock, Navigation } from 'lucide-react';
import { toast } from "sonner"

interface Delivery {
  id: string;
  driver: any;
  pickup_location: any;
  dropoff_location: any;
  status: string;
  price: number;
  tracking_number: string;
  driver_location?: [number, number];
}

export default function Logistics() {
  const { user } = useAuth();
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActiveDeliveries();
      subscribeToDriverLocations();
    }
  }, [user]);

  const fetchActiveDeliveries = async () => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*, driver:profiles(*)')
      .eq('customer_id', user?.id)
      .in('status', ['assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActiveDeliveries(data);
    }
  };

  const subscribeToDriverLocations = () => {
    const subscription = supabase
      .channel('driver-locations')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: `customer_id=eq.${user?.id}` },
        (payload) => {
          const delivery = payload.new as Delivery;
          if (delivery.driver_location) {
            setDriverLocation([
              (delivery.driver_location as any).latitude,
              (delivery.driver_location as any).longitude
            ]);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const requestDelivery = async () => {
    setIsRequesting(true);
    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          customer_id: user?.id,
          pickup_location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current Location'
          },
          dropoff_location: {
            latitude: 0,
            longitude: 0,
            address: 'To be specified'
          },
          price: 500, // Base price
          tracking_number: `KHD-${Date.now()}`,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Delivery requested! Finding a driver...');
      fetchActiveDeliveries();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const mapMarkers = [];
  
  if (selectedDelivery?.dropoff_location) {
    mapMarkers.push({
      position: [selectedDelivery.dropoff_location.latitude, selectedDelivery.dropoff_location.longitude],
      title: 'Dropoff Location',
      description: 'Delivery destination'
    });
  }
  
  if (driverLocation) {
    mapMarkers.push({
      position: driverLocation,
      title: 'Driver Location',
      description: 'Real-time driver position'
    });
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-6">Logistics & Delivery</h1>
      
      {/* Request Delivery Button */}
      <button
        onClick={requestDelivery}
        disabled={isRequesting}
        className="btn-primary w-full mb-8 flex items-center justify-center gap-2"
      >
        <Package className="w-5 h-5" />
        {isRequesting ? 'Requesting...' : 'Request a Delivery'}
      </button>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="order-2 lg:order-1">
          {selectedDelivery ? (
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h3 className="font-semibold mb-3">Live Tracking</h3>
              <OpenStreetMap
                center={driverLocation || [9.081999, 8.675277]}
                zoom={14}
                markers={mapMarkers}
                showRoute={driverLocation && selectedDelivery.dropoff_location}
                routePoints={driverLocation && selectedDelivery.dropoff_location ? [
                  driverLocation,
                  [selectedDelivery.dropoff_location.latitude, selectedDelivery.dropoff_location.longitude]
                ] : []}
                height="500px"
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-2xl h-[500px] flex items-center justify-center">
              <p className="text-gray-500">Select a delivery to track</p>
            </div>
          )}
        </div>
        
        {/* Active Deliveries */}
        <div className="order-1 lg:order-2">
          <h2 className="text-xl font-semibold mb-4">Active Deliveries</h2>
          
          {activeDeliveries.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No active deliveries
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <button
                  key={delivery.id}
                  onClick={() => setSelectedDelivery(delivery)}
                  className={`card p-4 w-full text-left transition ${
                    selectedDelivery?.id === delivery.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <span className="font-semibold">#{delivery.tracking_number}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      delivery.status === 'assigned' ? 'bg-blue-100 text-blue-600' :
                      delivery.status === 'picked_up' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>Pickup: {delivery.pickup_location?.address || 'Selected'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Navigation className="w-4 h-4" />
                      <span>Dropoff: {delivery.dropoff_location?.address || 'Awaiting'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Est. delivery: 30-45 mins</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-primary font-bold">₦{delivery.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
