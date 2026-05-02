import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Rental } from '@/types'
import { RentalCard } from './RentalCard'
import { RentalFilters } from './RentalFilters'
import { RentalMap } from './RentalMap'
import { 
  Home, Building2, Store, Warehouse, Car, 
  Wrench, Calendar, MapPin, SlidersHorizontal, 
  Grid, List, Filter, ChevronDown, Loader2 
} from 'lucide-react'
import { useInView } from 'react-intersection-observer'

const propertyTypes = [
  { value: 'house', label: 'Houses', icon: Home },
  { value: 'apartment', label: 'Apartments', icon: Building2 },
  { value: 'shop', label: 'Shops', icon: Store },
  { value: 'office', label: 'Offices', icon: Building2 },
  { value: 'warehouse', label: 'Warehouses', icon: Warehouse },
  { value: 'land', label: 'Land', icon: MapPin },
  { value: 'car', label: 'Cars', icon: Car },
  { value: 'equipment', label: 'Equipment', icon: Wrench },
  { value: 'hall', label: 'Halls', icon: Calendar },
]

export const RentalListingPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    features: [] as string[],
    sortBy: 'newest'
  })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()

  const loadRentals = useCallback(async (reset = false) => {
    if (reset) {
      setPage(0)
      setRentals([])
    }

    setLoading(true)
    
    let query = supabase
      .from('rentals')
      .select(`
        *,
        owner:profiles!owner_id (
          id,
          full_name,
          avatar_url,
          rating,
          verification_status
        )
      `, { count: 'exact' })
      .eq('is_available', true)
      .eq('verification_status', 'approved')
      .range(page * 20, (page + 1) * 20 - 1)

    // Filter by property type
    if (selectedType !== 'all') {
      query = query.eq('asset_type', selectedType)
    }

    // Apply filters
    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice))
    }
    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice))
    }
    if (filters.location) {
      query = query.ilike('city', `%${filters.location}%`)
        .or(`state.ilike.%${filters.location}%`)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true })
        break
      case 'price_high':
        query = query.order('price', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error loading rentals:', error)
      setLoading(false)
      return
    }

    if (reset) {
      setRentals(data || [])
    } else {
      setRentals(prev => [...prev, ...(data || [])])
    }

    setHasMore((data?.length || 0) === 20)
    setLoading(false)
  }, [page, selectedType, filters])

  useEffect(() => {
    loadRentals(true)
  }, [selectedType, filters])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1)
      loadRentals()
    }
  }, [inView])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Perfect Space</h1>
        <p className="text-gray-600">Discover thousands of properties for rent across Nigeria</p>
      </div>

      {/* Property Type Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
              selectedType === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Home className="w-4 h-4" />
            All Properties
          </button>
          {propertyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                selectedType === type.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by city, state, or landmark..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <div className="border rounded-md overflow-hidden flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <RentalFilters filters={filters} onFilterChange={setFilters} />
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">{rentals.length} properties found</p>
      </div>

      {/* Content Display */}
      {viewMode === 'map' ? (
        <div className="h-[600px] rounded-lg overflow-hidden">
          <RentalMap rentals={rentals} />
        </div>
      ) : (
        <>
          {loading && rentals.length === 0 ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {rentals.map((rental) => (
                <RentalCard key={rental.id} rental={rental} viewMode={viewMode} />
              ))}
            </div>
          )}
          
          {hasMore && (
            <div ref={ref} className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
