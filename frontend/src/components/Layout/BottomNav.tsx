import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Briefcase, MessageCircle, User } from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/marketplace', label: 'Shop', icon: ShoppingBag },
    { path: '/services', label: 'Services', icon: Briefcase },
    { path: '/messages', label: 'Chat', icon: MessageCircle },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
