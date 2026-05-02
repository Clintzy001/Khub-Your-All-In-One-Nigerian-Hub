import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingBag, Briefcase, Home, Truck, TrendingUp, Shield, Users, Zap } from 'lucide-react'
import type { Product, Service } from '../types'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [featuredServices, setFeaturedServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedItems()
  }, [])

  const fetchFeaturedItems = async () => {
    try {
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, seller:profiles(*)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('services')
          .select('*, provider:profiles(*)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (productsRes.data) setFeaturedProducts(productsRes.data)
      if (servicesRes.data) setFeaturedServices(servicesRes.data)
    } catch (error) {
      console.error('Error fetching featured items:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661', icon: ShoppingBag },
    { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050', icon: ShoppingBag },
    { name: 'Services', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216', icon: Briefcase },
    { name: 'Properties', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa', icon: Home },
  ]

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-secondary text-white py-20">
        <div className="container-custom relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Everything You Need, One Platform
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Buy, sell, hire, rent, and deliver - all in one secure marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/marketplace" className="bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition text-center">
                Start Shopping
              </Link>
              <Link to="/signup" className="border-2 border-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition text-center">
                Join as Seller
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose KHUB?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Secure Escrow', desc: 'Your payments are protected' },
              { icon: Users, title: 'Verified Users', desc: 'KYC verified community' },
              { icon: Zap, title: 'Real-time', desc: 'Instant notifications & chat' },
              { icon: TrendingUp, title: 'Grow Business', desc: 'Reach more customers' },
            ].map((feature, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition">
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <Link to="/marketplace" className="text-primary hover:underline">View All →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className="card group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/400x300'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                    <p className="text-primary font-bold">₦{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{product.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-8">Join thousands of users already thriving on KHUB</p>
          <Link to="/signup" className="bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition inline-block">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  )
}
