import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const khubIcon = new L.Icon({
  iconUrl: '/khub-marker.png',
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const rentalIcon = new L.Icon({
  iconUrl: '/rental-marker.png',
  iconSize: [35, 35],
  iconAnchor: [12, 35],
  popupAnchor: [1, -28],
});

const serviceIcon = new L.Icon({
  iconUrl: '/service-marker.png',
  iconSize: [35, 35],
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    description?: string;
    icon?: L.Icon;
  }>;
  showRoute?: boolean;
  routePoints?: [number, number][];
  radius?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  width?: string;
  interactive?: boolean;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!onLocationSelect) return;
    
    map.on('click', (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      // Add temporary marker
      L.marker([e.latlng.lat, e.latlng.lng], { icon: khubIcon })
        .addTo(map)
        .bindPopup('Selected Location')
        .openPopup();
    });
    
    return () => {
      map.off('click');
    };
  }, [map, onLocationSelect]);
  
  return null;
}

// Component to add routing
function RoutingControl({ from, to }: { from: [number, number]; to: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !from || !to) return;
    
    // @ts-ignore
    const routing = L.Routing.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        L.latLng(to[0], to[1])
      ],
      routeWhileDragging: true,
      lineOptions: {
        styles: [{ color: '#5B2EFF', weight: 4, opacity: 0.7 }]
      },
      showAlternatives: false,
      altLineOptions: {
        styles: [{ color: 'black', opacity: 0.15, weight: 9 }]
      },
      geocoder: (L.Control as any).Geocoder.nominatim(),
      router: (L.Routing as any).osm(v1)
    }).addTo(map);
    
    return () => {
      map.removeControl(routing);
    };
  }, [map, from, to]);
  
  return null;
}

export default function OpenStreetMap({
  center,
  zoom = 13,
  markers = [],
  showRoute = false,
  routePoints = [],
  radius,
  onLocationSelect,
  height = '400px',
  width = '100%',
  interactive = true
}: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  return (
    <div style={{ height, width, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        zoomControl={true}
        dragging={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://www.khub.com.ng">KHUB</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Satellite/Street hybrid (optional - uses different provider) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Add user location marker */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={50}
              pathOptions={{ color: '#5B2EFF', fillColor: '#5B2EFF', fillOpacity: 0.2 }}
            />
            <Marker
              position={userLocation}
              icon={khubIcon}
            >
              <Popup>Your Location</Popup>
            </Marker>
          </>
        )}
        
        {/* Add all markers */}
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={marker.position}
            icon={marker.icon || khubIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-dark">{marker.title}</h3>
                {marker.description && (
                  <p className="text-sm text-gray-600 mt-1">{marker.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Add radius circle */}
        {radius && center && (
          <Circle
            center={center}
            radius={radius}
            pathOptions={{ color: '#FF5E2E', fillColor: '#FF5E2E', fillOpacity: 0.1 }}
          />
        )}
        
        {/* Add route between points */}
        {showRoute && routePoints.length >= 2 && (
          <>
            <Polyline
              positions={routePoints}
              color="#5B2EFF"
              weight={4}
              opacity={0.7}
            />
            {routePoints[0] && routePoints[routePoints.length - 1] && (
              <RoutingControl from={routePoints[0]} to={routePoints[routePoints.length - 1]} />
            )}
          </>
        )}
        
        {/* Handle click to select location */}
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>
      
      {/* Location controls */}
      {userLocation && interactive && (
        <button
          onClick={() => {
            const map = (window as any).map;
            if (map) map.setView(userLocation, 15);
          }}
          className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 hover:bg-gray-100 transition z-[1000]"
          style={{ zIndex: 1000 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}
