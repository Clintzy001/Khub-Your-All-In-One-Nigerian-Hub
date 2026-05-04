import React, { useEffect, useState } from "react";
import { Search, MapPin, Star, Filter } from "lucide-react";
import ServiceLocation from "@/components/services/ServiceLocation";
import { Link } from "react-router-dom";

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  verified: boolean;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const mockProviders: ServiceProvider[] = [
  {
    id: "1",
    name: "Ibrahim Electrician",
    category: "Electrician",
    rating: 4.8,
    reviews: 120,
    price: 5000,
    verified: true,
    image: "/images/electrician.jpg",
    location: {
      latitude: 12.0022,
      longitude: 8.5919,
      address: "Kano, Nigeria",
    },
  },
  {
    id: "2",
    name: "Grace Hair Stylist",
    category: "Beauty",
    rating: 4.6,
    reviews: 89,
    price: 3000,
    verified: false,
    image: "/images/hair.jpg",
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: "Lagos, Nigeria",
    },
  },
];

const categories = [
  "All",
  "Electrician",
  "Plumber",
  "Mechanic",
  "Cleaner",
  "Designer",
  "Beauty",
];

export default function ServicesPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedProvider, setSelectedProvider] =
    useState<ServiceProvider | null>(null);

  useEffect(() => {
    // TODO: Replace with Supabase fetch
    setProviders(mockProviders);
  }, []);

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || p.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Find Trusted Service Providers
        </h1>
        <p className="text-gray-600 text-sm">
          Hire verified professionals near you
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Search */}
          <div className="flex items-center border rounded-lg px-3 py-2 w-full">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-full outline-none text-sm"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm ${
                  category === cat
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PROVIDERS LIST */}
        <div className="md:col-span-2 space-y-4">
          {filteredProviders.length === 0 && (
            <p className="text-gray-500">No services found</p>
          )}

          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white p-4 rounded-xl shadow-sm flex gap-4 cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedProvider(provider)}
            >
              <img
                src={provider.image}
                alt={provider.name}
                className="w-20 h-20 rounded-lg object-cover"
              />

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    {provider.name}
                  </h3>

                  {provider.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  {provider.category}
                </p>

                <div className="flex items-center gap-2 text-sm mt-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {provider.rating} ({provider.reviews})
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-purple-600">
                    ₦{provider.price.toLocaleString()}
                  </span>

                  <button className="text-sm text-purple-600 hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MAP + LOCATION */}
        <div className="md:col-span-1">
          {selectedProvider ? (
            <ServiceLocation
              providerLocation={selectedProvider.location}
              serviceArea={10}
            />
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
              <MapPin className="mx-auto mb-2" />
              Select a provider to view location
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
