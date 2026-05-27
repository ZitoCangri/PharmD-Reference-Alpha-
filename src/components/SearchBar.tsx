/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, Pill, Activity, X, CornerDownRight } from "lucide-react";
import { CLINICAL_CONDITIONS } from "../data/conditions";
import { COMMON_DRUG_MAP } from "../data/drugs";

interface SearchBarProps {
  onSearchDrug: (query: string) => void;
  onSelectDisease: (id: string) => void;
  initialQuery?: string;
}

export function SearchBar({ onSearchDrug, onSelectDisease, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    drugs: { brand: string; generic: string }[];
    conditions: { id: string; name: string; category: string }[];
  }>({ drugs: [], conditions: [] });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Handle outside clicks to close the suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions based on typing
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) {
      setSuggestions({ drugs: [], conditions: [] });
      return;
    }

    // 1. Matches for drugs
    const matchingDrugs: { brand: string; generic: string }[] = [];
    const absoluteMatches = new Set<string>();

    for (const [brand, generic] of Object.entries(COMMON_DRUG_MAP)) {
      if (brand.includes(trimmed) || generic.includes(trimmed)) {
        const key = `${brand}-${generic}`;
        if (!absoluteMatches.has(key)) {
          absoluteMatches.add(key);
          matchingDrugs.push({
            brand: brand.charAt(0).toUpperCase() + brand.slice(1),
            generic: generic.charAt(0).toUpperCase() + generic.slice(1)
          });
        }
      }
      if (matchingDrugs.length >= 5) break; 
    }

    // 2. Matches for conditions / disease states
    const matchingConditions = CLINICAL_CONDITIONS.filter(cond => {
      const nameMatch = cond.name.toLowerCase().includes(trimmed);
      const categoryMatch = cond.category.toLowerCase().includes(trimmed);
      const synonymMatch = cond.synonyms.some(syn => syn.toLowerCase().includes(trimmed));
      return nameMatch || categoryMatch || synonymMatch;
    }).map(cond => ({
      id: cond.id,
      name: cond.name,
      category: cond.category
    }));

    setSuggestions({
      drugs: matchingDrugs,
      conditions: matchingConditions.slice(0, 4)
    });
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim().toLowerCase();
    
    // Check if the query is an exact match for a disease state first
    const pathCondition = CLINICAL_CONDITIONS.find(
      cond => cond.name.toLowerCase() === trimmed || cond.synonyms.some(s => s.toLowerCase() === trimmed)
    );

    if (pathCondition) {
      onSelectDisease(pathCondition.id);
    } else {
      onSearchDrug(query.trim());
    }
    setIsOpen(false);
  };

  const handleSelectItem = (type: "drug" | "disease", value: string) => {
    setQuery(value);
    setIsOpen(false);
    if (type === "disease") {
      const cond = CLINICAL_CONDITIONS.find(c => c.name === value || c.id === value);
      if (cond) onSelectDisease(cond.id);
    } else {
      onSearchDrug(value);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions({ drugs: [], conditions: [] });
    setIsOpen(true);
  };

  const hasSuggestions = suggestions.drugs.length > 0 || suggestions.conditions.length > 0;

  return (
    <div id="search-container" ref={containerRef} className="relative w-full max-w-2xl mx-auto z-40">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            id="clinical-search-input"
            type="text"
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans text-base"
            placeholder="Search brand, generic (e.g., 'Lipitor', 'lisinopril') or disease state ('diabetes')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {query && (
            <button
              id="search-clear-btn"
              type="button"
              onClick={clearSearch}
              className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestion Dropdown */}
      {isOpen && hasSuggestions && (
        <div
          id="search-suggestions-dropdown"
          className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in duration-100"
        >
          {/* Diseases Suggestions Group */}
          {suggestions.conditions.length > 0 && (
            <div className="border-b border-slate-100">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 tracking-wider uppercase">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Disorders & Diseases
              </div>
              <div className="py-1">
                {suggestions.conditions.map((cond) => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => handleSelectItem("disease", cond.id)}
                    className="w-full flex items-center justify-between px-5 py-2 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{cond.name}</span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {cond.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medications Suggestions Group */}
          {suggestions.drugs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 text-[11px] font-mono font-semibold text-slate-500 tracking-wider uppercase">
                <Pill className="w-3.5 h-3.5 text-slate-400" />
                Medications
              </div>
              <div className="py-1">
                {suggestions.drugs.map((drug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectItem("drug", drug.brand)}
                    className="w-full flex items-center justify-between px-5 py-2 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {drug.brand}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({drug.generic})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-700">
                      Select Drug
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
