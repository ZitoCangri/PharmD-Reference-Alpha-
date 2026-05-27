/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from "react";
import { BookOpen, AlertCircle, ArrowRight, CornerDownRight, Activity, ClipboardList } from "lucide-react";
import { CLINICAL_CONDITIONS } from "../data/conditions";

interface DiseasePanelProps {
  diseaseId: string;
  onSearchDrug: (query: string) => void;
  onClose: () => void;
}

export function DiseasePanel({ diseaseId, onSearchDrug, onClose }: DiseasePanelProps) {
  const condition = CLINICAL_CONDITIONS.find(c => c.id === diseaseId);

  if (!condition) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-850 p-4 rounded-xl flex items-start gap-2.5 my-6 max-w-4xl mx-auto">
        <AlertCircle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold font-sans">Condition Not Indexed</h4>
          <p className="text-sm font-sans mt-0.5">
            The requested disease code was not found in our local database mappings. Please perform a direct search or choose a popular index.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`disease-panel-${condition.id}`}
      className="bg-white border border-slate-200 rounded-xl shadow-xs max-w-5xl mx-auto my-6 overflow-hidden animate-in fade-in duration-200"
    >
      {/* Panel Top Header - Highly Structured */}
      <div className="bg-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold tracking-wider bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded uppercase">
              {condition.category}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-850 font-sans mt-1">
              {condition.name} Guidelines
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-mono font-medium border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          [ CLOSE INDEX ]
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Clinical Overview & Guidelines Cards - Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Clinical Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2.5 hover:shadow-2xs transition-shadow">
            <h3 className="text-xs font-bold font-mono text-slate-800 tracking-wide flex items-center gap-1.5 uppercase border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Pathophysiology & Clinical Overview
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {condition.clinicalOverview}
            </p>
          </div>

          {/* Treatment Guidelines */}
          <div className="bg-blue-50/10 border border-blue-150 rounded-xl p-4.5 space-y-2.5 hover:shadow-2xs transition-shadow">
            <h3 className="text-xs font-bold font-mono text-blue-800 tracking-wide flex items-center gap-1.5 uppercase border-b border-blue-100/60 pb-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              Standard-of-Care Guidelines
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-sans">
              {condition.treatmentGuidelines}
            </p>
          </div>
        </div>

        {/* Drug Mapping Inventory (Clickable Results) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-2 gap-2">
            <h3 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-widest">
              Indications Map: Recommended Therapeutic Classes
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Select any drug to inspect its clinical openFDA Drug Monograph
            </span>
          </div>

          <div className="space-y-6">
            {condition.drugClasses.map((cl, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-2xs transition-shadow">
                {/* Embedded Drug Class Header */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-150">
                  <h4 className="text-sm font-bold text-slate-800 font-sans tracking-tight">
                    {cl.className}
                  </h4>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mechanism:</span> {cl.mechanism}
                  </p>
                </div>

                {/* Indicated Agents - Density Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cl.drugs.map((drug, dIdx) => (
                    <button
                      key={dIdx}
                      onClick={() => onSearchDrug(drug.generic)}
                      className="group flex flex-col text-left p-3.5 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all rounded-lg cursor-pointer max-w-full text-slate-900 overflow-hidden"
                    >
                      {/* Drug Nomenclature row */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-bold text-slate-800 font-sans group-hover:text-blue-600 transition-colors">
                          {drug.generic}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
                      </div>
                      
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="text-slate-400">Brand:</span>
                        <span className="font-semibold text-slate-650">{drug.brand}</span>
                      </div>

                      {/* Clinical Pearl Box */}
                      <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600 leading-snug font-sans group-hover:bg-blue-50/25 group-hover:border-blue-150 transition-colors relative">
                        <div className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-0.5">
                          <CornerDownRight className="w-2.5 h-2.5 text-blue-500" /> Clinical Action Line
                        </div>
                        {drug.clinicalPearl}
                      </div>

                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
