import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Profile, UserSkill, UserExperience, UserEducation } from '@/types'
import { 
  Camera, MapPin, Briefcase, GraduationCap, Globe, 
  Mail, Phone, Calendar, Star, Users, Edit2, 
  Settings, Heart, ShoppingBag, FileText, Award,
  Plus, Trash2, Save, X, Linkedin, Twitter, Github,
  Languages, Trophy, Clock, CheckCircle, Building2
} from 'lucide-react'
import { Toaster } from 'sonner';

export const UserProfile: React.FC = () => {
  const { username } = useParams()
  const { user, profile: currentUser } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [experiences, setExperiences] = useState<UserExperience[]>([])
  const [education, setEducation] = useState<UserEducation[]>([])
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [languages, setLanguages] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [uploading, setUploading] = useState(false)

  const isOwnProfile = user?.id === profile?.id

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    // Load profile
    let query = supabase
      .from('profiles')
      .select('*')
      
    if (username) {
      query = query.eq('username', username)
    } else if (user) {
      query = query.eq('id', user.id)
    }
    
    const { data: profileData } = await query.single()
    
    if (profileData) {
      setProfile(profileData)
      setEditForm(profileData)
      
      // Load skills
      const { data: skillsData } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', profileData.id)
      setSkills(skillsData || [])
      
      // Load experiences
      const { data: expData } = await supabase
        .from('user_experiences')
        .select('*')
        .eq('user_id', profileData.id)
        .order('start_date', { ascending: false })
      setExperiences(expData || [])
      
      // Load education
      const { data: eduData } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', profileData.id)
        .order('start_date', { ascending: false })
      setEducation(eduData || [])
      
      // Load languages
      const { data: langData } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', profileData.id)
      setLanguages(langData || [])
    }
    
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    const fileName = `${user?.id}_${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)
      
    if (uploadError) {
      toast.error('Failed to upload image')
      setUploading(false)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
      
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user?.id)
      
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    toast.success('Profile picture updated!')
    setUploading(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    const fileName = `cover_${user?.id}_${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, file)
      
    if (uploadError) {
      toast.error('Failed to upload cover image')
      setUploading(false)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('covers')
      .getPublicUrl(fileName)
      
    await supabase
      .from('profiles')
      .update({ cover_image_url: publicUrl })
      .eq('id', user?.id)
      
    setProfile(prev => prev ? { ...prev, cover_image_url: publicUrl } : null)
    toast.success('Cover image updated!')
    setUploading(false)
  }

  const saveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        bio: editForm.bio,
        phone: editForm.phone,
        location: editForm.location,
        headline: editForm.headline,
        website: editForm.website,
        social_links: editForm.social_links
      })
      .eq('id', user?.id)
      
    if (error) {
      toast.error('Failed to update profile')
    } else {
      setProfile(prev => prev ? { ...prev, ...editForm } : null)
      setIsEditing(false)
      toast.success('Profile updated!')
    }
  }

  const addExperience = async () => {
    const { data, error } = await supabase
      .from('user_experiences')
      .insert({
        user_id: user?.id,
        job_title: 'New Position',
        company_name: 'Company Name',
        start_date: new Date().toISOString().split('T')[0],
        is_current: false
      })
      .select()
      .single()
      
    if (!error && data) {
      setExperiences([data, ...experiences])
    }
  }

  const updateExperience = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('user_experiences')
      .update(updates)
      .eq('id', id)
      
    if (!error) {
      setExperiences(prev => prev.map(exp => 
        exp.id === id ? { ...exp, ...updates } : exp
      ))
      toast.success('Experience updated')
    }
  }

  const deleteExperience = async (id: string) => {
    const { error } = await supabase
      .from('user_experiences')
      .delete()
      .eq('id', id)
      
    if (!error) {
      setExperiences(prev => prev.filter(exp => exp.id !== id))
      toast.success('Experience removed')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-gray-500">The profile you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-64 bg-gradient-to-r from-primary-500 to-primary-700">
        {profile.cover_image_url && (
          <img 
            src={profile.cover_image_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded-md cursor-pointer hover:bg-black/70">
            <Camera className="w-4 h-4 inline mr-2" />
            Change Cover
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-20 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-4xl text-primary-500 font-bold">
                        {profile.full_name?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-gray-600">{profile.headline || 'Member of KHUB'}</p>
                <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
                  {profile.location && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    {profile.rating} rating
                  </span>
                </div>
              </div>
            </div>
            
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 md:mt-0 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-6 overflow-x-auto">
            {['overview', 'experiences', 'education', 'skills', 'portfolio', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary-500 text-primary-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bio */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">About</h2>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={6}
                      className="w-full border rounded-md p-3"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {profile.bio || 'No bio added yet.'}
                    </p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    {profile.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <a href={profile.website} target="_blank" className="text-primary-500 hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sidebar Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold mb-3">Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since</span>
                      <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total listings</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviews</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>
                
                {/* Skills Summary */}
                {skills.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold mb-3">Top Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 5).map((skill) => (
                        <span key={skill.id} className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                          {skill.skill_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'experiences' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                {isOwnProfile && (
                  <button
                    onClick={addExperience}
                    className="text-primary-500 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {experiences.map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    isEditing={isOwnProfile}
                    onUpdate={(updates) => updateExperience(exp.id, updates)}
                    onDelete={() => deleteExperience(exp.id)}
                  />
                ))}
                
                {experiences.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No work experience added yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Education</h2>
                {isOwnProfile && (
                  <button className="text-primary-500 flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Add Education
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {education.map((edu) => (
                  <EducationCard key={edu.id} education={edu} isEditing={isOwnProfile} />
                ))}
                
                {education.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No education history added yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Skills & Expertise</h2>
                {isOwnProfile && (
                  <button className="text-primary-500 flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Add Skill
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="bg-gray-100 rounded-lg p-3">
                    <div className="font-medium">{skill.skill_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-sm text-gray-600">
                        {Array(skill.proficiency_level).fill('⭐').join('')}
                      </div>
                      <span className="text-xs text-gray-500">
                        {skill.years_experience} years
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Mode Save Button */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={saveProfile}
            className="bg-primary-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-600 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

// Sub-components
const ExperienceCard: React.FC<{
  experience: UserExperience
  isEditing: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
}> = ({ experience, isEditing, onUpdate, onDelete }) => {
  const [isEditingExp, setIsEditingExp] = useState(false)
  const [form, setForm] = useState(experience)

  if (isEditingExp) {
    return (
      <div className="border rounded-lg p-4">
        <input
          type="text"
          value={form.job_title}
          onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          className="w-full border rounded-md p-2 mb-2"
          placeholder="Job Title"
        />
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          className="w-full border rounded-md p-2 mb-2"
          placeholder="Company"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              onUpdate(form)
              setIsEditingExp(false)
            }}
            className="px-3 py-1 bg-primary-500 text-white rounded-md"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditingExp(false)}
            className="px-3 py-1 border rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-l-4 border-primary-500 pl-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{experience.job_title}</h3>
          <p className="text-gray-600">{experience.company_name}</p>
          <p className="text-sm text-gray-500">
            {experience.start_date && new Date(experience.start_date).toLocaleDateString()} - 
            {experience.is_current ? 'Present' : experience.end_date && new Date(experience.end_date).toLocaleDateString()}
          </p>
          {experience.description && (
            <p className="text-gray-700 mt-2">{experience.description}</p>
          )}
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditingExp(true)} className="text-blue-500">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const EducationCard: React.FC<{ education: UserEducation; isEditing: boolean }> = ({ education, isEditing }) => {
  return (
    <div className="border-l-4 border-green-500 pl-4">
      <h3 className="font-semibold">{education.degree}</h3>
      <p className="text-gray-600">{education.institution}</p>
      <p className="text-sm text-gray-500">
        {education.start_date && new Date(education.start_date).toLocaleDateString()} - 
        {education.end_date && new Date(education.end_date).toLocaleDateString()}
      </p>
      {education.field_of_study && (
        <p className="text-gray-700 mt-1">Field: {education.field_of_study}</p>
      )}
    </div>
  )
}
