import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { ProductFilters } from './ProductFilters'
import { SearchBar } from '../common/SearchBar'
import { Loader2, Grid, List, SlidersHorizontal, X } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

interface ProductCatalogProps {
  category?: string
  searchQuery?: string
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ category, searchQuery: propSearchQuery }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    condition: '',
    rating: '',
    sortBy: 'newest'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const { ref, inView } = useInView()

  const loadProducts = useCallback(async (reset = false) => {
    if (reset) {
      setPage(0)
      setProducts([])
    }

    setLoading(true)
    
    let query = supabase
      .from('products')
      .select(`
        *,
        seller:profiles!seller_id (
          id,
          full_name,
          avatar_url,
          rating,
          verification_status
        ),
        category:categories (*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .range(page * 20, (page + 1) * 20 - 1)

    // Apply filters
    if (propSearchQuery) {
      query = query.or(`title.ilike.%${propSearchQuery}%,description.ilike.%${propSearchQuery}%`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice))
    }

    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice))
    }

    if (filters.condition) {
      query = query.eq('condition', filters.condition)
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
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error loading products:', error)
      setLoading(false)
      return
    }

    if (reset) {
      setProducts(data || [])
    } else {
      setProducts(prev => [...prev, ...(data || [])])
    }

    setTotalProducts(count || 0)
    setHasMore((data?.length || 0) === 20)
    setLoading(false)
  }, [page, filters, category, propSearchQuery])

  useEffect(() => {
    loadProducts(true)
  }, [filters, category, propSearchQuery])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1)
      loadProducts()
    }
  }, [inView])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {category ? category : 'All Products'}
          </h1>
          <p className="text-gray-500 mt-1">{totalProducts} products found</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-80">
            <SearchBar 
              placeholder="Search products..."
              onSearch={() => {}}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden px-4 py-2 border rounded-md flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          
          <div className="hidden md:flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:w-64
          ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b flex justify-between items-center md:hidden">
            <h2 className="font-semibold">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <ProductFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className={`
                grid gap-6
                ${viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
                }
              `}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
              
              {hasMore && (
                <div ref={ref} className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Overlay for mobile filters */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  )
}
