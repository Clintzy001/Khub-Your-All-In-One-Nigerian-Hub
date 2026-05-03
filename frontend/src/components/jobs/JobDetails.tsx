import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Job, CompanyProfile, JobApplication } from '@/types'
import { 
  Building2, MapPin, DollarSign, Clock, Briefcase, 
  Bookmark, Share2, CheckCircle, Star, Users, 
  TrendingUp, Award, Globe, Mail, Phone, Calendar,
  FileText, Send, Loader2, AlertCircle, ChevronRight
} from 'lucide-react'
import { Toaster } from 'sonner'

export const JobDetails: React.FC = () => {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [application, setApplication] = useState<Partial<JobApplication>>({
    cover_letter: '',
    resume_url: '',
    expected_salary: 0,
    availability_date: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadJobDetails()
  }, [slug])

  const loadJobDetails = async () => {
    // Load job
    const { data: jobData } = await supabase
      .from('jobs')
      .select(`
        *,
        company:company_profiles(*),
        category:job_categories(*)
      `)
      .eq('slug', slug)
      .single()

    if (jobData) {
      setJob(jobData)
      setCompany(jobData.company)
      
      // Increment view count
      await supabase
        .from('jobs')
        .update({ views_count: (jobData.views_count || 0) + 1 })
        .eq('id', jobData.id)

      // Check if user has applied
      if (user) {
        const { data: application } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', jobData.id)
          .eq('applicant_id', user.id)
          .single()
        
        setHasApplied(!!application)

        // Check if saved
        const { data: saved } = await supabase
          .from('saved_jobs')
          .select('id')
          .eq('job_id', jobData.id)
          .eq('user_id', user.id)
          .single()
        
        setIsSaved(!!saved)
      }

      // Load similar jobs
      const { data: similar } = await supabase
        .from('jobs')
        .select('*, company:company_profiles(*)')
        .eq('category_id', jobData.category_id)
        .neq('id', jobData.id)
        .limit(5)
      
      setSimilarJobs(similar || [])
    }
    
    setLoading(false)
  }

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply for this job')
      navigate('/login')
      return
    }

    setShowApplyForm(true)
  }

  const submitApplication = async () => {
    if (!application.cover_letter) {
      toast.error('Please provide a cover letter')
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('job_applications')
      .insert({
        job_id: job!.id,
        applicant_id: user!.id,
        cover_letter: application.cover_letter,
        resume_url: application.resume_url,
        expected_salary: application.expected_salary,
        availability_date: application.availability_date,
        status: 'pending'
      })

    if (error) {
      toast.error('Failed to submit application')
    } else {
      toast.success('Application submitted successfully!')
      setShowApplyForm(false)
      setHasApplied(true)
      
      // Send notification to employer
      await supabase
        .from('notifications')
        .insert({
          user_id: job!.lister_id,
          type: 'job_application',
          title: 'New Job Application',
          content: `${user.email} applied for ${job!.title}`,
          metadata: { job_id: job!.id, applicant_id: user!.id }
        })
    }
    
    setSubmitting(false)
  }

  const toggleSave = async () => {
    if (!user) {
      toast.error('Please login to save jobs')
      return
    }

    if (isSaved) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('job_id', job!.id)
        .eq('user_id', user.id)
      setIsSaved(false)
      toast.success('Job removed from saved')
    } else {
      await supabase
        .from('saved_jobs')
        .insert({ job_id: job!.id, user_id: user.id })
      setIsSaved(true)
      toast.success('Job saved!')
    }
  }

  const copyJobLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Job link copied!')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="text-gray-500">The job you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Job Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{company?.company_name}</span>
                  <span className="text-gray-300">|</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{company?.rating || 'New'}</span>
                  <span className="text-gray-500">({company?.total_reviews} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location || 'Remote'} {job.is_remote && '(Remote)')
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary_min && job.salary_max ? (
                      `₦${job.salary_min.toLocaleString()} - ₦${job.salary_max.toLocaleString()}`
                    ) : (
                      'Competitive Salary'
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Posted {new Date(job.posted_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.employment_type?.replace('-', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleSave}
                  className={`p-2 rounded-full border transition-colors ${
                    isSaved ? 'bg-primary-500 text-white border-primary-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                <button
                  onClick={copyJobLink}
                  className="p-2 rounded-full border hover:bg-gray-50"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              {hasApplied ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Application Submitted!</p>
                    <p className="text-sm text-green-700">The employer will review your application and contact you</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Apply Now
                </button>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2">
                {job.responsibilities.map((resp, index) => (
                  <li key={index} className="text-gray-700">{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Benefits</h2>
              <div className="grid grid-cols-2 gap-4">
                {job.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">About the Company</h3>
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.company_name} className="w-20 h-20 object-contain mb-4" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <h4 className="font-semibold">{company?.company_name}</h4>
            <p className="text-sm text-gray-600 mt-2">{company?.description}</p>
            
            <div className="mt-4 space-y-2 text-sm">
              {company?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={company.website} target="_blank" className="text-primary-500 hover:underline">
                    {company.website}
                  </a>
                </div>
              )}
              {company?.headquarters && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{company.headquarters}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{company?.company_size || 'N/A'} employees</span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Level</span>
                <span className="font-medium capitalize">{job.experience_level?.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Education Level</span>
                <span className="font-medium">{job.education_level || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Job Type</span>
                <span className="font-medium capitalize">{job.employment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Work Location</span>
                <span className="font-medium capitalize">{job.work_location || 'On-site'}</span>
              </div>
              {job.application_deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Deadline</span>
                  <span className="font-medium text-red-600">
                    {new Date(job.application_deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Required */}
          {job.skills_required && job.skills_required.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-3">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Similar Jobs</h2>
          <div className="grid gap-4">
            {similarJobs.map((similarJob) => (
              <SimilarJobCard key={similarJob.id} job={similarJob} />
            ))}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Apply for {job.title}</h2>
              <p className="text-sm text-gray-600 mt-1">at {company?.company_name}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Cover Letter *</label>
                <textarea
                  value={application.cover_letter}
                  onChange={(e) => setApplication({ ...application, cover_letter: e.target.value })}
                  rows={6}
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-primary-500"
                  placeholder="Why are you interested in this position? What makes you a good fit?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Resume/CV URL</label>
                <input
                  type="url"
                  value={application.resume_url}
                  onChange={(e) => setApplication({ ...application, resume_url: e.target.value })}
                  className="w-full border rounded-md p-3"
                  placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Expected Salary</label>
                <input
                  type="number"
                  value={application.expected_salary}
                  onChange={(e) => setApplication({ ...application, expected_salary: parseFloat(e.target.value) })}
                  className="w-full border rounded-md p-3"
                  placeholder="e.g., 250000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Availability Date</label>
                <input
                  type="date"
                  value={application.availability_date}
                  onChange={(e) => setApplication({ ...application, availability_date: e.target.value })}
                  className="w-full border rounded-md p-3"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowApplyForm(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={submitting}
                className="flex-1 bg-primary-500 text-white py-2 rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
