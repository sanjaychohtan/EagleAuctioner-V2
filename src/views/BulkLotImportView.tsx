import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails } from "../hooks/useAuctionQueries";
import { useNotification } from "../providers/NotificationProvider";
import { AuctionService } from "../api/auctionService";
import { handleApiError } from "../api/errorHandler";
import { AuctionState } from "../types/auction";
import {
  ArrowLeft,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Download
} from "lucide-react";

export const BulkLotImportView: React.FC = () => {
  const { id: auctionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: auction, isLoading, isError } = useAuctionDetails(auctionId || "");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!hasRole("SELLER")) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Access Restrained</p>
        <p className="text-slate-400">Only SELLER credentials can manage lots.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg cursor-pointer font-bold"
        >
          Return to Manifest
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>INITIALIZING IMPORT ENGINE...</span>
      </div>
    );
  }

  if (isError || !auction || (auction.state !== AuctionState.DRAFT && auction.state !== AuctionState.REJECTED)) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Invalid Campaign State</p>
        <p className="text-slate-400">Campaign must be in DRAFT mode to import lots.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Manifest
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        showNotification("Only .xlsx or .csv files are supported.", "error");
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !auctionId) return;
    setIsUploading(true);
    try {
      await AuctionService.importLots(auctionId, selectedFile);
      setUploadSuccess(true);
      showNotification("Bulk import successfully uploaded and processed.", "success");
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(`Bulk import failed: ${friendly.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-mono text-xs">
      {/* Back Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-slate-800/40">
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Data Ingestion</span>
          <h2 className="text-lg font-bold text-white">BULK LOT IMPORT</h2>
        </div>
      </div>

      {!uploadSuccess ? (
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl bg-slate-950/50 transition-colors">
              <FileSpreadsheet className="h-10 w-10 text-slate-500 mb-4" />
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.csv"
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="text-center space-y-2">
                  <p className="text-emerald-400 font-bold">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Select different file
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-slate-300">Drag and drop your manifest file here, or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 text-white rounded-lg cursor-pointer transition-all"
                  >
                    Browse Files
                  </button>
                  <p className="text-[10px] text-slate-500">Supported formats: .xlsx, .csv</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-3 text-indigo-400">
                <Download className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-bold">Need the standard template?</span>
                  <span className="text-[10px] text-indigo-300/70">Download our enterprise specification format.</span>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 rounded-lg cursor-pointer transition-all">
                Download .xlsx
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate(`/auctions/${auctionId}/lots`)}
              className="px-5 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/60 rounded-xl font-bold uppercase text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Manifest</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Ingestion Complete</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            The manifest has been processed successfully. All valid records have been drafted as lots.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate(`/auctions/${auctionId}/lots`)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
            >
              View Updated Manifest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkLotImportView;
