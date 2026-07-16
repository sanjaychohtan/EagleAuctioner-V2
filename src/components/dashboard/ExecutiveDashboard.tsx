import { useExecutiveDashboard } from "../../hooks/useDashboardQueries";
import React from "react";
import { 
  BarChart, Bar, 
  AreaChart, Area, 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Coins, 
  Gavel, 
  Calendar, 
  Lock, 
  CheckSquare, 
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  Download,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { motion } from "motion/react";
import { KPICardData, ActivityLog, CalendarEvent } from "./DashboardTypes";

interface ExecutiveDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (actionName: string) => void;
}

export function ExecutiveDashboard({
  simulationMode,
  themeMode,
  onTriggerAction
}: ExecutiveDashboardProps) {
  
  
  const { data, isLoading, isError } = useExecutiveDashboard();

  const revenueTrendData = data?.revenueTrend || [];
  const auctionTrendData = data?.auctionTrend || [];
  const categoryDistributionData = data?.categoryDistribution || [];
  const bidActivityData = data?.bidActivity || [];
  const monthlyGrowthData = data?.monthlyGrowth || [];
  const activities = data?.activities || [];
  const calendarEvents = data?.calendarEvents || [];
  const kpiCards = data?.kpiCards || [];

    if (isError || simulationMode === "error") {
    return (
      <div className={`p-6 rounded-2xl ${themeMode === "dark" ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-600"}`}>
        <AlertCircle className="h-6 w-6 mb-2" />
        <h3 className="text-lg font-medium">Failed to load dashboard data</h3>
        <p className="text-sm opacity-80">Please check your connection and try again.</p>
      </div>
    );
  }

  if (isLoading || simulationMode === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={`p-6 rounded-2xl h-24 ${themeMode === "dark" ? "bg-slate-900" : "bg-white"}`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          let IconComp = Gavel;
          if (card.iconName === "Calendar") IconComp = Calendar;
          else if (card.iconName === "CheckSquare") IconComp = CheckSquare;
          else if (card.iconName === "TrendingUp") IconComp = TrendingUp;
          else if (card.iconName === "Coins") IconComp = Coins;
          else if (card.iconName === "Lock") IconComp = Lock;
          else if (card.iconName === "AlertCircle") IconComp = AlertCircle;
          else if (card.iconName === "Users") IconComp = Users;

          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className={`p-4 rounded-xl border relative overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer ${
                themeMode === "dark" 
                  ? "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900" 
                  : "bg-white border-slate-200/80 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-extrabold ${
                  themeMode === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg shrink-0 ${card.colorClass}`}>
                  <IconComp className="h-4 w-4" />
                </div>
              </div>

              <div>
                <span className={`text-xl font-bold font-mono tracking-tight ${
                  themeMode === "dark" ? "text-white" : "text-blue-950"
                }`}>
                  {card.value}
                </span>
                
                <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-mono">
                  {card.changeType === "increase" && (
                    <span className="text-emerald-500 font-bold">▲ {card.change}</span>
                  )}
                  {card.changeType === "decrease" && (
                    <span className="text-red-500 font-bold">▼ {card.change}</span>
                  )}
                  {!card.changeType && (
                    <span className="text-slate-500">{card.change}</span>
                  )}
                  <span className="text-[8px] text-slate-400">• {card.description}</span>
                </div>
              </div>

              {/* LIVE BLINKING DOT ACCENT */}
              {card.id === "kpi-live" && (
                <div className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse m-1" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 3. CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REVENUE AREA CHART (8 cols) */}
        <div className={`lg:col-span-8 p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="flex items-center justify-between border-b pb-4 mb-4 gap-4 flex-wrap">
            <div>
              <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
                themeMode === "dark" ? "text-slate-400" : "text-slate-500"
              }`}>
                Revenue Generation Trend (Weekly)
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Platform commission levies vs state tax accounts</p>
            </div>
            
            <button 
              onClick={() => onTriggerAction("export-pdf")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border rounded-lg transition-all hover:bg-blue-600/10 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> PDF Statement
            </button>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "dark" ? "#1e293b" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: themeMode === "dark" ? "#0f172a" : "#ffffff",
                    borderColor: themeMode === "dark" ? "#1e293b" : "#cbd5e1"
                  }} 
                />
                <Legend iconType="circle" fontSize={10} wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Commission" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCommission)" />
                <Area type="monotone" dataKey="PlatformFees" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPlatform)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DONUT CATEGORY CHART (4 cols) */}
        <div className={`lg:col-span-4 p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              Category Share (GMV)
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Industrial lot distributions</p>
          </div>

          <div className="h-[180px] w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `₹${(val / 100000).toFixed(1)} Lakhs`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute text-center">
              <span className={`text-[10px] uppercase font-mono block ${
                themeMode === "dark" ? "text-slate-500" : "text-slate-400"
              }`}>Total GMV</span>
              <span className={`text-sm font-bold font-mono ${
                themeMode === "dark" ? "text-white" : "text-blue-950"
              }`}>₹1.14 Cr</span>
            </div>
          </div>

          {/* LEGEND CHIPS */}
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            {categoryDistributionData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-400 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECONDARY CHARTS GRID (Three Columns: Auction Trend, Bid Activity, Monthly growth) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BAR CHART: AUCTION TREND */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h4 className={`text-[10px] font-mono uppercase tracking-wider font-extrabold mb-3 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Lot State distribution
          </h4>
          
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auctionTrendData} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "dark" ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip />
                <Bar dataKey="Active" fill="#10b981" stackId="a" />
                <Bar dataKey="Upcoming" fill="#3b82f6" stackId="a" />
                <Bar dataKey="Closed" fill="#94a3b8" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINE CHART: BID PLACEMENT DENSITY */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h4 className={`text-[10px] font-mono uppercase tracking-wider font-extrabold mb-3 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Bid Density & Concurrency
          </h4>
          
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bidActivityData} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "dark" ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip />
                <Line type="monotone" dataKey="BidsPlaced" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="ActiveBidders" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COMBINED MONTHLY GROWTH */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h4 className={`text-[10px] font-mono uppercase tracking-wider font-extrabold mb-3 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Monthly expansion (GMV in Cr)
          </h4>
          
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGrowthData} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "dark" ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip />
                <Bar dataKey="GMV" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. ACTIVITY TIMELINE & CALENDAR WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RECENT ACTIVITY TIMELINE (8 cols) */}
        <div className={`lg:col-span-8 p-6 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold border-b pb-3 mb-4 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Recent Activity Timeline
          </h3>

          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-4 items-start relative group">
                <div className="flex flex-col items-center">
                  <span className={`w-2 h-2 rounded-full inline-block shrink-0 mt-1.5 ring-4 ${
                    act.status === "success" 
                      ? "bg-emerald-400 ring-emerald-500/10" 
                      : act.status === "failed" 
                      ? "bg-red-400 ring-red-500/10" 
                      : "bg-blue-400 ring-blue-500/10"
                  }`} />
                  <span className={`w-0.5 h-12 bg-slate-200 dark:bg-slate-800 group-last:hidden`} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className={`text-[10px] font-bold font-mono ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                      {act.action}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className={`text-xs ${themeMode === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    {act.details}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5 text-[8px] font-mono">
                    <span className="text-slate-400">User: <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.2 rounded">{act.user}</code></span>
                    <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 rounded">{act.slaTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CALENDAR CALENDAR WIDGET (4 cols) */}
        <div className={`lg:col-span-4 p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold border-b pb-3 mb-4 ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              Operational Schedule
            </h3>

            <div className="space-y-3">
              {calendarEvents.map((evt) => (
                <div key={evt.id} className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-[11px] ${
                  themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                }`}>
                  <div className="space-y-0.5 overflow-hidden">
                    <span className={`font-semibold block truncate ${themeMode === "dark" ? "text-slate-200" : "text-slate-700"}`}>{evt.title}</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">{evt.time} • {evt.date}</span>
                  </div>
                  
                  <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    evt.type === "auction_start" 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : evt.type === "payout" 
                      ? "bg-blue-500/15 text-blue-400" 
                      : "bg-purple-500/15 text-purple-400"
                  }`}>
                    {evt.type.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onTriggerAction("add-event")}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer"
          >
            Schedule Launch Event <ArrowRight className="h-3 w-3" />
          </button>
        </div>

      </div>

    </div>
  );
}
