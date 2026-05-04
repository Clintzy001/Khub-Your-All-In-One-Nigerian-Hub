import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Clock, Building2, Search, BadgeCheck, DollarSign, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const jobs = [
  { id: "1", title: "Senior Frontend Developer", company: "TechNova NG", location: "Lagos", type: "Full-time", salary: "₦800K - ₦1.2M/month", posted: "2 days ago", verified: true, category: "Technology" },
  { id: "2", title: "Marketing Manager", company: "Brand Africa", location: "Abuja", type: "Full-time", salary: "₦500K - ₦700K/month", posted: "1 day ago", verified: true, category: "Marketing" },
  { id: "3", title: "Graphic Designer", company: "Creative Hub", location: "Kano", type: "Contract", salary: "₦200K - ₦350K/month", posted: "3 days ago", verified: false, category: "Design" },
  { id: "4", title: "Accountant", company: "FinServe Nigeria", location: "Port Harcourt", type: "Full-time", salary: "₦400K - ₦600K/month", posted: "5 hours ago", verified: true, category: "Finance" },
  { id: "5", title: "Delivery Driver", company: "Khub Logistics", location: "Kano", type: "Part-time", salary: "₦150K - ₦250K/month", posted: "1 day ago", verified: true, category: "Logistics" },
  { id: "6", title: "Sales Representative", company: "MegaMart", location: "Ibadan", type: "Full-time", salary: "₦200K - ₦300K/month", posted: "4 days ago", verified: false, category: "Sales" },
  { id: "7", title: "Software Engineer", company: "PayStack", location: "Lagos (Remote)", type: "Full-time", salary: "₦1.5M - ₦2.5M/month", posted: "6 hours ago", verified: true, category: "Technology" },
  { id: "8", title: "Content Writer", company: "Media House NG", location: "Abuja", type: "Freelance", salary: "₦100K - ₦200K/month", posted: "2 days ago", verified: true, category: "Marketing" },
];

const jobCategories = ["All", "Technology", "Marketing", "Design", "Finance", "Logistics", "Sales"];
const jobTypes = ["All", "Full-time", "Part-time", "Contract", "Freelance"];
const locations = ["All", "Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan"];

const JobsPage = () => {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const { t } = useLanguage();

  const filtered = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || j.category === selectedCategory;
    const matchesType = selectedType === "All" || j.type === selectedType;
    const matchesLocation = selectedLocation === "All" || j.location.includes(selectedLocation);
    return matchesSearch && matchesCategory && matchesType && matchesLocation;
  });

  const activeFilters = [selectedCategory, selectedType, selectedLocation].filter(f => f !== "All").length;

  const clearFilters = () => { setSelectedCategory("All"); setSelectedType("All"); setSelectedLocation("All"); };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t("jobs")}</h1>
        <p className="text-muted-foreground mt-1">Find your dream job or post opportunities</p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs by title or company..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`border-border text-foreground gap-2 ${activeFilters > 0 ? "border-primary text-primary" : ""}`}>
          <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="w-5 h-5 rounded-full gradient-purple text-primary-foreground text-xs flex items-center justify-center">{activeFilters}</span>}
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* Collapsible Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <div className="p-4 border border-border rounded-xl bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Filter Jobs</h3>
                {activeFilters > 0 && <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>}
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {jobCategories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat ? "gradient-purple text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Job Type</p>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map(type => (
                    <button key={type} onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedType === type ? "gradient-purple text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Location</p>
                <div className="flex flex-wrap gap-2">
                  {locations.map(loc => (
                    <button key={loc} onClick={() => setSelectedLocation(loc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedLocation === loc ? "gradient-purple text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} jobs found</p>

      {/* Job Cards */}
      <div className="space-y-4">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 border border-border rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                  {job.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.posted}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">{job.type}</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">{job.category}</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                  </span>
                </div>
              </div>
              <Button className="gradient-purple text-primary-foreground shrink-0">Apply Now</Button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No jobs match your filters. Try adjusting your search.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-3 border-border text-foreground">Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
