import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

interface ProtectedKForceRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export const ProtectedKForceRoute: React.FC<ProtectedKForceRouteProps> = ({ 
  children, 
  allowedRoles = ['super_admin', 'admin', 'moderator', 'support', 'finance'] 
}) => {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [staff, setStaff] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('kforce_token')
    
    if (!token) {
      setAuthorized(false)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/kforce/auth/verify', {
        headers: { 'x-staff-token': token }
      })
      
      const data = await response.json()
      
      if (data.success && allowedRoles.includes(data.staff.role)) {
        setStaff(data.staff)
        setAuthorized(true)
      } else {
        setAuthorized(false)
        localStorage.removeItem('kforce_token')
        localStorage.removeItem('kforce_staff')
      }
    } catch (error) {
      setAuthorized(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to="/kforce/login" replace />
  }

  return <>{children}</>
}
