import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ShoppingBag, Briefcase, Home, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
]

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-500">
              KHUB
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="text-gray-700 hover:text-primary-500">
                {item.label}
              </Link>
            ))}
            <Link to="/login" className="px-4 py-2 text-primary-500 border border-primary-500 rounded-md hover:bg-primary-50">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn('md:hidden', isOpen ? 'block' : 'hidden')}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              {item.label}
            </Link>
          ))}
          <Link to="/login" className="block px-3 py-2 text-primary-500 hover:bg-gray-100 rounded-md">
            Login
          </Link>
          <Link to="/signup" className="block px-3 py-2 bg-primary-500 text-white rounded-md">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  )
}
