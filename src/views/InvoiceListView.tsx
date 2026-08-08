import React, { useState, useMemo } from "react";
import { useInvoices } from "../hooks/useFinanceQueries";
import { useNotification } from "../providers/NotificationProvider";
import { formatCurrency } from "../utils/bidUtils";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowDownToLine,
  Printer,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEMO_INVOICES = [
  { invoiceId: "INV-FEES-101", invoiceNumber: "EA/FEE/2026/0091", type: "FEE_INVOICE", amount: 7500, taxAmount: 1350, totalAmount: 8850, currency: "INR", status: "PAID", issuedTo: "SEL_MUMBAI_01", issuedDate: "2026-06-30T01:15:00Z", dueDate: "2026-07-05T01:15:00Z" },
  { invoiceId: "INV-GST-101", invoiceNumber: "EA/GST/2026/0401", type: "GST_INVOICE", amount: 1350, taxAmount: 0, totalAmount: 1350, currency: "INR", status: "UNPAID", issuedTo: "SEL_MUMBAI_01", issuedDate: "2026-06-30T01:15:00Z", dueDate: "2026-07-05T01:15:00Z" },
  { invoiceId: "INV-FEES-102", invoiceNumber: "EA/FEE/2026/0092", type: "FEE_INVOICE", amount: 14000, taxAmount: 2520, totalAmount: 16520, currency: "INR", status: "UNPAID", issuedTo: "SEL_DELHI_22", issuedDate: "2026-06-30T03:30:00Z", dueDate: "2026-07-05T03:30:00Z" },
  { invoiceId: "INV-FEES-103", invoiceNumber: "EA/FEE/2026/0088", type: "FEE_INVOICE", amount: 32000, taxAmount: 5760, totalAmount: 37760, currency: "INR", status: "PAID", issuedTo: "SEL_MUMBAI_01", issuedDate: "2026-06-28T09:00:00Z", dueDate: "2026-07-03T09:00:00Z" }
];

export const InvoiceListView: React.FC = () => {
  const { showNotification } = useNotification();
  const { data: serverInvoices, isLoading, refetch, isFetching } = useInvoices();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const invoices = useMemo(() => {
    return (serverInvoices && serverInvoices.length > 0) ? serverInvoices : DEMO_INVOICES;
  }, [serverInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.issuedTo.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
      const matchType = typeFilter === "ALL" || inv.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [invoices, search, statusFilter, typeFilter]);

  const handleDownload = (inv: any) => {
    showNotification(`Downloading PDF for Invoice ${inv.invoiceNumber}...`, "info");
    // Simulate downloading PDF file
    setTimeout(() => {
      showNotification(`Invoice PDF successfully saved to disk.`, "success");
    }, 1000);
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="invoice-list-view">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">BILLING & TAX INVOICE ARCHIVE</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-1">
            System generated fee commissions & GST invoices mapping to platform sales and bidding activities
          </p>
        </div>
        <div>
          <button 
            onClick={() => {
              refetch();
              showNotification("Invoices updated from system ledger.", "success");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-indigo-500 bg-slate-900 rounded text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Sync Documents
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Search Invoices</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Invoice Number, Client ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Document Type</label>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="FEE_INVOICE">FEE INVOICE</option>
            <option value="GST_INVOICE">GST INVOICE</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Status</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="PAID">PAID / DISCHARGED</option>
            <option value="UNPAID">UNPAID / OUTSTANDING</option>
            <option value="VOID">VOID / CANCELLED</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-900/40 border border-slate-800/85 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Invoice ID</th>
              <th className="p-4">Serial Number</th>
              <th className="p-4">Document Type</th>
              <th className="p-4">Billed Recipient</th>
              <th className="p-4 text-right">Taxable Amount</th>
              <th className="p-4 text-right">IGST Levy</th>
              <th className="p-4 text-right">Total Invoice Sum</th>
              <th className="p-4 text-center">Payment Status</th>
              <th className="p-4">Issued Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredInvoices.map((inv) => (
              <tr key={inv.invoiceId} className="hover:bg-slate-900/30 transition-colors">
                <td className="p-4 font-bold text-slate-400">{inv.invoiceId}</td>
                <td className="p-4 font-bold text-slate-200">{inv.invoiceNumber}</td>
                <td className="p-4 font-bold text-indigo-400 uppercase text-[10px]">{inv.type.replace("_", " ")}</td>
                <td className="p-4 font-mono text-slate-400">{inv.issuedTo}</td>
                <td className="p-4 text-right font-mono text-slate-300">{formatCurrency(inv.amount, inv.currency)}</td>
                <td className="p-4 text-right font-mono text-slate-500">{formatCurrency(inv.taxAmount, inv.currency)}</td>
                <td className="p-4 text-right font-bold font-mono text-slate-200">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    inv.status === "PAID" 
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                      : inv.status === "UNPAID"
                      ? "bg-red-950/40 text-red-400 border-red-900/50"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{new Date(inv.issuedDate).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1 px-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded uppercase font-bold text-[9px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Eye className="h-3 w-3" /> Preview
                    </button>
                    <button 
                      onClick={() => handleDownload(inv)}
                      className="p-1 px-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded uppercase font-bold text-[9px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="h-3 w-3" /> Save PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No invoice documents detected matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INVOICE PREVIEW MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.6 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black" 
              onClick={() => setSelectedInvoice(null)} 
            />
            {/* Content Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-xl shadow-2xl z-10"
            >
              {/* Top decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-indigo-400" /> TAX INVOICE PREVIEW
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">SERIAL NO: {selectedInvoice.invoiceNumber}</p>
                </div>
                <button 
                  onClick={() => setSelectedInvoice(null)} 
                  className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold"
                >
                  X
                </button>
              </div>

              {/* MOCK INVOICE BODY */}
              <div className="space-y-4 bg-slate-950 p-4 border border-slate-850 rounded-lg text-slate-400 font-mono text-[11px] leading-relaxed">
                <div className="flex justify-between border-b border-slate-900 pb-3">
                  <div>
                    <span className="font-bold text-white block text-xs">AUCTBIZ INFRASTRUCTURE</span>
                    <span className="text-[9px] block">Corporate HQ, Bandra Kurla Complex</span>
                    <span className="text-[9px] block">Mumbai, MH - 400051</span>
                    <span className="text-[9px] block">GSTIN: 27AAAAE1102B1Z3</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block text-[10px]">ORIGINAL FOR RECIPIENT</span>
                    <span className="text-[9px] block">Date: {new Date(selectedInvoice.issuedDate).toLocaleString()}</span>
                    <span className="text-[9px] block">Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-b border-slate-900 pb-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Billed To Recipient</span>
                  <span className="font-bold text-white block">{selectedInvoice.issuedTo}</span>
                  <span className="text-[9px] block">Verified Platform Client Escrow Profile</span>
                </div>

                <div className="space-y-2 border-b border-slate-900 pb-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Line Item Particulars</span>
                  <div className="flex justify-between font-bold text-white border-b border-slate-900/60 pb-1">
                    <span>Description</span>
                    <span>Total Amount</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {selectedInvoice.type === "FEE_INVOICE" 
                        ? "Platform service commission levy for bid clearance" 
                        : "Central IGST integrated tax on service clearance"}
                    </span>
                    <span className="font-bold text-slate-300">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                  </div>
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>IGST integrated Levy (18%)</span>
                      <span>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xs font-bold text-white">
                  <span>NET TAXABLE VALUE:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex justify-end gap-2 mt-5">
                <button 
                  onClick={() => window.print()}
                  className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 rounded uppercase font-bold text-[10px] flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button 
                  onClick={() => handleDownload(selectedInvoice)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded uppercase font-bold text-[10px] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" /> Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceListView;
