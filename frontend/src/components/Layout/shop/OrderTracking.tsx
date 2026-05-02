import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Package, MapPin, Clock, CheckCircle, Truck, Navigation, Camera } from 'lucide-react'

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface OrderTrackingProps {
  orderId: string
  shipmentId: string
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, shipmentId }) => {
  const [shipment, setShipment] = useState<any>(null)
  const [trackingHistory, setTrackingHistory] = useState<any[]>([])
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    loadShipmentData()
    subscribeToTracking()
  }, [shipmentId])

  const loadShipmentData = async () => {
    const { data } = await supabase
      .from('shipments')
      .select(`
        *,
        tracking_updates (*)
      `)
      .eq('id', shipmentId)
      .single()

    if (data) {
      setShipment(data)
      setTrackingHistory(data.tracking_updates || [])
      
      if (data.current_location?.coordinates) {
        setCurrentLocation([
          data.current_location.coordinates.lat,
          data.current_location.coordinates.lng
        ])
      }
    }
  }

  const subscribeToTracking = () => {
    const subscription = supabase
      .channel(`tracking:${shipmentId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tracking_updates', filter: `shipment_id=eq.${shipmentId}` },
        (payload) => {
          setTrackingHistory(prev => [...prev, payload.new])
          
          if (payload.new.coordinates) {
            setCurrentLocation([
              payload.new.coordinates.lat,
              payload.new.coordinates.lng
            ])
            
            // Animate map to new location
            if (mapRef.current) {
              mapRef.current.flyTo([
                payload.new.coordinates.lat,
                payload.new.coordinates.lng
              ], 15)
            }
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />
      case 'out_for_delivery':
        return <Navigation className="w-5 h-5 text-orange-500" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Order Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    }
    return statusMap[status] || status
  }

  const calculateProgress = () => {
    const steps = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered']
    const currentIndex = steps.indexOf(shipment?.status)
    return (currentIndex / (steps.length - 1)) * 100
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tracking Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Tracking Timeline</h3>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Ordered</span>
                <span>Processing</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </div>
            </div>

            {/* Tracking Updates */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {trackingHistory.map((update, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(update.status)}
                  </div>
                  <div>
                    <p className="font-medium">{getStatusText(update.status)}</p>
                    <p className="text-sm text-gray-600">{update.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(update.timestamp).toLocaleString()}
                    </p>
                    {update.location && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {update.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-3">Delivery Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tracking Number:</span>
                <span className="font-mono">{shipment?.tracking_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Courier:</span>
                <span>{shipment?.courier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span>{new Date(shipment?.estimated_delivery).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Live Tracking</h3>
              <p className="text-sm text-gray-500">Real-time package location</p>
            </div>
            
            <div className="h-96">
              {currentLocation && (
                <MapContainer
                  center={currentLocation}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  whenCreated={(map) => { mapRef.current = map }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Current Location Marker */}
                  <Marker position={currentLocation}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">Current Location</p>
                        <p className="text-sm">{shipment?.current_location?.address}</p>
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Estimated Delivery Area Circle */}
                  {shipment?.status !== 'delivered' && (
                    <Circle
                      center={currentLocation}
                      radius={500}
                      pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                  )}

                  {/* Route Polyline (if destination available) */}
                  {shipment?.order?.shipping_address?.latitude && (
                    <Polyline
                      positions={[
                        currentLocation,
                        [
                          shipment.order.shipping_address.latitude,
                          shipment.order.shipping_address.longitude
                        ]
                      ]}
                      pathOptions={{ color: 'green', weight: 3 }}
                    />
                  )}
                </MapContainer>
              )}
            </div>

            {/* Live Status Updates */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live Tracking Active</span>
                </div>
                <button className="text-primary-500 text-sm flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  Request Proof of Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
