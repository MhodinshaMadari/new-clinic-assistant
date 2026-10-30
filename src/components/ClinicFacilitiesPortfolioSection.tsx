import React, { useState, useMemo } from 'react';
import { ClinicFacility, Clinic } from '../types';
import { FacilityIcon, FACILITY_CATEGORIES, DEFAULT_FACILITIES } from '../data/defaultFacilities';
import { 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Accessibility, 
  HeartHandshake, 
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClinicFacilitiesPortfolioSectionProps {
  clinic?: Clinic;
}

export const ClinicFacilitiesPortfolioSection: React.FC<ClinicFacilitiesPortfolioSectionProps> = ({ clinic }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract facilities from clinic or fallback to defaults
  const allFacilities = useMemo(() => {
    if (clinic?.facilities && clinic.facilities.length > 0) {
      return clinic.facilities;
    }
    return DEFAULT_FACILITIES;
  }, [clinic?.facilities]);

  // Only display facilities that are enabled
  const enabledFacilities = useMemo(() => {
    return allFacilities.filter(f => f.isEnabled !== false);
  }, [allFacilities]);

  // Filter based on search query and category
  const filteredFacilities = useMemo(() => {
    let list = enabledFacilities;

    if (selectedCategory !== 'All') {
      list = list.filter(f => f.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.badge && f.badge.toLowerCase().includes(q))
      );
    }

    return list;
  }, [enabledFacilities, selectedCategory, searchQuery]);

  // Category counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: enabledFacilities.length };
    FACILITY_CATEGORIES.forEach(cat => {
      counts[cat] = enabledFacilities.filter(f => f.category === cat).length;
    });
    return counts;
  }, [enabledFacilities]);

  return (
    <section id="clinic-facilities-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-700 dark:text-teal-300 text-xs font-bold font-mono tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-teal-500 animate-pulse" />
              <span>CLINIC INFRASTRUCTURE & AMENITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              World-Class Facilities & Patient Comforts
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Experience seamless healthcare supported by certified diagnostic laboratories, step-free wheelchair accessibility, touchless sanitized restrooms, and an on-site dispensary at {clinic?.name || 'our clinic'}.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="w-full md:w-72 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search wheelchair, lab, dispensary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'All'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>All Facilities</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              selectedCategory === 'All' ? 'bg-teal-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {categoryCounts.All}
            </span>
          </button>

          {FACILITY_CATEGORIES.map(category => {
            const count = categoryCounts[category] || 0;
            if (count === 0 && selectedCategory !== category) return null;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === category
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>{category}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  selectedCategory === category ? 'bg-teal-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Facilities Grid */}
        {filteredFacilities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-base">No Facilities Match Your Filter</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No active facilities were found matching "{searchQuery}". Try selecting "All Facilities" or clearing your search term.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>View All Facilities</span>
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility, index) => {
              return (
                <motion.div
                  key={facility.id || facility.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                        <FacilityIcon iconName={facility.icon} className="w-6 h-6" />
                      </div>

                      {facility.badge && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 font-mono">
                          {facility.badge}
                        </span>
                      )}
                    </div>

                    {/* Facility Name & Category */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {facility.name}
                      </h3>
                      {facility.category && (
                        <span className="inline-block text-[11px] font-semibold text-teal-600 dark:text-teal-400 font-mono">
                          {facility.category}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {facility.description}
                    </p>
                  </div>

                  {/* Bottom status badge */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Available On-Site</span>
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-mono">
                      Verified Facility
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Accessibility & Patient Safety Highlight Bar */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="p-3.5 bg-teal-500/20 backdrop-blur-md rounded-2xl text-teal-300 border border-teal-500/30 shrink-0">
              <Accessibility className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-white text-base sm:text-lg">
                  100% Barrier-Free & Senior-Friendly Infrastructure
                </h4>
                <span className="hidden sm:inline-block px-2.5 py-0.5 bg-teal-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Universal Access
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                Need extra assistance? Dedicated wheelchairs, ramp access, and patient escort support are available on-demand upon arrival.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
            <a
              href={`tel:${clinic?.phone || '+91 98765 43210'}`}
              className="w-full md:w-auto text-center px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
            >
              Call for Assistance
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
