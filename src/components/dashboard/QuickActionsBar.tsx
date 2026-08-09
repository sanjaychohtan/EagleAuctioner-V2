import React, { useState } from "react";
import { 
  Plus, 
  UserPlus, 
  Upload, 
  FileText, 
  Award, 
  RefreshCw, 
  Lock, 
  Megaphone, 
  Database, 
  Download, 
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useAuth } from "../../context/AuthContext";

interface QuickActionsBarProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
  onTriggerAction: (action: string, payload?: any) => void;
}

export function QuickActionsBar({ themeMode, showToast, onTriggerAction }: QuickActionsBarProps) {
  const { hasPermission } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form States
  const [auctionForm, setAuctionForm] = useState({ title: "", startPrice: "", category: "Metals", endTime: "" });
  const [sellerForm, setSellerForm] = useState({ company: "", gstin: "", email: "", rating: "A+" });
  const [walletForm, setWalletForm] = useState({ source: "Executive Account", dest: "Escrow Pool", amount: "" });
  const [emdForm, setEmdForm] = useState({ lotId: "", amount: "", bank: "State Bank of India" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", priority: "INFO", message: "" });
  
  const handleClose = () => {
    setActiveModal(null);
    // Reset forms
    setAuctionForm({ title: "", startPrice: "", category: "Metals", endTime: "" });
    setSellerForm({ company: "", gstin: "", email: "", rating: "A+" });
    setWalletForm({ source: "Executive Account", dest: "Escrow Pool", amount: "" });
    setEmdForm({ lotId: "", amount: "", bank: "State Bank of India" });
    setAnnouncementForm({ title: "", priority: "INFO", message: "" });
  };

  const submitAction = (e: React.FormEvent, type: string) => {
    e.preventDefault();
    if (type === "auction") {
      if (!auctionForm.title || !auctionForm.startPrice) {
        showToast("Please fill in all mandatory fields", "warning");
        return;
      }
      onTriggerAction("create-lot", { title: auctionForm.title, amount: Number(auctionForm.startPrice) });
      showToast(`Created new auction: ${auctionForm.title}`, "success");
    } else if (type === "seller") {
      if (!sellerForm.company || !sellerForm.gstin) {
        showToast("Company name and GSTIN are required", "warning");
        return;
      }
      onTriggerAction("create-seller", sellerForm);
      showToast(`Registered enterprise seller: ${sellerForm.company}`, "success");
    } else if (type === "wallet") {
      const amt = Number(walletForm.amount);
      if (!walletForm.amount || amt <= 0) {
        showToast("Please enter a valid transfer amount", "warning");
        return;
      }
      onTriggerAction("approve-finance-payout", { amount: amt, to: walletForm.dest });
      showToast(`Authorized transfer of ₹${amt.toLocaleString()} to ${walletForm.dest}`, "success");
    } else if (type === "emd") {
      const amt = Number(emdForm.amount);
      if (!emdForm.lotId || !emdForm.amount || amt <= 0) {
        showToast("Lot ID and a valid EMD amount are required", "warning");
        return;
      }
      onTriggerAction("deposit-emd", { amount: amt, title: `Lot #${emdForm.lotId}` });
      showToast(`EMD of ₹${amt.toLocaleString()} locked for Lot #${emdForm.lotId}`, "success");
    } else if (type === "announcement") {
      if (!announcementForm.title || !announcementForm.message) {
        showToast("Title and broadcast message are required", "warning");
        return;
      }
      onTriggerAction("trigger-broadcast", announcementForm);
      showToast(`Dispatched alert: ${announcementForm.title}`, "info");
    }
    handleClose();
  };

  const triggerDirectAction = (name: string, successMsg: string) => {
    onTriggerAction(name);
    showToast(successMsg, "success");
  };

  const allActionItems = [
    { id: "create-auction", label: "Create Auction", icon: Plus, desc: "Add live lot", color: "text-blue-500 hover:bg-blue-500/10", permission: "auction.create" },
    { id: "create-seller", label: "Create Seller", icon: UserPlus, desc: "Onboard partner", color: "text-indigo-500 hover:bg-indigo-500/10" },
    { id: "upload-catalogue", label: "Upload Catalogue", icon: Upload, desc: "Bulk CSV list", color: "text-cyan-500 hover:bg-cyan-500/10", direct: true, action: "upload-catalogue", success: "Catalogs processed: 42 new lots imported" },
    { id: "generate-invoice", label: "Generate Invoice", icon: FileText, desc: "Tax GST compliant", color: "text-amber-500 hover:bg-amber-500/10", direct: true, action: "generate-invoice", success: "Dual signature commercial invoice generated" },
    { id: "declare-winner", label: "Declare Winner", icon: Award, desc: "Lock bid pricing", color: "text-emerald-500 hover:bg-emerald-500/10", direct: true, action: "declare-winner", success: "Winner declared: Lot #402 resolved to JSW Steel" },
    { id: "transfer-wallet", label: "Transfer Wallet", icon: RefreshCw, desc: "Rebalance pool", color: "text-purple-500 hover:bg-purple-500/10" },
    { id: "deposit-emd", label: "Deposit EMD", icon: Lock, desc: "Freeze security", color: "text-pink-500 hover:bg-pink-500/10" },
    { id: "create-announcement", label: "Announcement", icon: Megaphone, desc: "WebSocket alert", color: "text-orange-500 hover:bg-orange-500/10" },
    { id: "bulk-import", label: "Bulk Import", icon: Database, desc: "Drizzle seed", color: "text-teal-500 hover:bg-teal-500/10", direct: true, action: "seed-data", success: "Re-seeded database schema with 60 lot objects" },
    { id: "export-report", label: "Export Report", icon: Download, desc: "Audit excel", color: "text-red-500 hover:bg-red-500/10", direct: true, action: "export-pdf", success: "Secured audit ledger downloaded as signed PDF" },
  ];

  const actionItems = allActionItems.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
          themeMode === "dark" ? "text-slate-400" : "text-slate-500"
        }`}>
          Operational Command Center
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">10 Hotkey Actions</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
        {actionItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.direct) {
                  triggerDirectAction(item.action!, item.success!);
                } else {
                  setActiveModal(item.id);
                }
              }}
              className={`p-3 rounded-xl border flex flex-col items-center text-center justify-center transition-all cursor-pointer group ${
                themeMode === "dark" 
                  ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700" 
                  : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all mb-1.5 ${item.color}`}>
                <Icon className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
              </div>
              <span className={`text-[10px] font-bold tracking-tight block leading-tight ${
                themeMode === "dark" ? "text-slate-300" : "text-slate-700"
              }`}>{item.label}</span>
              <span className="text-[8px] text-slate-400 block truncate w-full mt-0.5">{item.desc}</span>
            </button>
          );
        })}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl overflow-hidden ${
                themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center">
                    <Database className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-sm font-bold font-mono">
                    {activeModal === "create-auction" && "Launch Live Auction"}
                    {activeModal === "create-seller" && "Onboard Partner Seller"}
                    {activeModal === "transfer-wallet" && "Inter-Wallet Transfer Desk"}
                    {activeModal === "deposit-emd" && "Freeze Earnest Money Deposit (EMD)"}
                    {activeModal === "create-announcement" && "Disseminate WebSocket Broadcast"}
                  </h4>
                </div>
                <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Content */}
              {activeModal === "create-auction" && (
                <form onSubmit={(e) => submitAction(e, "auction")} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lot Description Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Copper Scrap Cathodes (Grade-A)"
                      value={auctionForm.title}
                      onChange={e => setAuctionForm({...auctionForm, title: e.target.value})}
                      className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-blue-500 ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Price (INR)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 750000"
                        value={auctionForm.startPrice}
                        onChange={e => setAuctionForm({...auctionForm, startPrice: e.target.value})}
                        className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-blue-500 ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Commodity Category</label>
                      <select
                        value={auctionForm.category}
                        onChange={e => setAuctionForm({...auctionForm, category: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <option>Metals</option>
                        <option>Energy & Coal</option>
                        <option>Chemicals</option>
                        <option>Agri-commodities</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bid Closing Date/Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={auctionForm.endTime}
                      onChange={e => setAuctionForm({...auctionForm, endTime: e.target.value})}
                      className={`w-full text-xs font-mono px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/10">
                    Authorize and Publish Lot
                  </button>
                </form>
              )}

              {activeModal === "create-seller" && (
                <form onSubmit={(e) => submitAction(e, "seller")} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered Corporate Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Metallics Salvage Corp"
                      value={sellerForm.company}
                      onChange={e => setSellerForm({...sellerForm, company: e.target.value})}
                      className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State GSTIN Identification</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 27AAAAA0000A1Z1"
                      value={sellerForm.gstin}
                      onChange={e => setSellerForm({...sellerForm, gstin: e.target.value})}
                      className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Support Email</label>
                      <input
                        type="email"
                        required
                        placeholder="compliance@tata.com"
                        value={sellerForm.email}
                        onChange={e => setSellerForm({...sellerForm, email: e.target.value})}
                        className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sovereign Rating</label>
                      <select
                        value={sellerForm.rating}
                        onChange={e => setSellerForm({...sellerForm, rating: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <option>AAA</option>
                        <option>AA+</option>
                        <option>A+</option>
                        <option>BBB</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer">
                    Verify & Onboard Seller Node
                  </button>
                </form>
              )}

              {activeModal === "transfer-wallet" && (
                <form onSubmit={(e) => submitAction(e, "wallet")} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Debit Account Source</label>
                      <select
                        value={walletForm.source}
                        onChange={e => setWalletForm({...walletForm, source: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <option>Executive Account</option>
                        <option>Liquid Floating Cache</option>
                        <option>GST Ledger Vault</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credit Account Destination</label>
                      <select
                        value={walletForm.dest}
                        onChange={e => setWalletForm({...walletForm, dest: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <option>Escrow Pool</option>
                        <option>SBI Clearing Gateway</option>
                        <option>Permanent EMD Registry</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transfer Capital (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500000"
                      value={walletForm.amount}
                      onChange={e => setWalletForm({...walletForm, amount: e.target.value})}
                      className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-2.5 items-start text-[10px] text-slate-400">
                    <Building2 className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>Transfers require a Maker-Checker ledger signature and SBI clearing gateway response inside 2 minutes.</span>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer">
                    Initiate Wire Rebalancing
                  </button>
                </form>
              )}

              {activeModal === "deposit-emd" && (
                <form onSubmit={(e) => submitAction(e, "emd")} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Lot ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 402"
                        value={emdForm.lotId}
                        onChange={e => setEmdForm({...emdForm, lotId: e.target.value})}
                        className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clearing Bank</label>
                      <select
                        value={emdForm.bank}
                        onChange={e => setEmdForm({...emdForm, bank: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <option>State Bank of India</option>
                        <option>HDFC Bank Corporate</option>
                        <option>ICICI Bank Gate 1</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">EMD Security Sum (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1500000"
                      value={emdForm.amount}
                      onChange={e => setEmdForm({...emdForm, amount: e.target.value})}
                      className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-2.5 items-start text-[10px] text-slate-400">
                    <Lock className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Sovereign EMD deposits are frozen in the escrow sub-pool until the bid lot is officially closed or refunded.</span>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer">
                    Wire Lock Security Deposit
                  </button>
                </form>
              )}

              {activeModal === "create-announcement" && (
                <form onSubmit={(e) => submitAction(e, "announcement")} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Broadcast Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SBI Server Maintenance"
                        value={announcementForm.title}
                        onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Channel Priority</label>
                      <select
                        value={announcementForm.priority}
                        onChange={e => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                        className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <option>INFO</option>
                        <option>WARNING</option>
                        <option>CRITICAL</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Dispatch Message</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Type the message that will display across all active bidder connections immediately..."
                      value={announcementForm.message}
                      onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                      className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer">
                    Dispatch Real-Time WebSocket Alerts
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
