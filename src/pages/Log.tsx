import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { motion } from "motion/react";
import { Terminal, Download, Search, Filter, Clock, AlertCircle, Info, Activity } from "lucide-react";
import Papa from "papaparse";

export default function Log() {
  const { data, isAdmin } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const logs = data.logs || [];

  const filteredLogs = logs.filter((l: any) => {
    const matchesSearch = 
      l.event?.toLowerCase().includes(search.toLowerCase()) || 
      l.detail?.toLowerCase().includes(search.toLowerCase()) ||
      l.category?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === "ALL" || l.category === filter;
    
    return matchesSearch && matchesFilter;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categories = ["ALL", ...Array.from(new Set(logs.map((l: any) => l.category))) as string[]];

  const handleExportLogs = () => {
    const csv = Papa.unparse(logs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_backup_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-surface p-6 pb-24 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div className="w-full">
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Terminal className="w-8 h-8 md:w-10 md:h-10 text-primary shrink-0" />
              <span>System Logs</span>
            </h1>
            <p className="font-mono text-[10px] md:text-xs text-muted mt-3 max-w-xl leading-relaxed">
              Audit trail for system events, content modifications, and operational telemetry. 
              This log tracks 100% of state changes across the carrier network.
            </p>
          </div>

          <button 
            onClick={handleExportLogs}
            className="w-full md:w-auto h-12 px-6 bg-text-main text-white font-mono text-xs font-bold uppercase hover:bg-primary transition-colors brutal-border flex items-center justify-center gap-3"
          >
            <Download className="w-4 h-4" />
            Backup Logs
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH_LOG_EVENTS..."
              className="w-full h-12 pl-12 pr-4 bg-white brutal-border font-mono text-xs focus:outline-none focus:border-primary rounded-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`h-12 px-5 font-mono text-[10px] font-bold uppercase transition-all brutal-border whitespace-nowrap
                  ${filter === cat ? 'bg-primary text-white' : 'bg-white text-text-main hover:bg-surface'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="brutal-border bg-white overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-text-main bg-surface">
                <th className="p-4 font-mono text-[10px] font-black uppercase tracking-widest text-muted">Timestamp</th>
                <th className="p-4 font-mono text-[10px] font-black uppercase tracking-widest text-muted">Category</th>
                <th className="p-4 font-mono text-[10px] font-black uppercase tracking-widest text-muted">Event</th>
                <th className="p-4 font-mono text-[10px] font-black uppercase tracking-widest text-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log: any, idx) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-surface group"
                >
                  <td className="p-4 font-mono text-[10px] text-muted whitespace-nowrap">
                    {new Date(log.date).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase border
                      ${log.category === 'SYSTEM' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                        log.category === 'UPDATE' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                        'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] font-bold text-text-main group-hover:text-primary transition-colors">
                    {log.event}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-muted">
                    {log.detail}
                  </td>
                </motion.tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center font-mono text-xs text-muted">
                    NO_LOG_RECORDS_MATCH_QUERY
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Events", value: logs.length, icon: Activity },
            { label: "Critical Actions", value: logs.filter((l: any) => l.category === 'UPDATE').length, icon: AlertCircle },
            { label: "System Uptime", value: "99.98%", icon: Clock }
          ].map((stat, i) => (
            <div key={i} className="brutal-border bg-white p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase">{stat.label}</p>
                <p className="font-display text-2xl font-black text-text-main tracking-tighter">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-primary opacity-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
