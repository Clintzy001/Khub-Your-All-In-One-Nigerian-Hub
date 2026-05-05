import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface MyService {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  status: "active" | "paused";
  views: number;
  bookings: number;
  location: string;
}

export default function MyServiceListingsPage() {
  const [services, setServices] = useState<MyService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Supabase fetch
    setServices([
      {
        id: "1",
        title: "Professional Electrician Services",
        category: "Electrician",
        price: 5000,
        image: "/images/electrician.jpg",
        status: "active",
        views: 120,
        bookings: 25,
        location: "Kano, Nigeria",
      },
      {
        id: "2",
        title: "Home Cleaning Service",
        category: "Cleaner",
        price: 3000,
        image: "/images/cleaner.jpg",
        status: "paused",
        views: 80,
        bookings: 10,
        location: "Abuja, Nigeria",
      },
    ]);
    setLoading(false);
  }, []);

  const deleteService = (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleStatus = (id: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Service Listings
          </h1>
          <p className="text-gray-600 text-sm">
            Manage your services and track performance
          </p>
        </div>

        <Link
          to="/add-service"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Link>
      </div>

      {/* EMPTY STATE */}
      {!loading && services.length === 0 && (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 mb-4">
            You haven't listed any services yet
          </p>
          <Link
            to="/add-service"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Create Your First Service
          </Link>
        </div>
      )}

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-40 object-cover"
            />

            <div className="p-4">
              {/* TITLE */}
              <h3 className="font-semibold text-gray-900">
                {service.title}
              </h3>

              <p className="text-sm text-gray-500">
                {service.category}
              </p>

              {/* LOCATION */}
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {service.location}
              </div>

              {/* PRICE */}
              <p className="text-purple-600 font-bold mt-2">
                ₦{service.price.toLocaleString()}
              </p>

              {/* STATUS */}
              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    service.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              {/* STATS */}
              <div className="flex justify-between text-sm text-gray-600 mt-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {service.views}
                </span>
                <span>{service.bookings} bookings</span>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-between mt-4">
                <Link
                  to={`/edit-service/${service.id}`}
                  className="flex items-center gap-1 text-blue-600 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>

                <button
                  onClick={() => toggleStatus(service.id)}
                  className="text-sm text-gray-600"
                >
                  {service.status === "active"
                    ? "Pause"
                    : "Activate"}
                </button>

                <button
                  onClick={() => deleteService(service.id)}
                  className="flex items-center gap-1 text-red-600 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
