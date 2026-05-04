import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Mail, Lock, User, Briefcase, Store, Wrench, Home, Truck, Check } from 'lucide-react'

const roles = [
  { id: 'buyer', name: 'Buyer', icon: Store, description: 'Purchase products and services' },
  { id: 'seller', name: 'Seller', icon: Briefcase, description: 'Sell products online' },
  { id: 'service_provider', name: 'Service Provider', icon: Wrench, description: 'Offer services' },
  { id: 'job_lister', name: 'Job Lister', icon: User, description: 'Post job opportunities' },
  { id: 'rental_agent', name: 'Rental Agent', icon: Home, description: 'List properties for rent' },
  { id: 'driver', name: 'Driver', icon: Truck, description: 'Provide delivery/logistics' },
]

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['buyer'])
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleId))
    } else {
      setSelectedRoles([...selectedRoles, roleId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRoles.length === 0) {
      alert('Please select at least one role')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password, fullName, selectedRoles)
      navigate('/login')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join KHUB and start your journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field pl-12"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12"
                placeholder="Create a strong password"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Roles (You can choose multiple)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map((role) => {
                const Icon = role.icon
                const isSelected = selectedRoles.includes(role.id)
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <h3 className="font-semibold mt-2">{role.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? 'Creating account...' : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
