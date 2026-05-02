import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  Car, Bike, Truck, Bus, Navigation, MapPin, 
  Clock, Wallet, CreditCard, User, Phone, 
  Package, Weight, Box, AlertCircle, Loader2,
  CheckCircle, XCircle, LocateFixed, Search
} from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { calculateDistance, getAddressFromCoordinates } from '@/utils/maps'
import toast from 'react-hot-toast'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type ServiceType = 'ride' | 'delivery'
type VehicleType = 'bike' | 'car' | 'van' | 'truck'

interface LocationPoint {
  lat: number
  lng: number
  address: string
}

export const LogisticsBooking: React.FC = () => {
  const { user } = useAuth()
  const [serviceType, setServiceType] = useState<ServiceType>('ride')
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')
  const [pickup, setPickup] = useState<LocationPoint | null>(null)
  const [dropoff, setDropoff] = useState<LocationPoint | null>(null)
  const [isSearchingPickup, setIsSearchingPickup] = useState(false)
  const [isSearchingDropoff, setIsSearchingDropoff] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [distance, setDistance] = useState<number | null>(null)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [bookingStep, setBookingStep] = useState<'location' | 'details' | 'payment' | 'confirm'>('location')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet')
  const [passengerCount, setPassengerCount] = useState(1)
  const [hasLuggage, setHasLuggage] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [packageDetails, setPackageDetails] = useState({
    description: '',
    weight: '',
    isFragile: false,
    isUrgent: false
  })
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([])
  const [searchingDriver, setSearchingDriver] = useState(false)
  const [foundDriver, setFoundDriver] = useState<any>(null)
  const mapRef = useRef<L.Map | null>(null)

  const { location: userLocation, getLocation } = useGeolocation()

  useEffect(() => {
    if (userLocation && !pickup) {
      setPickup({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: 'Your current location'
      })
    }
  }, [userLocation])

  useEffect(() => {
    if (pickup && dropoff) {
      calculateRoute()
    }
  }, [pickup, dropoff])

  const calculateRoute = async () => {
    if (!pickup || !dropoff) return

    // Calculate distance using Haversine formula
    const dist = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
    setDistance(dist)

    // Estimate duration (assuming average speed of 30km/h in city)
    const estDuration = Math.ceil(dist / 30 * 60)
    setDuration(estDuration)

    // Calculate price based on vehicle type
    const price = await calculatePrice(dist, vehicleType)
    setEstimatedPrice(price)
  }

  const calculatePrice = async (distanceKm: number, vehicle: VehicleType) => {
    const { data: pricing } = await supabase
      .from('ride_pricing')
      .select('*')
      .eq('vehicle_type', vehicle)
      .eq('is_active', true)
      .single()

    if (pricing) {
      let price = pricing.base_fee + (distanceKm * pricing.per_km)
      if (price < pricing.minimum_fee) {
        price = pricing.minimum_fee
      }
      // Add platform fee (15% is added automatically in escrow)
      return Math.ceil(price)
    }
    return Math.ceil(distanceKm * 100 + 500)
  }

  const searchLocation = async (query: string) => {
    if (!query) return
    
    setIsSearchingPickup(true)
    // Using OpenStreetMap Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Nigeria&limit=5`
    )
    const data = await response.json()
    setSearchResults(data)
    setIsSearchingPickup(false)
  }

  const selectLocation = (result: any, type: 'pickup' | 'dropoff') => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    }
    
    if (type === 'pickup') {
      setPickup(location)
    } else {
      setDropoff(location)
    }
    
    setSearchResults([])
    setSearchQuery('')
  }

  const useCurrentLocation = () => {
    getLocation()
  }

  const searchForDriver = async () => {
    setSearchingDriver(true)
    
    // Find nearby available drivers
    const { data: drivers } = await supabase
      .from('driver_locations')
      .select(`
        *,
        profile:profiles!driver_id (*),
        vehicle:driver_vehicles (*)
      `)
      .eq('is_online', true)
      .eq('vehicle_vehicle_type', vehicleType)
      .limit(5)

    if (drivers && drivers.length > 0) {
      // Simulate driver assignment (in production, this would be more sophisticated)
      const assignedDriver = drivers[0]
      setFoundDriver(assignedDriver)
      
      // Create ride request
      await createRideRequest(assignedDriver.driver_id)
    } else {
      toast.error('No drivers available nearby. Please try again.')
      setSearchingDriver(false)
    }
  }

  const createRideRequest = async (driverId: string) => {
    const { data: ride, error } = await supabase
      .from('ride_requests')
      .insert({
        user_id: user?.id,
        driver_id: driverId,
        pickup_address: pickup?.address,
        pickup_coordinates: pickup,
        dropoff_address: dropoff?.address,
        dropoff_coordinates: dropoff,
        distance_km: distance,
        duration_minutes: duration,
        estimated_price: estimatedPrice,
        vehicle_type: vehicleType,
        passenger_count: passengerCount,
        has_luggage: hasLuggage,
        special_instructions: specialInstructions,
        payment_method: paymentMethod,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create ride request')
      setSearchingDriver(false)
    } else {
      // Process payment via escrow
      await processEscrowPayment(ride.id, estimatedPrice!)
      setBookingStep('confirm')
    }
  }

  const processEscrowPayment = async (rideId: string, amount: number) => {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single()

    if (paymentMethod === 'wallet' && wallet.balance < amount) {
      toast.error('Insufficient wallet balance')
      return false
    }

    // Create escrow transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        amount: amount,
        type: 'escrow_hold',
        status: 'pending',
        reference: `ESCROW_${rideId}_${Date.now()}`,
        metadata: {
          ride_id: rideId,
          service_type: 'ride',
          platform_fee_percent: 15
        }
      })
      .select()
      .single()

    if (txError) {
      toast.error('Payment processing failed')
      return false
    }

    // Deduct from wallet if using wallet payment
    if (paymentMethod === 'wallet') {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('user_id', user?.id)
    }

    // Update ride with transaction
    await supabase
      .from('ride_requests')
      .update({ 
        escrow_transaction_id: transaction.id,
        payment_status: 'processing',
        status: 'confirmed'
      })
      .eq('id', rideId)

    toast.success('Ride booked successfully! Driver is on the way.')
    setSearchingDriver(false)
    return true
  }

  const createDeliveryRequest = async () => {
    setLoading(true)
    
    const { data: delivery, error } = await supabase
      .from('delivery_requests')
      .insert({
        user_id: user?.id,
        pickup_address: pickup?.address,
        pickup_coordinates: pickup,
        delivery_address: dropoff?.address,
        delivery_coordinates: dropoff,
        package_description: packageDetails.description,
        package_weight_kg: parseFloat(packageDetails.weight) || 0,
        is_fragile: packageDetails.isFragile,
        is_urgent: packageDetails.isUrgent,
        distance_km: distance,
        estimated_price: estimatedPrice,
        vehicle_type: vehicleType,
        payment_method: paymentMethod,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create delivery request')
      setLoading(false)
    } else {
      await processDeliveryPayment(delivery.id, estimatedPrice!)
    }
  }

  const processDeliveryPayment = async (deliveryId: string, amount: number) => {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single()

    // Create escrow transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        amount: amount,
        type: 'escrow_hold',
        status: 'pending',
        reference: `ESCROW_DEL_${deliveryId}_${Date.now()}`,
        metadata: {
          delivery_id: deliveryId,
          service_type: 'delivery',
          platform_fee_percent: 15
        }
      })
      .select()
      .single()

    if (paymentMethod === 'wallet' && wallet) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('user_id', user?.id)
    }

    await supabase
      .from('delivery_requests')
      .update({ 
        escrow_transaction_id: transaction.id,
        payment_status: 'confirmed',
        status: 'assigned'
      })
      .eq('id', deliveryId)

    toast.success('Delivery request created successfully! Finding a rider...')
    setBookingStep('confirm')
    setLoading(false)
  }

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'bike': return <Bike className="w-6 h-6" />
      case 'car': return <Car className="w-6 h-6" />
      case 'van': return <Truck className="w-6 h-6" />
      case 'truck': return <Truck className="w-6 h-6" />
      default: return <Car className="w-6 h-6" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Booking Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Service Type Toggle */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setServiceType('ride')}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  serviceType === 'ride'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Car className="w-4 h-4 inline mr-2" />
                Ride
              </button>
              <button
                onClick={() => setServiceType('delivery')}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  serviceType === 'delivery'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Delivery
              </button>
            </div>
          </div>

          {/* Location Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-4">Where are you going?</h3>
            
            {/* Pickup Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Pickup Location</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={pickup?.address || ''}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchLocation(e.target.value)
                    }}
                    placeholder="Enter pickup location"
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={useCurrentLocation}
                  className="px-3 py-2 border rounded-md hover:bg-gray-50"
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Dropoff Location</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={dropoff?.address || ''}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchLocation(e.target.value)
                  }}
                  placeholder="Enter destination"
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectLocation(result, isSearchingPickup ? 'pickup' : 'dropoff')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium">{result.display_name.split(',')[0]}</p>
                    <p className="text-xs text-gray-500">{result.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3">Select Vehicle</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['bike', 'car', 'van', 'truck'] as VehicleType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setVehicleType(type)}
                  className={`p-3 border rounded-md text-center transition-colors ${
                    vehicleType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-500'
                      : 'hover:border-gray-300'
                  }`}
                >
                  {getVehicleIcon(type)}
                  <p className="text-sm capitalize mt-1">{type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Service Details */}
          {bookingStep === 'details' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Trip Details</h3>
              
              {serviceType === 'ride' ? (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Passengers</label>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                      className="w-full border rounded-md p-2"
                    >
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hasLuggage}
                        onChange={(e) => setHasLuggage(e.target.checked)}
                      />
                      <span className="text-sm">I have luggage</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Package Description</label>
                    <textarea
                      value={packageDetails.description}
                      onChange={(e) => setPackageDetails({ ...packageDetails, description: e.target.value })}
                      rows={2}
                      className="w-full border rounded-md p-2"
                      placeholder="Describe what you're sending..."
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={packageDetails.weight}
                      onChange={(e) => setPackageDetails({ ...packageDetails, weight: e.target.value })}
                      className="w-full border rounded-md p-2"
                      placeholder="Approximate weight"
                    />
                  </div>
                  
                  <div className="flex gap-3 mb-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={packageDetails.isFragile}
                        onChange={(e) => setPackageDetails({ ...packageDetails, isFragile: e.target.checked })}
                      />
                      <span className="text-sm">Fragile</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={packageDetails.isUrgent}
                        onChange={(e) => setPackageDetails({ ...packageDetails, isUrgent: e.target.checked })}
                      />
                      <span className="text-sm">Urgent</span>
                    </label>
                  </div>
                </>
              )}
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Special Instructions (Optional)</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  className="w-full border rounded-md p-2"
                  placeholder="Any special requests for the driver?"
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          {bookingStep === 'payment' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Payment Method</h3>
              
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'wallet' ? 'border-primary-500 bg-primary-50' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <Wallet className="w-5 h-5" />
                    <div>
                      <p className="font-medium">KHUB Wallet</p>
                      <p className="text-sm text-gray-500">Pay using your wallet balance</p>
                    </div>
                  </div>
                </label>
                
                <label className={`flex items-center justify-between p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    />
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Card Payment</p>
                      <p className="text-sm text-gray-500">Pay with debit/credit card</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {bookingStep !== 'location' && (
              <button
                onClick={() => {
                  if (bookingStep === 'details') setBookingStep('location')
                  else if (bookingStep === 'payment') setBookingStep('details')
                  else if (bookingStep === 'confirm') setBookingStep('payment')
                }}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            )}
            
            {bookingStep === 'location' && pickup && dropoff && (
              <button
                onClick={() => setBookingStep('details')}
                className="flex-1 bg-primary-500 text-white py-2 rounded-md hover:bg-primary-600"
              >
                Continue
              </button>
            )}
            
            {bookingStep === 'details' && (
              <button
                onClick={() => setBookingStep('payment')}
                className="flex-1 bg-primary-500 text-white py-2 rounded-md hover:bg-primary-600"
              >
                Continue to Payment
              </button>
            )}
            
            {bookingStep === 'payment' && (
              <button
                onClick={serviceType === 'ride' ? searchForDriver : createDeliveryRequest}
                disabled={loading || searchingDriver}
                className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(loading || searchingDriver) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {searchingDriver ? 'Finding driver...' : 'Processing...'}
                  </>
                ) : (
                  `Confirm ${serviceType === 'ride' ? 'Ride' : 'Delivery'}`
                )}
              </button>
            )}
          </div>

          {/* Platform Fee Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                15% platform fee applies to all bookings. Your payment is held in escrow until trip completion.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-24">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Trip Route</h3>
              {distance && duration && estimatedPrice && (
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-gray-400" />
                    {distance.toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {duration} mins
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary-500">
                    ₦{estimatedPrice.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="h-96">
              {pickup && dropoff ? (
                <MapContainer
                  center={[pickup.lat, pickup.lng]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  
                  {/* Pickup Marker */}
                  <Marker position={[pickup.lat, pickup.lng]}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                  
                  {/* Dropoff Marker */}
                  <Marker position={[dropoff.lat, dropoff.lng]}>
                    <Popup>Dropoff Location</Popup>
                  </Marker>
                  
                  {/* Route Line */}
                  <Polyline
                    positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
                    pathOptions={{ color: '#5B2EFF', weight: 4 }}
                  />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Enter pickup and dropoff locations to see route</p>
                  </div>
                </div>
              )}
            </div>

            {/* Driver Assignment Status */}
            {searchingDriver && (
              <div className="p-4 bg-blue-50 border-t">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-800">Finding a driver near you...</p>
                    <p className="text-sm text-blue-600">This usually takes 10-30 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Found */}
            {foundDriver && (
              <div className="p-4 bg-green-50 border-t">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Driver Assigned!</p>
                    <p className="text-sm text-green-700">
                      {foundDriver.profile?.full_name} is on the way with a {vehicleType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600">ETA: {duration} mins</p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Screen */}
            {bookingStep === 'confirm' && (
              <div className="p-4 bg-green-100 border-t text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-green-800">Booking Confirmed!</h3>
                <p className="text-green-700 mt-1">
                  Your {serviceType} has been confirmed. Track your driver in real-time.
                </p>
                <button
                  onClick={() => window.location.href = '/trips'}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Track Your Trip
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
