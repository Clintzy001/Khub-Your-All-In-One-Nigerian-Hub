import React from 'react';
import OpenStreetMap from '../Map/OpenStreetMap';

interface ServiceLocationProps {
  providerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  serviceArea?: number;
}

export default function ServiceLocation({ providerLocation, serviceArea = 10 }: ServiceLocationProps) {
  const [userLocation, setUserLocation] = React.useState<[number, number] | null>(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  }, []);

  const markers = [
    {
      position: [providerLocation.latitude, providerLocation.longitude] as [number, number],
      title: 'Service Provider',
      description: providerLocation.address
    }
  ];

  if (userLocation) {
    markers.push({
      position: userLocation,
      title: 'Your Location',
      description: 'Current position'
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Service Location</h3>
      
      <div className="mb-4">
        <p className="text-gray-600 flex items-center gap-2">
          <span className="font-semibold">Address:</span>
          {providerLocation.address}
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Service area: Within {serviceArea}km
        </p>
      </div>
      
      <OpenStreetMap
        center={[providerLocation.latitude, providerLocation.longitude]}
        zoom={13}
        markers={markers}
        radius={serviceArea * 1000}
        height="300px"
      />
      
      {userLocation && (
        <button
          onClick={() => {
            // Get directions
            window.open(`https://www.openstreetmap.org/directions?from=${userLocation[0]},${userLocation[1]}&to=${providerLocation.latitude},${providerLocation.longitude}`);
          }}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Get Directions
        </button>
      )}
    </div>
  );
}
