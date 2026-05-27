/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Pill, Activity } from "lucide-react";
import { POPULAR_DRUGS } from "../data/drugs";
import { CLINICAL_CONDITIONS } from "../data/conditions";

interface PopularSearchesProps {
  onSearchDrug: (generic: string) => void;
  onSelectDisease: (id: string) => void;
}

export function PopularSearches({ onSearchDrug, onSelectDisease }: PopularSearchesProps) {
  // Take 3 popular conditions
  const popularConditions = CLINICAL_CONDITIONS.slice(0, 3);

  return (
    <div id="popular-suggestions-cloud" className="w-full max-w-2xl mx-auto py-3 px-4">
      <div className="flex flex-col gap-2.5">
        
        {/* Clinically Trending Disorders */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Common Disease Indexes:
          </span>
          {popularConditions.map((cond) => (
            <button
              key={cond.id}
              onClick={() => onSelectDisease(cond.id)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 hover:border-blue-200 rounded-md font-medium transition-colors cursor-pointer border border-slate-250 border-slate-200 text-[11px]"
            >
              {cond.name.split(" (")[0]}
            </button>
          ))}
        </div>

        {/* Clinically Trending Drugs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider">
            <Pill className="w-3.5 h-3.5 text-slate-400" />
            Popular Monographs:
          </span>
          {POPULAR_DRUGS.map((drug) => (
            <button
              key={drug.brand}
              onClick={() => onSearchDrug(drug.brand)}
              className="px-2.5 py-1 bg-white hover:bg-blue-50/40 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-md font-medium transition-colors cursor-pointer text-[11px]"
            >
              {drug.brand} <span className="text-slate-400 font-normal font-mono text-[10px]">({drug.generic})</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
