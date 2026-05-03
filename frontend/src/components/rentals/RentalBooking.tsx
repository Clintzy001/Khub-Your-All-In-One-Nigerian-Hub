import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, MapPin, Users, CreditCard, Shield, Check, AlertCircle } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Toaster } from 'sonner'

export const RentalBooking: React.FC = () => {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rental, setRental] = useState<any>(null)
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])

  useEffect(() => {
    loadRental()
    loadUnavailableDates()
  }, [slug])

  const loadRental = async () => {
    const { data } = await supabase
      .from('rentals')
      .select(`
        *,
        owner:profiles!owner_id (
          id,
          full_name,
          avatar_url,
          rating
        )
      `)
      .eq('slug', slug)
      .single()

    setRental(data)
    setLoading(false)
  }

  const loadUnavailableDates = async () => {
    const { data } = await supabase
      .from('rental_availability')
      .select('date')
      .eq('rental_id', rental?.id)
      .eq('is_available', false)

    if (data) {
      setUnavailableDates(data.map(d => new Date(d.date)))
    }
  }

  const calculateNights = () => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    return 0
  }

  const calculateTotal = () => {
    const nights = calculateNights()
    const subtotal = rental?.price * nights
    const serviceFee = subtotal * 0.1 // 10% service fee
    const cleaningFee = 5000
    return {
      subtotal,
      serviceFee,
      cleaningFee,
      total: subtotal + serviceFee + cleaningFee
    }
  }

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book')
      navigate('/login')
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select dates')
      return
    }

    setSubmitting(true)

    const { subtotal, serviceFee, cleaningFee, total } = calculateTotal()
    const nights = calculateNights()

    // Create booking
    const { data: booking, error } = await supabase
      .from('rental_bookings')
      .insert({
        rental_id: rental.id,
        renter_id: user.id,
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        number_of_nights: nights,
        number_of_guests: guests,
        subtotal,
        service_fee: serviceFee,
        cleaning_fee: cleaningFee,
        total_amount: total,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create booking')
      setSubmitting(false)
      return
    }

    // Initialize payment
    const response = await fetch('/api/payments/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        email: user.email,
        metadata: {
          type: 'rental_booking',
          booking_id: booking.id,
          rental_id: rental.id
        }
      })
    })

    const data = await response.json()
    if (data.authorization_url) {
      window.location.href = data.authorization_url
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const { subtotal, serviceFee, cleaningFee, total } = calculateTotal()
  const nights = calculateNights()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rental Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-96">
              <img
                src={rental.images?.[0] || '/placeholder.jpg'}
                alt={rental.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-2">{rental.title}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {rental.city}, {rental.state}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {rental.specifications?.max_guests || '2'} guests
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p>{rental.description}</p>
              </div>
              
              {/* Amenities */}
              {rental.features && rental.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {rental.features.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <div className="mb-4">
              <span className="text-2xl font-bold">₦{rental.price.toLocaleString()}</span>
              <span className="text-gray-600"> / {rental.price_period}</span>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Check-in</label>
              <DatePicker
                selected={checkIn}
                onChange={(date) => setCheckIn(date)}
                selectsStart
                startDate={checkIn}
                endDate={checkOut}
                minDate={new Date()}
                excludeDates={unavailableDates}
                placeholderText="Select date"
                className="w-full border rounded-md p-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Check-out</label>
              <DatePicker
                selected={checkOut}
                onChange={(date) => setCheckOut(date)}
                selectsEnd
                startDate={checkIn}
                endDate={checkOut}
                minDate={checkIn || new Date()}
                excludeDates={unavailableDates}
                placeholderText="Select date"
                className="w-full border rounded-md p-2"
              />
            </div>

            {/* Guests */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Guests</label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full border rounded-md p-2"
              >
                {[1,2,3,4,5,6].map(num => (
                  <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Price Breakdown */}
            {checkIn && checkOut && (
              <div className="border-t pt-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>₦{rental.price.toLocaleString()} x {nights} nights</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>₦{serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>₦{cleaningFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={!checkIn || !checkOut || submitting}
              className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Request to Book'
              )}
            </button>

            <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Your payment is secure and encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
