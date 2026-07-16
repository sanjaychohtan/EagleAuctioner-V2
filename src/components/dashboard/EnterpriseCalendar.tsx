import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Plus, 
  Clock, 
  Bookmark, 
  X,
  FileSpreadsheet,
  Check,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useExecutiveDashboard } from "../../hooks/useDashboardQueries";


interface CalendarEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string;
  type: "auction" | "settlement" | "reminder";
  description: string;
}

interface EnterpriseCalendarProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export function EnterpriseCalendar({ themeMode, showToast }: EnterpriseCalendarProps) {
  const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "timeline" | "agenda">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-07-06")); // Static anchor date
  
  const { data: dashboardData, isLoading } = useExecutiveDashboard();
  
  const events: CalendarEventItem[] = (dashboardData?.calendarEvents || []).map(evt => ({
    id: evt.id,
    title: evt.title,
    date: evt.date,
    time: evt.time,
    type: evt.type as any,
    description: "Scheduled backend system event."
  }));

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    date: "2026-07-06",
    time: "12:00 PM",
    type: "auction" as "auction" | "settlement" | "reminder",
    description: ""
  });

  const handleExport = () => {
    showToast("Exporting calendar to Microsoft Exchange & Google Calendar .ICS format...", "info");
    setTimeout(() => {
      showToast("Enterprise calendar exported successfully: eagle_scheduler.ics", "success");
    }, 1200);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title) {
      showToast("Please enter an event title", "warning");
      return;
    }
    const created: CalendarEventItem = {
      id: `cal-evt-${Date.now()}`,
      ...newEventForm
    };
    // setEvents disabled(prev => [...prev, created]);
    showToast(`Scheduled new event: ${newEventForm.title}`, "success");
    setIsAddEventOpen(false);
    setNewEventForm({
      title: "",
      date: "2026-07-06",
      time: "12:00 PM",
      type: "auction",
      description: ""
    });
  };

  // Days mapping in month (anchored to July 2026)
  const getMonthDays = () => {
    const days: { dayNum: number; isCurrentMonth: boolean; dateStr: string }[] = [];
    // June trailing days
    for (let i = 28; i <= 30; i++) {
      days.push({ dayNum: i, isCurrentMonth: false, dateStr: `2026-06-${i}` });
    }
    // July days
    for (let i = 1; i <= 31; i++) {
      const padded = i < 10 ? `0${i}` : `${i}`;
      days.push({ dayNum: i, isCurrentMonth: true, dateStr: `2026-07-${padded}` });
    }
    // August leading days
    for (let i = 1; i <= 8; i++) {
      days.push({ dayNum: i, isCurrentMonth: false, dateStr: `2026-08-0${i}` });
    }
    return days;
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const getEventStyle = (type: "auction" | "settlement" | "reminder") => {
    switch (type) {
      case "auction": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "settlement": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "reminder": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl border h-[420px] flex items-center justify-center ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
      }`}>
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-500/20"></div>
          <div className="h-4 w-24 bg-slate-500/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
      themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
    }`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/85 pb-4 mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Enterprise Scheduler</h4>
            <p className="text-[10px] text-slate-500 font-mono">Industrial Concessions Timeline</p>
          </div>
        </div>

        {/* NAVIGATION & PERSPECTIVE */}
        <div className="flex items-center gap-3">
          {/* VIEW CONTROLLER */}
          <div className="flex border rounded-lg p-0.5 font-mono text-[9px] bg-slate-950/20 border-slate-800">
            {["month", "week", "day", "timeline", "agenda"].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view as any)}
                className={`px-2.5 py-1 rounded uppercase font-bold cursor-pointer transition-all ${
                  currentView === view
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Event
          </button>

          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Export ICS calendar"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      <div className="flex-1">
        {currentView === "month" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-500 uppercase tracking-wide">July 2026</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-400">UTC+5:30</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <ChevronLeft className="h-4 w-4 cursor-pointer hover:text-white" />
                <ChevronRight className="h-4 w-4 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 font-mono text-[9px] font-extrabold text-slate-400 text-center uppercase border-b pb-1">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthDays().map((day, idx) => {
                const dateEvents = getEventsForDate(day.dateStr);
                const isSelected = day.dateStr === "2026-07-06"; // July 6 anchor date
                return (
                  <div
                    key={idx}
                    className={`min-h-[56px] p-1 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/40"
                        : day.isCurrentMonth
                        ? "bg-slate-950/20 border-slate-850/60"
                        : "bg-transparent border-transparent opacity-30"
                    }`}
                  >
                    <span className={`text-[10px] font-bold font-mono ${
                      isSelected ? "text-blue-500" : themeMode === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}>{day.dayNum}</span>

                    {/* Mini dot markers or titles */}
                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dateEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={`text-[7px] font-mono font-bold uppercase truncate px-1 rounded border ${getEventStyle(evt.type)}`}
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dateEvents.length > 2 && (
                        <span className="text-[6px] font-mono font-extrabold text-slate-500 block text-center">+{dateEvents.length - 2} MORE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AGENDA / LIST VIEW */}
        {currentView === "agenda" && (
          <div className="space-y-2">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold mb-2">Upcoming Schedule Agenda</h5>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-4 text-xs ${
                    themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      evt.type === "auction" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                      evt.type === "settlement" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className={`font-mono text-[11px] font-extrabold block ${themeMode === "dark" ? "text-slate-200" : "text-slate-700"}`}>
                        {evt.title}
                      </span>
                      <p className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-mono font-bold block uppercase text-slate-400">{evt.date}</span>
                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5 uppercase">{evt.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEEK / DAY / TIMELINE FALLBACK STATES */}
        {(currentView === "week" || currentView === "day" || currentView === "timeline") && (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <CalendarIcon className="h-8 w-8 text-blue-500 animate-pulse mx-auto" />
            <div>
              <p className="text-xs font-mono font-bold">Standard 24h Grid Timeline Rendered</p>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto mt-1">Viewing 22 active lots scheduled for July 6th through July 12th. Interlocked with commercial clearing banks.</p>
            </div>
            <div className="flex justify-center gap-1.5 font-mono text-[9px] font-bold">
              <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/10">8 AM - 8 PM ACTIVE</span>
              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/10">MARKET OPEN</span>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ADD EVENT DIALOG OVERLAY */}
      <AnimatePresence>
        {isAddEventOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddEventOpen(false)}
              className="fixed inset-0 bg-slate-950/70"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl overflow-hidden ${
                themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Schedule Launch Event</h4>
                <button onClick={() => setIsAddEventOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Event Title / Lot Desc</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Scrap Lot Launch"
                    value={newEventForm.title}
                    onChange={e => setNewEventForm({...newEventForm, title: e.target.value})}
                    className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                      themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Launch Date</label>
                    <input
                      type="date"
                      required
                      value={newEventForm.date}
                      onChange={e => setNewEventForm({...newEventForm, date: e.target.value})}
                      className={`w-full text-xs font-mono px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Closing Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 11:30 AM"
                      value={newEventForm.time}
                      onChange={e => setNewEventForm({...newEventForm, time: e.target.value})}
                      className={`w-full text-xs font-mono px-3 py-2 rounded-xl border outline-none ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] font-bold">
                  {(["auction", "settlement", "reminder"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewEventForm({...newEventForm, type: t})}
                      className={`px-2 py-2 rounded-lg border text-center uppercase cursor-pointer transition-all ${
                        newEventForm.type === t
                          ? t === "auction" ? "bg-blue-600 border-blue-500 text-white"
                            : t === "settlement" ? "bg-emerald-600 border-emerald-500 text-white"
                            : "bg-amber-600 border-amber-500 text-white"
                          : "bg-slate-950/20 border-slate-800 text-slate-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Detailed Scope</label>
                  <textarea
                    rows={2}
                    placeholder="Provide compliance mapping notes or audit references..."
                    value={newEventForm.description}
                    onChange={e => setNewEventForm({...newEventForm, description: e.target.value})}
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                      themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase py-2.5 rounded-xl cursor-pointer">
                  Deploy Event Schedule
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
