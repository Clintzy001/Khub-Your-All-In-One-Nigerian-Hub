import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import OpenStreetMap from '../components/Map/OpenStreetMap';
import { Upload, MapPin, Home, Car, Store, Landmark } from 'lucide-react';
<<<<<<< HEAD
import { Toaster } from 'sonner'
=======
import toast from 'sonner';
>>>>>>> eef8884 (fix ThemeContext)

export default function AddRental() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'house',
    title: '',
    description: '',
    price: '',
    location: '',
    bedroom: '',
    bathroom: '',
    sqft: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [locationAddress, setLocationAddress] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages([...images, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationAddress(data.display_name);
        setFormData(prev => ({ ...prev, location: data.display_name }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Upload images
      const imageUrls = await storageService.uploadMultipleFiles(
        'product-images',
        `rentals/${user.id}`,
        images
      );
      
      // Create rental listing
      const { data, error } = await supabase
        .from('rentals')
        .insert({
          owner_id: user.id,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          location: locationAddress || formData.location,
          latitude: selectedLocation?.[0],
          longitude: selectedLocation?.[1],
          features: {
            bedrooms: parseInt(formData.bedroom) || 0,
            bathrooms: parseInt(formData.bathroom) || 0,
            sqft: parseInt(formData.sqft) || 0
          },
          images: imageUrls,
          status: 'pending' // Requires admin approval
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Rental listed successfully! Pending admin approval.');
      navigate('/rentals');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-6">List Your Property</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Type */}
        <div className="card p-6">
          <label className="block text-sm font-medium mb-3">Property Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'house', label: 'House', icon: Home },
              { id: 'car', label: 'Car', icon: Car },
              { id: 'shop', label: 'Shop', icon: Store },
              { id: 'land', label: 'Land', icon: Landmark }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                className={`p-4 border-2 rounded-xl text-center transition ${
                  formData.type === type.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                  formData.type === type.id ? 'text-primary' : 'text-gray-400'
                }`} />
                <span className="font-semibold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="e.g., 3-Bedroom Apartment in Lekki"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="input-field"
              placeholder="Describe your property..."
              required
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price (₦/month)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="input-field"
                placeholder="50000"
                required
              />
            </div>
            {formData.type === 'house' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedroom}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedroom: e.target.value }))}
                    className="input-field"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathroom}
                    onChange={(e) => setFormData(prev => ({ ...prev, bathroom: e.target.value }))}
                    className="input-field"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Square Feet</label>
                  <input
                    type="number"
                    value={formData.sqft}
                    onChange={(e) => setFormData(prev => ({ ...prev, sqft: e.target.value }))}
                    className="input-field"
                    placeholder="1200"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Location Picker with Map */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={locationAddress || formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="input-field"
              placeholder="Click on map to select location"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pick Location on Map</label>
            <OpenStreetMap
              center={[9.081999, 8.675277]}
              zoom={6}
              onLocationSelect={handleLocationSelect}
              height="400px"
              interactive={true}
            />
            {selectedLocation && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Location selected: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
              </p>
            )}
          </div>
        </div>
        
        {/* Images Upload */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Click to upload property photos</p>
              <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
            </label>
          </div>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Listing...' : 'List Property'}
        </button>
      </form>
    </div>
  );
}
