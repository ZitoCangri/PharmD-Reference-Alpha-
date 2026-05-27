/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Layers,
  Activity,
  ShieldAlert,
  Info,
  ExternalLink,
  BookOpen,
  Clipboard,
  CheckCircle,
  Stethoscope,
  Printer,
  FileCheck,
  Bookmark,
  Loader2
} from "lucide-react";
import { openFDALabel, NormalizedDrug } from "../types";

interface DrugMonographViewProps {
  normalized: NormalizedDrug;
  label: openFDALabel;
  searchStrategy: string;
  isLoggedIn: boolean;
  isSaved: boolean;
  onSaveToggle: () => void;
  isSaving?: boolean;
}

export function DrugMonographView({ 
  normalized, 
  label, 
  searchStrategy,
  isLoggedIn,
  isSaved,
  onSaveToggle,
  isSaving = false
}: DrugMonographViewProps) {
  // Accordion active state trackers - default all open for dense overview, or default closed
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    moa: true,
    pk: true,
    contra: true,
    adverse: true,
    dosage: false,
    warnings: false,
    interactions: false,
    specific: false
  });

  const [copied, setCopied] = useState(false);

  // Scroll to view on load
  useEffect(() => {
    const el = document.getElementById("clinical-monograph-start");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [normalized]);

  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = () => {
    const textData = `
DRUG CLINICAL MONOGRAPH: ${normalized.normalizedName}
-----------------------------------------------------------
RxCUI: ${normalized.rxcui}
Normalized Active Ingredient: ${normalized.normalizedName}
openFDA Search Strategy Used: ${searchStrategy}

INDICATIONS & USAGE:
${(label.indications_and_usage || ["Not Specified"]).join("\n")}

CONTRAINDICATIONS:
${(label.contraindications || ["None Specified"]).join("\n")}

ADVERSE REACTIONS:
${(label.adverse_reactions || ["None Specified"]).join("\n")}

MECHANISM OF ACTION:
${(label.mechanism_of_action || ["Not Specified"]).join("\n")}

PHARMACOKINETICS:
${(label.pharmacokinetics || ["Not Specified"]).join("\n")}
    `;
    navigator.clipboard.writeText(textData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse and render raw FDA text cleanly
  const renderFDASectionContent = (paragraphs: string[] | undefined, fallbackText = "Not reported in active FDA package labeling filings.") => {
    if (!paragraphs || paragraphs.length === 0) {
      return (
        <p className="text-xs text-slate-500 italic font-sans">
          {fallbackText}
        </p>
      );
    }

    // Join and split text into clean nodes
    const contentText = paragraphs.join("\n\n");
    const sections = contentText.split(/\n\n+/).filter(p => p.trim());

    return (
      <div className="space-y-3">
        {sections.map((pText, idx) => {
          const trimText = pText.trim();
          
          // Check if this paragraph is likely a numbered header or sub-section title
          const isSectionHeader = /^[0-9]\.?[0-9]?\s*[A-Z\s]{4,}/.test(trimText) || (trimText.length < 100 && trimText === trimText.toUpperCase() && !trimText.includes("."));
          
          if (isSectionHeader) {
            return (
              <h5 key={idx} className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mt-3 font-sans tracking-wide uppercase">
                {trimText}
              </h5>
            );
          }

          // Check if bullet point lists exist
          if (trimText.startsWith("•") || trimText.startsWith("*") || trimText.startsWith("-")) {
            const listItems = trimText.split(/[\n•*-]+/).map(item => item.trim()).filter(Boolean);
            return (
              <ul key={idx} className="list-disc pl-5 py-1.5 space-y-1.5 text-xs text-slate-700 font-sans leading-relaxed">
                {listItems.map((li, liIdx) => (
                  <li key={liIdx}>{li}</li>
                ))}
              </ul>
            );
          }

          return (
            <p key={idx} className="text-xs text-slate-700 leading-relaxed font-sans text-justify">
              {trimText}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="clinical-monograph-start"
      className="max-w-6xl mx-auto my-6 px-4 animate-in fade-in duration-300"
    >
      {/* Monograph Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-805" />
          <h3 className="text-sm font-bold font-mono tracking-wider text-slate-650 uppercase">
            Drug Monograph Visualizer
          </h3>
          <span className="text-xs bg-slate-100 text-slate-750 font-mono border border-slate-200 px-2 py-0.5 rounded">
            FDA Source Verified
          </span>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden lg:inline text-xs text-slate-450 font-mono pr-2">
            Active Fetch Pipeline: {searchStrategy}
          </span>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-705 hover:bg-slate-50 transition-colors rounded-lg text-xs font-mono font-medium cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>[ COPIED! ]</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>[ COPY TEXT ]</span>
              </>
            )}
          </button>
          
          {isLoggedIn ? (
            <button
              onClick={onSaveToggle}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors border rounded-lg text-xs font-mono font-medium cursor-pointer ${
                isSaved 
                  ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100/50" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>[ SAVING... ]</span>
                </>
              ) : isSaved ? (
                <>
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>[ MONOGRAPH SAVED ]</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>[ SAVE TO PROFILE ]</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSaveToggle}
              title="Log in to save monographs"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg text-xs font-mono font-medium cursor-pointer hover:bg-slate-100 hover:text-slate-600"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-300" />
              <span>[ SAVE TO PROFILE ]</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-705 hover:bg-slate-50 transition-colors rounded-lg text-xs font-mono font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>[ PRINT MONOGRAPH ]</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Core Content / Right Metadata Cabinet */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: Drug Monograph Substance (3/4 Grid) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Main Clinical Drug Shield Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-2 hover:shadow-xs transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                  Normalized Monograph Record
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-850 font-sans mt-2">
                  {normalized.normalizedName}
                </h2>
                
                {label.brand_name && (
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    <span className="font-semibold text-slate-600">Common Brand Names:</span> {label.brand_name.slice(0, 4).join(", ")}
                  </p>
                )}
              </div>

              {/* RxCUI Tag Desk */}
              <div className="bg-slate-50 border border-slate-150 px-4 py-3 rounded-xl text-left font-mono shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  RxNorm Concept ID
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  {normalized.rxcui}
                </div>
              </div>
            </div>

            {/* Core Classification Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <span className="text-xs font-semibold text-slate-500">Pharmacologic Class (EPC):</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {label.pharm_class_epc ? label.pharm_class_epc[0] : "Multiple / Unspecified classes"}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Known Routes:</span>
                <div className="text-xs font-bold text-blue-600 font-mono tracking-wider mt-0.5 uppercase">
                  {label.route ? label.route.join(", ") : "ORAL / PARENTERAL / MULTIPLE"}
                </div>
              </div>
            </div>
          </div>

          {/* BOXED WARNING WARNING - Absolute Safety Clinical Check */}
          {label.boxed_warning && (
            <div className="border-2 border-red-500 bg-red-50/30 text-red-950 rounded-xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
              <div className="bg-red-650 bg-red-600 text-white px-4 py-2.5 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h4 className="text-xs font-bold tracking-widest font-mono uppercase">
                  WARNING: FDA BOXED WARNING (BLACK BOX)
                </h4>
              </div>
              <div className="p-4 bg-red-50 text-red-900 text-xs leading-relaxed font-sans space-y-1">
                {renderFDASectionContent(label.boxed_warning)}
              </div>
            </div>
          )}

          {/* STANDARD ACCORDION GROUPS */}

          {/* 1. INDICATIONS & USAGE (Shown open as default monograph header) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold tracking-wider font-mono text-slate-805 uppercase">
                  Indications & Usage Clinical Profile
                </h4>
              </div>
              <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                FDA Labeled Index
              </span>
            </div>
            <div className="p-5">
              {renderFDASectionContent(label.indications_and_usage, "No indications information reported.")}
            </div>
          </div>

          {/* Bento Clinical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box A: Mechanism of Action */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-350 transition-colors">
              <button
                onClick={() => toggleAccordion("moa")}
                className="w-full px-4 py-3 border-b border-slate-150 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-xs font-sans text-slate-805 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider font-mono font-bold">Mechanism of Action</span>
                </div>
                {openAccordions.moa ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.moa ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px]">
                  {renderFDASectionContent(label.mechanism_of_action || label.clinical_pharmacology, "Mechanism of action pharmacodynamic profile details not reported under exclusive labels. Refer to pharmacology index.")}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("moa")} className="p-4 py-2 border-t border-slate-100 text-[10px] italic text-slate-400 font-mono text-center hover:bg-slate-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box B: Pharmacokinetics (ADME) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-350 transition-colors">
              <button
                onClick={() => toggleAccordion("pk")}
                className="w-full px-4 py-3 border-b border-slate-150 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-xs font-sans text-slate-805 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider font-mono font-bold">Pharmacokinetics (ADME)</span>
                </div>
                {openAccordions.pk ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.pk ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px]">
                  {renderFDASectionContent(label.pharmacokinetics || label.clinical_pharmacology, "Pharmacokinetic ADME (Absorption, Distribution, Metabolism, Excretion) profile not explicitly itemized in filings. Refer to pharmacodynamics.")}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("pk")} className="p-4 py-2 border-t border-slate-100 text-[10px] italic text-slate-400 font-mono text-center hover:bg-slate-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box C: Contraindications & Hypersensitivities */}
            <div className="bg-red-50/5 rounded-xl border border-red-200 overflow-hidden flex flex-col hover:border-red-305 transition-colors">
              <button
                onClick={() => toggleAccordion("contra")}
                className="w-full px-4 py-3 border-b border-red-100 flex justify-between items-center bg-red-50 hover:bg-red-100/50 transition-colors text-left font-semibold text-xs font-sans text-red-950 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
                  <span className="uppercase tracking-wider font-mono font-bold text-red-805">Contraindications</span>
                </div>
                {openAccordions.contra ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
              </button>
              {openAccordions.contra ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px]">
                  {renderFDASectionContent(label.contraindications, "Contraindications not explicitly reported. Inspect warning labels carefully.")}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("contra")} className="p-4 py-2 border-t border-red-100/30 text-[10px] italic text-red-500 font-mono text-center hover:bg-red-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box D: Adverse Reactions & Side Effects */}
            <div className="bg-amber-50/5 rounded-xl border border-amber-200 overflow-hidden flex flex-col hover:border-amber-305 transition-colors">
              <button
                onClick={() => toggleAccordion("adverse")}
                className="w-full px-4 py-3 border-b border-amber-100 flex justify-between items-center bg-amber-50 hover:bg-amber-100/50 transition-colors text-left font-semibold text-xs font-sans text-slate-900 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="uppercase tracking-wider font-mono font-bold text-slate-805">Adverse Reactions</span>
                </div>
                {openAccordions.adverse ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.adverse ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px]">
                  {renderFDASectionContent(label.adverse_reactions, "No adverse reactions profile listed in label filing packages.")}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("adverse")} className="p-4 py-2 border-t border-amber-100/30 text-[10px] italic text-amber-600 font-mono text-center hover:bg-amber-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box E: Dosage Forms & Strengths */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-350 transition-colors">
              <button
                onClick={() => toggleAccordion("dosage")}
                className="w-full px-4 py-3 border-b border-slate-150 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-xs font-sans text-slate-905 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider font-mono font-bold text-slate-805">Dosage & Strengths</span>
                </div>
                {openAccordions.dosage ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.dosage ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px] space-y-4">
                  <div>
                    <h5 className="font-mono font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-1.5">Administration Protocols</h5>
                    {renderFDASectionContent(label.dosage_and_administration)}
                  </div>
                  {label.dosage_forms_and_strengths && (
                    <div className="border-t border-slate-100 pt-3">
                      <h5 className="font-mono font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-1.5 font-sans">Dosage Forms</h5>
                      {renderFDASectionContent(label.dosage_forms_and_strengths)}
                    </div>
                  )}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("dosage")} className="p-4 py-2 border-t border-slate-100 text-[10px] italic text-slate-400 font-mono text-center hover:bg-slate-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box F: Warnings & Clinical Cautions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-350 transition-colors">
              <button
                onClick={() => toggleAccordion("warnings")}
                className="w-full px-4 py-3 border-b border-slate-150 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-xs font-sans text-slate-900 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider font-mono font-bold text-slate-805">Warnings & Cautions</span>
                </div>
                {openAccordions.warnings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.warnings ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px]">
                  {renderFDASectionContent(label.warnings_and_cautions, "Warnings and precautions not itemized under this package.")}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("warnings")} className="p-4 py-2 border-t border-slate-100 text-[10px] italic text-slate-400 font-mono text-center hover:bg-slate-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box G: Drug Interactions */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-350 transition-colors">
              <button
                onClick={() => toggleAccordion("interactions")}
                className="w-full px-4 py-3 border-b border-slate-150 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-xs font-sans text-slate-900 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider font-mono font-bold text-slate-805">Drug Interactions</span>
                </div>
                {openAccordions.interactions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.interactions ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px]">
                  {renderFDASectionContent(label.drug_interactions, "Pharmacological interactions not reported under specific listings.")}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("interactions")} className="p-4 py-2 border-t border-slate-100 text-[10px] italic text-slate-400 font-mono text-center hover:bg-slate-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

            {/* Box H: Special Populations */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-350 transition-colors">
              <button
                onClick={() => toggleAccordion("specific")}
                className="w-full px-4 py-3 border-b border-slate-150 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-xs font-sans text-slate-900 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider font-mono font-bold text-slate-805">Special Populations</span>
                </div>
                {openAccordions.specific ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openAccordions.specific ? (
                <div className="p-4 text-xs leading-relaxed text-slate-705 overflow-y-auto max-h-[300px] space-y-4">
                  {label.pregnancy && (
                    <div>
                      <h5 className="font-mono font-bold text-[10px] uppercase text-blue-650 tracking-wider mb-1">Pregnancy Risk & Lactation</h5>
                      {renderFDASectionContent(label.pregnancy)}
                    </div>
                  )}
                  {label.pediatric_use && (
                    <div className="border-t border-slate-100 pt-3">
                      <h5 className="font-mono font-bold text-[10px] uppercase text-blue-650 tracking-wider mb-1">Pediatric Indications</h5>
                      {renderFDASectionContent(label.pediatric_use)}
                    </div>
                  )}
                  {label.geriatric_use && (
                    <div className="border-t border-slate-100 pt-3">
                      <h5 className="font-mono font-bold text-[10px] uppercase text-blue-650 tracking-wider mb-1">Geriatric Considerations</h5>
                      {renderFDASectionContent(label.geriatric_use)}
                    </div>
                  )}
                </div>
              ) : (
                <div onClick={() => toggleAccordion("specific")} className="p-4 py-2 border-t border-slate-100 text-[10px] italic text-slate-400 font-mono text-center hover:bg-slate-50 cursor-pointer">
                  Click to expand section
                </div>
              )}
            </div>

          </div>

          {/* PATIENT COUNSELING BLOCK */}
          {label.patient_counseling_information && (
            <div className="bg-blue-50/30 border border-blue-200/50 rounded-xl p-5 space-y-3 shadow-3xs hover:border-slate-350 transition-colors">
              <h4 className="text-xs font-bold tracking-wider font-mono text-slate-805 uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-605 text-blue-600" />
                Pharmacist Patient Counseling Guidance
              </h4>
              <div className="text-xs text-slate-705 leading-relaxed font-sans">
                {renderFDASectionContent(label.patient_counseling_information)}
              </div>
            </div>
          )}

          {/* REFERENCE STUDIES */}
          {label.clinical_studies && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
              <h4 className="text-xs font-bold font-mono tracking-wider text-slate-705 uppercase">
                FDA Clinical Trial Registrations
              </h4>
              <div className="text-xs text-slate-655 font-sans">
                {renderFDASectionContent(label.clinical_studies)}
              </div>
            </div>
          )}

          {/* Bento Grid Footer Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center pt-2">
            <button
              onClick={() => toggleAccordion("interactions")}
              className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg py-2.5 text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest cursor-pointer text-center"
            >
              Check Drug Interactions
            </button>
            <button
              onClick={() => toggleAccordion("dosage")}
              className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg py-2.5 text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase tracking-widest cursor-pointer text-center"
            >
              Dosage Forms & Strengths
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-xs font-bold hover:bg-blue-700 transition-colors uppercase tracking-widest cursor-pointer text-center"
            >
              Print Clinical Summary
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Metadata Cabinet / Quick specs (1/4 Grid) */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4">
          
          {/* Diagnostic Stats Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-3xs">
            <h4 className="text-[11px] font-bold font-mono text-slate-450 tracking-widest uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Product Indexes
            </h4>

            {/* Manufacturer Details */}
            {label.manufacturer_name && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Manufacturer</span>
                <div className="text-xs font-bold text-slate-800 font-sans mt-0.5 uppercase break-words">
                  {label.manufacturer_name[0]}
                </div>
              </div>
            )}

            {/* SPL Identifiers */}
            {label.spl_id && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">FDA SPL Identifier</span>
                <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5 truncate select-all" title={label.spl_id}>
                  {label.spl_id}
                </div>
              </div>
            )}

            {/* UNII Codes */}
            {label.unii && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Core Substance UNII</span>
                <div className="text-xs font-mono text-slate-700 mt-0.5 leading-tight flex flex-wrap gap-1">
                  {label.unii.slice(0, 5).map((code) => (
                    <span key={code} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase text-slate-605">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product NDC List */}
            {label.product_ndc && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">National Drug Codes (NDC)</span>
                <div className="text-xs font-mono text-slate-600 mt-1 space-y-1">
                  {label.product_ndc.slice(0, 5).map((ndc, ndIdx) => (
                    <div key={ndIdx} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] font-medium uppercase select-all">
                      <span>{ndc}</span>
                    </div>
                  ))}
                  {label.product_ndc.length > 5 && (
                    <div className="text-[9px] text-slate-400 text-center italic mt-1 pb-0.5">
                      + {label.product_ndc.length - 5} more packaged NDCs
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FDA Public Link */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href={`https://referencemodels.fda.gov/`}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noreferrer"
                className="w-full flex items-center justify-between text-[11px] text-blue-600 hover:text-blue-700 font-medium font-mono hover:underline group"
              >
                <span>OPEN OFFICIAL FDA ACCESS</span>
                <ExternalLink className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Monograph Navigation Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-xs">
            <h4 className="text-[10px] font-bold font-mono text-slate-400 tracking-widest uppercase border-b border-slate-100 pb-2">
              Monograph Table of Contents
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <button
                onClick={() => toggleAccordion("moa")}
                className="w-full flex items-center justify-between py-1 px-1 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[11px] tracking-tight">Mechanism of Action</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${openAccordions.moa ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-100 text-slate-400"}`}>
                  {openAccordions.moa ? "ON" : "OFF"}
                </span>
              </button>
              <button
                onClick={() => toggleAccordion("pk")}
                className="w-full flex items-center justify-between py-1 px-1 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[11px] tracking-tight">Pharmacokinetics</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${openAccordions.pk ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-100 text-slate-400"}`}>
                  {openAccordions.pk ? "ON" : "OFF"}
                </span>
              </button>
              <button
                onClick={() => toggleAccordion("contra")}
                className="w-full flex items-center justify-between py-1 px-1 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[11px] tracking-tight">Contraindications</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${openAccordions.contra ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-100 text-slate-400"}`}>
                  {openAccordions.contra ? "ON" : "OFF"}
                </span>
              </button>
              <button
                onClick={() => toggleAccordion("adverse")}
                className="w-full flex items-center justify-between py-1 px-1 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[11px] tracking-tight">Adverse Reactions</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${openAccordions.adverse ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-slate-100 text-slate-400"}`}>
                  {openAccordions.adverse ? "ON" : "OFF"}
                </span>
              </button>
            </div>
            <div className="pt-2 text-[9px] text-slate-400 font-mono text-center">
              Click toggles to expand/collapse sections.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
