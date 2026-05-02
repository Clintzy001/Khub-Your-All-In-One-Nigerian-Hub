export interface User {
  id: string
  email: string
  full_name: string
  bio?: string
  phone?: string
  location?: string
  avatar_url?: string
  cover_url?: string
  roles: string[]
  verification_status: 'pending' | 'verified' | 'rejected'
  rating: number
  trust_score: number
  referral_code: string
  created_at: string
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  condition: string
  location: string
  status: 'pending' | 'approved' | 'rejected'
  ai_risk_score: number
  views: number
  created_at: string
  seller?: User
}

export interface Transaction {
  id: string
  user_id: string
  type: 'funding' | 'withdrawal' | 'transfer' | 'escrow' | 'subscription' | 'commission'
  amount: number
  fee: number
  status: 'pending' | 'completed' | 'failed'
  reference: string
  metadata: any
  created_at: string
}

export interface Service {
  id: string
  provider_id: string
  title: string
  description: string
  category: string
  price: number
  location: string
  images: string[]
  availability: any
  status: string
  created_at: string
}

export interface Job {
  id: string
  employer_id: string
  title: string
  description: string
  category: string
  salary_range: string
  location: string
  job_type: 'full-time' | 'part-time' | 'contract' | 'remote'
  requirements: string[]
  status: string
  created_at: string
}

export interface Rental {
  id: string
  owner_id: string
  type: 'house' | 'shop' | 'car' | 'land'
  title: string
  description: string
  price: number
  location: string
  features: any
  images: string[]
  availability: any
  status: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  metadata: any
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  media_url?: string
  is_read: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: 'free' | 'verified' | 'premium'
  starts_at: string
  expires_at: string
  is_active: boolean
}
