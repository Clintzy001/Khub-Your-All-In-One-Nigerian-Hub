import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Job, CompanyProfile } from '@/types'
import { JobCard } from './JobCard'
import { JobFilters } from './JobFilters'
import { JobSearchBar } from './JobSearchBar'
import { SavedJobs } from './SavedJobs'
import { JobAlertModal } from './JobAlertModal'
import { 
  Loader2, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Bookmark, 
  Bell,
  SlidersHorizontal,
  X,
  TrendingUp,
  Star,
  Building2
} from 'lucide-react'
import { useInView } from 'react-intersection-observer'

export const JobListingPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedJobs, setShowSavedJobs] = useState(false)
  const [showJobAlert, setShowJobAlert] = useState(false)
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    category: '',
    jobType: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    isRemote: false,
    postedWithin: '', // 1, 3, 7, 14, 30 days
  })
  const [sortBy, setSortBy] = useState('relevance') // relevance, newest, salary_high, salary_low
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalJobs, setTotalJobs] = useState(0)
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])
  const [trendingSearches, setTrendingSearches] = useState([
    'Software Engineer', 'Product Manager', 'Data Analyst', 'Sales Executive', 'Customer Support'
  ])
  const { ref, inView } = useInView()

  const loadJobs = useCallback(async (reset = false) => {
    if (reset) {
      setPage(0)
      setJobs([])
    }

    setLoading(true)
    
    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:company_profiles(*),
        category:job_categories(*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('status', 'active')
      .gte('application_deadline', new Date().toISOString())
      .range(page * 20, (page + 1) * 20 - 1)

    // Apply keyword search
    if (filters.keyword) {
      query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,requirements.cs.{${filters.keyword}}`)
    }

    // Apply location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }

    // Apply job type filter
    if (filters.jobType) {
      query = query.eq('employment_type', filters.jobType)
    }

    // Apply experience level
    if (filters.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel)
    }

    // Apply salary range
    if (filters.salaryMin) {
      query = query.gte('salary_max', parseFloat(filters.salaryMin))
    }
    if (filters.salaryMax) {
      query = query.lte('salary_min', parseFloat(filters.salaryMax))
    }

    // Apply remote filter
    if (filters.isRemote) {
      query = query.eq('is_remote', true)
    }

    // Apply posted within filter
    if (filters.postedWithin) {
      const days = parseInt(filters.postedWithin)
      const date = new Date()
      date.setDate(date.getDate() - days)
      query = query.gte('posted_date', date.toISOString())
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('posted_date', { ascending: false })
        break
      case 'salary_high':
        query = query.order('salary_max', { ascending: false })
        break
      case 'salary_low':
        query = query.order('salary_min', { ascending: true })
        break
      default:
        query = query.order('is_featured', { ascending: false }).order('posted_date', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error loading jobs:', error)
      setLoading(false)
      return
    }

    if (reset) {
      setJobs(data || [])
    } else {
      setJobs(prev => [...prev, ...(data || [])])
    }

    setTotalJobs(count || 0)
    setHasMore((data?.length || 0) === 20)
    setLoading(false)
  }, [page, filters, sortBy])

  const loadFeaturedJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        *,
        company:company_profiles(*)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(5)
      .order('posted_date', { ascending: false })

    setFeaturedJobs(data || [])
  }

  useEffect(() => {
    loadJobs(true)
    loadFeaturedJobs()
  }, [filters, sortBy])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1)
      loadJobs()
    }
  }, [inView])

  const saveJob = async (jobId: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ job_id: jobId })

    if (!error) {
      toast.success('Job saved to your list')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
        <p className="text-primary-100 mb-6">Discover thousands of opportunities across Nigeria</p>
        <JobSearchBar onSearch={(keyword) => setFilters({ ...filters, keyword })} />
      </div>

      <div className="flex gap-6">
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowFilters(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-primary-500 text-white p-3 rounded-full shadow-lg"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Filters Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:w-72
          ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b flex justify-between items-center md:hidden">
            <h2 className="font-semibold">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <JobFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-600">{totalJobs.toLocaleString()} jobs found</p>
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="salary_high">Highest Salary</option>
                <option value="salary_low">Lowest Salary</option>
              </select>
              
              <button
                onClick={() => setShowSavedJobs(true)}
                className="px-3 py-2 border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50"
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </button>
              
              <button
                onClick={() => setShowJobAlert(true)}
                className="px-3 py-2 border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50"
              >
                <Bell className="w-4 h-4" />
                Job Alert
              </button>
            </div>
          </div>

          {/* Featured Jobs Section */}
          {featuredJobs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                Featured Jobs
              </h2>
              <div className="grid gap-4">
                {featuredJobs.map((job) => (
                  <JobCard key={job.id} job={job} featured onSave={() => saveJob(job.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setFilters({ ...filters, keyword: term })}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          {loading && jobs.length === 0 ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onSave={() => saveJob(job.id)} />
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

      {/* Modals */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowFilters(false)} />
      )}
      
      {showSavedJobs && (
        <SavedJobs onClose={() => setShowSavedJobs(false)} />
      )}
      
      {showJobAlert && (
        <JobAlertModal onClose={() => setShowJobAlert(false)} />
      )}
    </div>
  )
}
