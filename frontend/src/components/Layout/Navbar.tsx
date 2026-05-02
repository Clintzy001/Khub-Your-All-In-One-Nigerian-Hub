import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, User, LogOut, Home, ShoppingBag, Briefcase, Truck, MessageCircle, Bell, Wallet } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { path: '/services', label: 'Services', icon: Briefcase },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/rentals', label: 'Rentals', icon: Home },
    { path: '/logistics', label: 'Logistics', icon: Truck },
  ]

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="font-bold text-xl text-dark">KHUB</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button className="relative p-2 text-gray-600 hover:text-primary">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <Link to="/wallet" className="p-2 text-gray-600 hover:text-primary">
                  <Wallet className="w-6 h-6" />
                </Link>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 hover:text-primary"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </button>
                <button onClick={signOut} className="p-2 text-gray-600 hover:text-red-500">
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-700 hover:text-primary">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary py-2 px-4 text-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t animate-slide-up">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
