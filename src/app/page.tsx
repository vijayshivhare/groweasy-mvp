"use client";

import React, { useState, useRef } from "react";
import { Upload, ArrowRight, CheckCircle, AlertTriangle, RefreshCw, FileSpreadsheet } from "lucide-react";

// Types matching GrowEasy Assignment Requirements
interface CRMRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
}

interface ApiResponse {
  successfully_parsed: CRMRecord[];
  skipped_records: any[];
  total_imported: number;
  total_skipped: number;
}

export default function CSVImporter() {
  // Step Tracking & State Management
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Preview State (Step 2)
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  
  // AI Loading & Final Response State (Step 3 & 4)
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV locally for the quick preview matrix (No AI yet)
  const parseCSVPreview = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return;

    // Standard CSV split regex handling optional quotes
    const parseRow = (rowText: string) => {
      const matches = rowText.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowText.split(",");
      return matches.map(val => val.replace(/^"|"$/g, "").trim());
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1, 11).map(line => parseRow(line)); // Preview first 10 rows

    setPreviewHeaders(headers);
    setPreviewRows(rows);
    setStep(2); // Progress to preview screen
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      processFileSelection(droppedFile);
    } else {
      setError("Please drop a valid CSV file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFileSelection(selectedFile);
  };

  const processFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        parseCSVPreview(event.target.result as string);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Submit to Backend for AI Extraction (Step 3 -> 4)
  const handleConfirmImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStep(3);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Replace with your actual backend URL once deployed (e.g., Railway/Render)
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api/import";
      
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to process CSV via AI. Check backend logs.");

      const data: ApiResponse = await response.json();
      setFinalResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStep(2); // Send back to preview state so they can try again
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImporter = () => {
    setFile(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setFinalResult(null);
    setError(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-600">GrowEasy CRM</h1>
            <p className="text-slate-500 mt-1">AI-Powered Intelligent CRM CSV Importer</p>
          </div>
          {step > 1 && (
            <button 
              onClick={resetImporter} 
              className="text-sm font-medium bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Start Over
            </button>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* STEP 1: Upload Dropzone */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Step 1: Upload CRM Leads Data</h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-indigo-500 bg-indigo-50/50" 
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full w-14 h-14 mx-auto flex items-center justify-center mb-4">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-base font-semibold text-slate-700">Drag & Drop your CSV file here</p>
              <p className="text-sm text-slate-400 mt-1">or click to browse your local computer files</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md text-xs text-slate-500 font-mono">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Any unstructured CRM schema allowed
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Structural Local Table Preview */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Step 2: File Structure Preview</h2>
                <p className="text-sm text-slate-500">Reviewing raw layout from <span className="font-semibold">{file?.name}</span> before running AI mapping.</p>
              </div>
              <button
                onClick={handleConfirmImport}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Confirm & Run AI Extraction <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Responsive Table with horizontal/vertical scrolling and sticky header */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[450px] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    {previewHeaders.map((header, idx) => (
                      <th key={idx} className="sticky top-0 bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-600 tracking-wider whitespace-nowrap z-10">
                        {header || `Column ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50/70 transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2.5 text-sm text-slate-600 whitespace-nowrap max-w-xs truncate">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: Loading Indicator & AI Batch Processing State */}
        {step === 3 && isProcessing && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-semibold text-slate-800">AI Intelligent Mapping in Progress...</h3>
              <p className="text-sm text-slate-500">
                Parsing, un-nesting records, evaluating conditions, and matching values securely against the GrowEasy CRM schema.
              </p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 mx-auto overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-[70%]"></div>
            </div>
          </div>
        )}

        {/* STEP 4: AI Results Dashboards & Standardized Table */}
        {step === 4 && finalResult && (
          <div className="space-y-6">
            {/* Analytical Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Imported</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{finalResult.total_imported}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Skipped</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{finalResult.total_skipped}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Parsed</p>
                  <p className="text-lg font-bold text-emerald-900">{finalResult.successfully_parsed.length} Records</p>
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800 uppercase tracking-wider">Skipped (No Email/Ph)</p>
                  <p className="text-lg font-bold text-amber-900">{finalResult.skipped_records.length} Records</p>
                </div>
              </div>
            </div>

            {/* Standardized Extracted Table Output */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Step 4: Unified AI Output Rows</h3>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[450px] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      {["Created At", "Name", "Email", "Phone", "Company", "Status", "Source", "Notes"].map((thName) => (
                        <th key={thName} className="sticky top-0 bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-600 tracking-wider whitespace-nowrap z-10">
                          {thName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {finalResult.successfully_parsed.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors text-sm">
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{lead.created_at || "—"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{lead.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{lead.email || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {lead.country_code ? `${lead.country_code} ` : ""}{lead.mobile_without_country_code || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{lead.company || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.crm_status === "SALE_DONE" ? "bg-emerald-100 text-emerald-800" :
                            lead.crm_status === "GOOD_LEAD_FOLLOW_UP" ? "bg-blue-100 text-blue-800" :
                            lead.crm_status === "DID_NOT_CONNECT" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {lead.crm_status || "UNASSIGNED"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{lead.data_source || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={lead.crm_note}>
                          {lead.crm_note || "—"}
                        </td>
                      </tr>
                    ))}
                    {finalResult.successfully_parsed.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                          No valid records were extracted by the AI model.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
