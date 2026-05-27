/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { PopularSearches } from "./components/PopularSearches";
import { DiseasePanel } from "./components/DiseasePanel";
import { DrugMonographView } from "./components/DrugMonographView";
import { DrugInteractionChecker } from "./components/DrugInteractionChecker";
import { normalizeDrugWithRxNorm, fetchDrugMonograph } from "./lib/api";
import { NormalizedDrug, openFDALabel } from "./types";
import {
  subscribeToAuthChanges,
  loginWithGoogle,
  logoutUser,
  saveDrugMonographToProfile,
  fetchSavedMonographsFromProfile,
  removeSavedMonographFromProfile,
  saveSearchHistoryToProfile,
  fetchSearchHistoryFromProfile,
  clearSearchHistoryFromProfile,
  SavedMonographData,
  IS_SANDBOX_MODE
} from "./lib/firebase";
import {
  ShieldAlert,
  Loader2,
  Clock,
  Trash2,
  Pill,
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  Activity,
  Heart,
  Bookmark
} from "lucide-react";

export default function App() {
  // Portal States
  const [activeTab, setActiveTab] = useState<"search" | "checker">("search");
  const [activeDiseaseId, setActiveDiseaseId] = useState<string | null>(null);
  const [activeDrug, setActiveDrug] = useState<NormalizedDrug | null>(null);
  const [activeLabel, setActiveLabel] = useState<openFDALabel | null>(null);
  const [searchStrategy, setSearchStrategy] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search history state (persisted in Firestore if logged in, otherwise localStorage)
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");

  // Firebase Auth states
  const [user, setUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Profile Saved Monographs
  const [savedMonographs, setSavedMonographs] = useState<SavedMonographData[]>([]);
  const [isSavingMonograph, setIsSavingMonograph] = useState<boolean>(false);

  // Subscribe to Auth Status changes on mount
  useEffect(() => {
    const unsub = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Synchronize Saved Monographs & History when user auth changes
  useEffect(() => {
    if (user) {
      // 1. Fetch saved drug monographs from standard Firebase
      fetchSavedMonographsFromProfile(user.uid)
        .then(setSavedMonographs)
        .catch(err => console.error("Error loading profile bookmarks:", err));
      
      // 2. Fetch search history from Firebase
      fetchSearchHistoryFromProfile(user.uid)
        .then(items => {
          const queries = items.map(h => h.query);
          setSearchHistory(queries);
        })
        .catch(err => console.error("Error loading profile search history:", err));
    } else {
      setSavedMonographs([]);
      // Fallback local operations reading
      try {
        const stored = localStorage.getItem("clinical_search_history");
        if (stored) {
          setSearchHistory(JSON.parse(stored));
        } else {
          setSearchHistory([]);
        }
      } catch (e) {
        console.warn("Could not read local search history: ", e);
      }
    }
  }, [user]);

  // Auth Operations
  const handleLogin = async () => {
    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      if (IS_SANDBOX_MODE) {
        localStorage.setItem("sandbox_user_profile", JSON.stringify(profile));
      }
    } catch (err) {
      console.error("Staff Authentication was cancelled or failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      if (IS_SANDBOX_MODE) {
        localStorage.removeItem("sandbox_user_profile");
        localStorage.removeItem("sandbox_saved_monographs");
        localStorage.removeItem("sandbox_search_history");
      }
    } catch (err) {
      console.error("Sign-out operations failed:", err);
    }
  };

  // Monograph profile Bookmarking toggle
  const handleSaveMonographToggle = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    if (!activeDrug) return;

    setIsSavingMonograph(true);
    const isCurrentlySaved = savedMonographs.some(m => m.rxcui === activeDrug.rxcui);
    
    try {
      if (isCurrentlySaved) {
        const docToRemove = savedMonographs.find(m => m.rxcui === activeDrug.rxcui);
        if (docToRemove) {
          await removeSavedMonographFromProfile(user.uid, docToRemove.id);
          setSavedMonographs(prev => prev.filter(m => m.id !== docToRemove.id));
        }
      } else {
        const savedItem = await saveDrugMonographToProfile(user.uid, activeDrug.rxcui, activeDrug.normalizedName);
        setSavedMonographs(prev => [savedItem, ...prev]);
      }
    } catch (err) {
      console.error("Failed to toggle saved drug monograph:", err);
    } finally {
      setIsSavingMonograph(false);
    }
  };

  const handleRemoveSavedMonograph = async (docId: string) => {
    if (!user) return;
    try {
      await removeSavedMonographFromProfile(user.uid, docId);
      setSavedMonographs(prev => prev.filter(m => m.id !== docId));
    } catch (err) {
      console.error("Failed to remove saved drug monograph:", err);
    }
  };

  // Update history list helper
  const addToHistory = (queryStr: string) => {
    const trimmed = queryStr.trim();
    if (!trimmed) return;
    
    if (user) {
      saveSearchHistoryToProfile(user.uid, trimmed)
        .then(() => fetchSearchHistoryFromProfile(user.uid))
        .then(items => setSearchHistory(items.map(h => h.query)))
        .catch(e => console.error("Could not write record to profile search history:", e));
    } else {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 6);
        localStorage.setItem("clinical_search_history", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearHistory = () => {
    if (user) {
      clearSearchHistoryFromProfile(user.uid)
        .then(() => setSearchHistory([]))
        .catch(err => console.error("Could not wipe history indices:", err));
    } else {
      setSearchHistory([]);
      localStorage.removeItem("clinical_search_history");
    }
  };

  // Main Drug Lookup Handler
  const handleSearchDrug = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setActiveDiseaseId(null); // Clear any active disease guidelines
    setCurrentQuery(query);
    setActiveTab("search"); // Switch tab back to search context if they hit lookup from checker presets

    try {
      // Step A: Normalize brand / spelling using RxNorm API
      const normalizedData = await normalizeDrugWithRxNorm(query);
      setActiveDrug(normalizedData);

      // Step B: Fetch Label Monograph from openFDA using normalized ingredients
      const { label, searchStrategyUsed } = await fetchDrugMonograph(normalizedData);
      setActiveLabel(label);
      setSearchStrategy(searchStrategyUsed);
      
      // Successfully loaded! Add to search log history
      addToHistory(query);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 
        "An unexpected clinical database lookup timeout occurred. Please check drug nomenclature."
      );
      setActiveDrug(null);
      setActiveLabel(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Main Disease Guidelines Selection Handler
  const handleSelectDisease = (id: string) => {
    setActiveDiseaseId(id);
    setActiveDrug(null);
    setActiveLabel(null);
    setError(null);
    setIsLoading(false);
    setActiveTab("search"); // Switch view tab to search
    
    // Add readable synonym mapping back into search history for compliance
    const names: Record<string, string> = {
      hypertension: "Hypertension (HTN)",
      diabetes_mellitus: "Type 2 Diabetes (T2DM)",
      hyperlipidemia: "Hyperlipidemia",
      asthma_copd: "Asthma & COPD",
      heart_failure: "Heart Failure (HFrEF)",
      gerd_peptic_ulcer: "GERD & Gastric Ulcers",
      depression: "Depression (MDD)"
    };
    if (names[id]) {
      addToHistory(names[id]);
      setCurrentQuery(names[id]);
    }
  };

  const handleCloseDisease = () => {
    setActiveDiseaseId(null);
    setCurrentQuery("");
  };

  const handleResetPortal = () => {
    setActiveDiseaseId(null);
    setActiveDrug(null);
    setActiveLabel(null);
    setError(null);
    setCurrentQuery("");
  };

  return (
    <div id="clinical-pharmacy-app" className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Top Professional Header */}
      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        isSandbox={IS_SANDBOX_MODE} 
      />

      <main className="flex-1 pb-16">
        
        {/* Prominent Search Hero Hub */}
        <div className="bg-gradient-to-b from-blue-50/40 via-white to-slate-50 text-slate-800 py-10 sm:py-14 px-4 border-b border-slate-200 select-none">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="text-[10px] font-bold font-mono tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-100/60 px-2.5 py-1 rounded-full">
              Standardized Clinical Indexing Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 mt-1">
              Clinical Decision Support Search
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Verify ingredients via NIH RxNorm, resolve therapeutic indicators, and fetch structured label monographs containing mechanisms, warnings, and safety profiles from the official openFDA engine.
            </p>

            {/* Dynamic View Tab Selector */}
            <div className="flex justify-center pt-3.5 pb-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 shadow-3xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("search");
                    handleResetPortal();
                  }}
                  className={`px-4 py-1.5 text-xs font-bold font-sans rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "search"
                      ? "bg-white text-blue-600 shadow-3xs border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Search Guideline Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("checker");
                    handleResetPortal();
                  }}
                  className={`px-4 py-1.5 text-xs font-bold font-sans rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "checker"
                      ? "bg-white text-rose-600 shadow-3xs border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Drug Interaction Checker
                </button>
              </div>
            </div>

            {/* Configured Multi-Search Engine Bar Component - only show if search tab active */}
            {activeTab === "search" && (
              <div className="pt-2 max-w-2xl mx-auto">
                <SearchBar
                  onSearchDrug={handleSearchDrug}
                  onSelectDisease={handleSelectDisease}
                  initialQuery={currentQuery}
                />
              </div>
            )}

            {/* Trending Shortcuts underneath bar */}
            {activeTab === "search" && (
              <div className="pt-1.5">
                <PopularSearches
                  onSearchDrug={handleSearchDrug}
                  onSelectDisease={handleSelectDisease}
                />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div id="portal-content-body" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          
          {/* INTERACTION CHECKER PANEL (Active when selected explicitly) */}
          {activeTab === "checker" && (
            <DrugInteractionChecker onSearchDrug={handleSearchDrug} />
          )}

          {/* A. LOADING STATE: Sleek Clinical Skeletons */}
          {activeTab === "search" && isLoading && (
            <div id="loading-monograph-skeleton" className="space-y-6 max-w-5xl mx-auto animate-pulse py-8">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="space-y-3 w-2/3">
                  <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                  <div className="h-8 bg-slate-300 rounded-md w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                </div>
                <div className="h-14 bg-slate-200 rounded-lg w-32 shrink-0"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="h-40 bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                    <div className="h-5 bg-slate-300 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                  </div>
                  <div className="h-28 bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-150 rounded w-full"></div>
                    <div className="h-3 bg-slate-150 rounded w-4/5"></div>
                  </div>
                </div>
                <div className="lg:col-span-1 h-64 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="h-4 bg-slate-300 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-200 rounded w-full"></div>
                  <div className="h-8 bg-slate-200 rounded w-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-500 font-mono text-xs pt-4">
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>Interrogating NIH RxNorm & openFDA label streams...</span>
              </div>
            </div>
          )}

          {/* B. SEARCH ERROR BANNER: Custom fallbacks */}
          {activeTab === "search" && !isLoading && error && (
            <div id="search-error-dialog" className="bg-white border-2 border-red-200 rounded-xl max-w-2xl mx-auto my-8 overflow-hidden shadow-xs">
              <div className="bg-red-600 text-white py-3 px-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold tracking-wider font-mono">
                  CLINICAL RETRIEVAL FAILURE
                </h4>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm font-sans text-slate-700 leading-relaxed">
                  We were unable to normalize the drug "<strong>{currentQuery}</strong>" or retrieve its package labeling records from openFDA.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Diagnostic Reason:</span> {error}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleResetPortal}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Reset Portal Search
                  </button>
                  <button
                    onClick={() => handleSearchDrug("Lisinopril")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Load Sample Drug Label (Lisinopril)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* C. DRUG MONOGRAPH VISUALIZER */}
          {activeTab === "search" && !isLoading && !error && activeDrug && activeLabel && (
            <DrugMonographView
              normalized={activeDrug}
              label={activeLabel}
              searchStrategy={searchStrategy}
              isLoggedIn={!!user}
              isSaved={savedMonographs.some(m => m.rxcui === activeDrug.rxcui)}
              onSaveToggle={handleSaveMonographToggle}
              isSaving={isSavingMonograph}
            />
          )}

          {/* D. DISEASE GUIDELINES INDEX VIEW */}
          {activeTab === "search" && !isLoading && !error && activeDiseaseId && (
            <DiseasePanel
              diseaseId={activeDiseaseId}
              onSearchDrug={handleSearchDrug}
              onClose={handleCloseDisease}
            />
          )}

          {/* E. DEFAULT SPLASH PAGE: Initial features checklist & metadata logs */}
          {activeTab === "search" && !isLoading && !error && !activeDrug && !activeDiseaseId && (
            <div id="portal-landing-splash" className="space-y-8 py-4.5 sm:py-6 max-w-5xl mx-auto">
              
              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Capability A */}
                <div className="bg-white border border-slate-250 hover:border-slate-350 transition-colors rounded-xl p-5 space-y-3.5 shadow-3xs hover:shadow-2xs">
                  <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg inline-flex items-center justify-center">
                    <Pill className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold font-sans text-slate-900">
                    RxNorm Component Lookup
                  </h3>
                  <p className="text-xs text-slate-605 leading-relaxed font-sans">
                    Resolves arbitrary brand names (e.g. "Crestor") or typos to standardized active molecular ingredients, preparing precise payloads for clinical verification.
                  </p>
                </div>

                {/* Capability B */}
                <div className="bg-white border border-slate-250 hover:border-slate-350 transition-colors rounded-xl p-5 space-y-3.5 shadow-3xs hover:shadow-2xs">
                  <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg inline-flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold font-sans text-slate-900">
                    Structured Food & Drug Labels
                  </h3>
                  <p className="text-xs text-slate-605 leading-relaxed font-sans">
                    Constructs clinical-grade monographs complete with collapsible panels detailings mechanisms of actions, safety limitations, PK parameters, and ADR metrics.
                  </p>
                </div>

                {/* Capability C */}
                <div className="bg-white border border-slate-250 hover:border-slate-350 transition-colors rounded-xl p-5 space-y-3.5 shadow-3xs hover:shadow-2xs">
                  <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg inline-flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-700 font-bold" />
                  </div>
                  <h3 className="text-base font-bold font-sans text-slate-900">
                    Disease Indication Mapper
                  </h3>
                  <p className="text-xs text-slate-605 leading-relaxed font-sans">
                    Translates diagnostic conditions (e.g., "Hypertension") to recommended standards of care. Browse designated first-line groups, clinical pearls, and pull labels instantly.
                  </p>
                </div>

              </div>

              {/* Layout Sidebar / History log & instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Column block: Log of search history */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-205 pb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-bold font-mono tracking-wider text-slate-700 uppercase">
                        {user ? "Cloud Search Logs" : "Session Search Logs"}
                      </h4>
                    </div>
                    {searchHistory.length > 0 && (
                      <button
                        onClick={clearHistory}
                        title="Clear History"
                        className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {searchHistory.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 italic font-sans">
                        No operations performed in the current session.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 font-sans">
                      {searchHistory.map((pastQuery, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => {
                            const lPast = pastQuery.toLowerCase();
                            if (lPast.includes("htn") || lPast.includes("hypertension")) {
                              handleSelectDisease("hypertension");
                            } else if (lPast.includes("diabetes") || lPast.includes("t2dm")) {
                              handleSelectDisease("diabetes_mellitus");
                            } else if (lPast.includes("cholesterol") || lPast.includes("hyperlipidemia")) {
                              handleSelectDisease("hyperlipidemia");
                            } else if (lPast.includes("asthma") || lPast.includes("copd")) {
                              handleSelectDisease("asthma_copd");
                            } else if (lPast.includes("failure") || lPast.includes("heart")) {
                              handleSelectDisease("heart_failure");
                            } else {
                              handleSearchDrug(pastQuery);
                            }
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-50 text-slate-700 rounded text-left text-xs transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                        >
                          <span className="font-medium font-sans truncate">{pastQuery}</span>
                          <ArrowRight className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column block: Saved Monographs Cabinet */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-205 pb-3">
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold font-mono tracking-wider text-slate-700 uppercase">
                        Bookmarked Monographs
                      </h4>
                    </div>
                  </div>

                  {!user ? (
                    <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-250 rounded-lg">
                      <Bookmark className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-[11px] text-slate-500 font-sans leading-normal">
                        Sign in to save drug monographs to your profile secure cabinet.
                      </p>
                      <button
                        onClick={handleLogin}
                        className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        Sign In Now
                      </button>
                    </div>
                  ) : savedMonographs.length === 0 ? (
                    <div className="text-center py-8">
                      <Bookmark className="w-7 h-7 text-slate-350 mx-auto mb-2 stroke-1" />
                      <p className="text-xs text-slate-400 italic">
                        No bookmarked monographs found. Use the "Save to Profile" action on label pages.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 font-sans max-h-[175px] overflow-y-auto pr-1">
                      {savedMonographs.map((savedDoc) => (
                        <div
                          key={savedDoc.id}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-50 text-slate-700 rounded text-left text-xs transition-colors border border-transparent hover:border-slate-100 group"
                        >
                          <button
                            onClick={() => handleSearchDrug(savedDoc.drugName)}
                            className="flex-1 font-semibold font-sans truncate text-left focus:outline-hidden cursor-pointer"
                          >
                            {savedDoc.drugName}
                            <span className="text-[9px] text-slate-400 block font-normal leading-none font-mono mt-0.5">
                              RxCUI: {savedDoc.rxcui}
                            </span>
                          </button>
                          <button
                            onClick={() => handleRemoveSavedMonograph(savedDoc.id)}
                            className="p-1 rounded text-slate-350 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove from bookmarks"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column block: Pharmacist reference usage notes */}
                <div className="lg:col-span-1 bg-slate-900 text-white rounded-xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 opacity-[0.03]">
                    <Activity className="w-64 h-64 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-emerald-400 tracking-widest uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Quick Reference
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed mt-2 font-sans">
                      This system performs a real-time spellcheck and suggestion match using approximate term algorithms. Multiple components are split before executing FDA queries.
                    </p>
                    <p className="text-slate-400 text-[10px] leading-relaxed mt-2.5 border-t border-slate-850 pt-2.5 font-sans">
                      Disclaimer: Built as a rapid-retrieval clinical indexing prototype. All clinical findings must be audited by qualified personnel.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono select-none pt-3">
                    <Heart className="w-2.5 h-2.5 text-rose-500 shrink-0 animate-pulse" />
                    <span>Dedicated clinical support terminal.</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* Trust Signatory Footer */}
      <footer id="clinical-footer" className="bg-white border-t border-slate-200 py-6 text-center select-none">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-500 font-mono">
          <p>© 2026 Clinical Pharmacy Decision Framework. Standardized via NIH REST API and openFDA label repositories.</p>
          <p className="mt-1 text-[10px] text-slate-405">All data represents active public FDA packages for clinical study.</p>
        </div>
      </footer>

    </div>
  );
}
