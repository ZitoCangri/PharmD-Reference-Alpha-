/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  CornerDownRight, 
  HelpCircle, 
  Loader2, 
  Pill, 
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { normalizeDrugWithRxNorm, checkDrugInteractions, DrugInteraction } from "../lib/api";
import { NormalizedDrug } from "../types";

export interface DrugInteractionCheckerProps {
  onSearchDrug?: (name: string) => void;
}

export function DrugInteractionChecker({ onSearchDrug }: DrugInteractionCheckerProps) {
  // Input tracking
  const [inputText, setInputText] = useState("");
  const [resolvedDrugs, setResolvedDrugs] = useState<NormalizedDrug[]>([]);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [noIngredientsError, setNoIngredientsError] = useState<string | null>(null);

  // Interaction results
  const [results, setResults] = useState<DrugInteraction[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);

  // Common quick presets
  const presets = [
    { name: "Sildenafil + Nitroglycerin", items: ["Sildenafil", "Nitroglycerin"] },
    { name: "Lisinopril + Spironolactone", items: ["Lisinopril", "Spironolactone"] },
    { name: "Warfarin + Aspirin", items: ["Warfarin", "Aspirin"] },
    { name: "Clarithromycin + Atorvastatin", items: ["Clarithromycin", "Atorvastatin"] }
  ];

  // Resolve typed drug using RxNorm
  const handleAddDrug = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;

    // Prevent duplicate entries
    if (resolvedDrugs.some(d => d.originalQuery.toLowerCase() === clean.toLowerCase())) {
      setInputText("");
      return;
    }

    setIsNormalizing(true);
    setNoIngredientsError(null);
    try {
      const normalized = await normalizeDrugWithRxNorm(clean);
      if (normalized.rxcui === "NOT_FOUND" || normalized.rxcui === "ERROR_FALLBACK") {
        // If not recognized but user insists we can still keep it, but warn them
        setNoIngredientsError(`"${clean}" could not be recognized by RxNorm. Results may be limited.`);
      }
      setResolvedDrugs(prev => [...prev, normalized]);
      setInputText("");
      setResultsLoaded(false); // reset interaction state
    } catch (e) {
      setNoIngredientsError("Failed to standardise term. Please check connection.");
    } finally {
      setIsNormalizing(false);
    }
  };

  // Trigger preset scenario
  const handleLoadPreset = async (comboItems: string[]) => {
    setIsNormalizing(true);
    setResolvedDrugs([]);
    setResults([]);
    setResultsLoaded(false);
    setNoIngredientsError(null);
    
    try {
      const resolvedList: NormalizedDrug[] = [];
      for (const item of comboItems) {
        const normalized = await normalizeDrugWithRxNorm(item);
        resolvedList.push(normalized);
      }
      setResolvedDrugs(resolvedList);
    } catch (e) {
      setNoIngredientsError("Error loading combination preset.");
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleRemoveDrug = (index: number) => {
    setResolvedDrugs(prev => prev.filter((_, idx) => idx !== index));
    setResultsLoaded(false);
    setResults([]);
  };

  const handleClearAll = () => {
    setResolvedDrugs([]);
    setResults([]);
    setResultsLoaded(false);
    setNoIngredientsError(null);
  };

  // Query Drug-Drug interactions
  const handleCheckInteractions = async () => {
    if (resolvedDrugs.length < 2) return;
    setIsChecking(true);
    try {
      const list = await checkDrugInteractions(resolvedDrugs);
      setResults(list);
      setResultsLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div 
      id="drug-interaction-checker-panel"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-2xs transition-all max-w-5xl mx-auto my-6"
    >
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest bg-rose-50 text-rose-600 border border-rose-100/60 px-2 py-0.5 rounded uppercase">
              Clinical Drug Safety
            </span>
            <h2 className="text-lg font-bold tracking-tight text-slate-800 font-sans mt-1">
              Multi-Drug Interaction Identifier
            </h2>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Standardized via RxNorm Interaction List
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* Prescription Input Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input field and Presets */}
          <div className="md:col-span-2 space-y-4">
            <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1">
              Assemble Active Formulary / Regimen
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDrug(inputText);
                    }
                  }}
                  disabled={isNormalizing || isChecking}
                  placeholder="Input generic or brand (e.g. Aspirin, Lipitor)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-400 focus:bg-white transition-all font-sans"
                />
                {isNormalizing && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAddDrug(inputText)}
                disabled={isNormalizing || isChecking || !inputText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Warning Message on Normalization failures */}
            {noIngredientsError && (
              <p className="text-[11px] text-amber-600 font-medium font-sans flex items-center gap-1 bg-amber-50 border border-amber-100 rounded px-2.5 py-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {noIngredientsError}
              </p>
            )}

            {/* Presets Grid */}
            <div className="space-y-2 pt-2.5">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                Load Dynamic Clinical Combo Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadPreset(preset.items)}
                    type="button"
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50/55 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-md font-medium text-xs text-slate-600 transition-all cursor-pointer font-sans"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current medications list */}
          <div className="md:col-span-1 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between min-h-[160px]">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                  List to Check ({resolvedDrugs.length})
                </span>
                {resolvedDrugs.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-mono text-red-500 hover:text-red-700 font-semibold uppercase hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {resolvedDrugs.length === 0 ? (
                <div className="text-center py-6">
                  <Pill className="w-8 h-8 text-slate-350 mx-auto mb-1 stroke-1" />
                  <p className="text-[11px] text-slate-400 italic">
                    Add at least 2 medications to screen for adverse events.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {resolvedDrugs.map((drug, index) => (
                    <div
                      key={index}
                      className="px-2.5 py-1 bg-white border border-slate-200/80 rounded-md flex items-center justify-between gap-1.5 text-xs text-slate-700 font-sans shadow-3xs"
                    >
                      <div className="truncate max-w-[130px]">
                        <span className="font-semibold">{drug.originalQuery}</span>
                        {drug.normalizedName.toLowerCase() !== drug.originalQuery.toLowerCase() && (
                          <span className="text-[10px] text-slate-400 block truncate leading-tight font-mono">
                            {drug.normalizedName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveDrug(index)}
                        className="text-slate-400 hover:text-red-500 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {resolvedDrugs.length >= 2 && (
              <button
                type="button"
                onClick={handleCheckInteractions}
                disabled={isChecking}
                className="w-full mt-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Checking Interactions...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Verify Interaction Risks
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Results Stream Area */}
        {resultsLoaded && (
          <div className="border-t border-slate-150 pt-5 space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
              Interaction Screening Report
            </h3>

            {results.length === 0 ? (
              <div className="bg-emerald-50/45 border border-emerald-100 rounded-xl p-5 flex items-start gap-3.5">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900 font-sans uppercase tracking-wide">
                    Excellent Outcome: No Interactions Found
                  </h4>
                  <p className="text-xs font-sans text-slate-600 leading-relaxed max-w-2xl">
                    NIH RxNorm and the active PharmacoLogic Reference database have evaluated the combination of [ <strong>{resolvedDrugs.map(d => d.normalizedName).join(", ")}</strong> ] and detected no standard clinical drug-drug interaction warning logs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4.5">
                {/* Summary counts banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 flex items-center gap-4">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Adverse Findings Summary:
                  </span>
                  <div className="flex gap-4">
                    <span className="font-semibold">
                      Major:{" "}
                      <span className="text-red-650 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 text-red-600">
                        {results.filter(r => r.severity === "Major").length}
                      </span>
                    </span>
                    <span className="font-semibold">
                      Moderate:{" "}
                      <span className="text-amber-750 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 text-amber-600">
                        {results.filter(r => r.severity === "Moderate").length}
                      </span>
                    </span>
                    <span className="font-semibold">
                      Minor:{" "}
                      <span className="text-slate-750 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                        {results.filter(r => r.severity === "Minor").length}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Grid list of interactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((interaction, iIdx) => {
                    // Determine styling based on severity
                    const isMajor = interaction.severity === "Major";
                    const isModerate = interaction.severity === "Moderate";

                    const badgeStyle = isMajor
                      ? "bg-red-50 text-red-600 border-red-200"
                      : isModerate
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-slate-50 text-slate-600 border-slate-200";

                    const cardStyle = isMajor
                      ? "border-red-100 bg-red-50/10 hover:border-red-200"
                      : isModerate
                      ? "border-amber-100 bg-amber-50/10 hover:border-amber-200"
                      : "border-slate-150 bg-slate-50/20 hover:border-slate-200";

                    return (
                      <div
                        key={iIdx}
                        className={`border rounded-lg p-4 space-y-3 hover:shadow-xs transition-all ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-150 pb-2 flex-wrap sm:flex-nowrap">
                          {/* Pair Titles */}
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-800 font-sans uppercase tracking-tight">
                            <span className="text-blue-600 font-extrabold">{interaction.drugA.name}</span>
                            <span className="text-slate-400 font-mono font-normal">↔</span>
                            <span className="text-blue-600 font-extrabold">{interaction.drugB.name}</span>
                          </div>
                          {/* Sev Badge */}
                          <div
                            className={`px-2 py-0.5 border text-[9px] font-mono font-bold uppercase rounded ${badgeStyle}`}
                          >
                            {interaction.severity} Severity
                          </div>
                        </div>

                        {/* Description text */}
                        <p className="text-xs font-sans text-slate-600 leading-relaxed bg-white rounded p-3 border border-slate-100 shadow-3xs">
                          {interaction.description}
                        </p>

                        {/* Technical Source footer */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                          <span className="flex items-center gap-0.5">
                            <CornerDownRight className="w-3 h-3 text-blue-500" />
                            Source: {interaction.source}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning reference notice footer */}
      <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 text-[10px] text-slate-400 font-mono flex items-start gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-normal">
          DISCLAIMER: The NIH RxNorm drug interaction service aggregates database files from drug publishers for informative screening. This does not replace formal board diagnoses. All clinical interventions must be checked against standard reference books like Micromedex or the Lexicomp core.
        </p>
      </div>
    </div>
  );
}
