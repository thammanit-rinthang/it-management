"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, ShieldCheck, Activity, User, Clock, FileText, Filter, LayoutGrid, ChevronUp, ChevronDown } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterModule, setFilterModule] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof AuditLog; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof AuditLog) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredLogs = logs
    .filter(log => {
      const searchLow = search.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(searchLow);
      const nameMatch = log.userName?.toLowerCase().includes(searchLow);
      const moduleMatch = log.module.toLowerCase().includes(searchLow);
      const detailMatch = log.details?.toLowerCase().includes(searchLow);
      const deviceMatch = log.device?.toLowerCase().includes(searchLow);
      
      const matchesSearch = actionMatch || moduleMatch || nameMatch || detailMatch || deviceMatch;
      const matchesModule = filterModule === "ALL" || log.module === filterModule;
      
      return matchesSearch && matchesModule;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (!aValue || !bValue) return 0;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const modules = ["ALL", ...new Set(logs.map(l => l.module))];

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("FAILURE") || act.includes("DELETE") || act.includes("ERROR")) return "destructive";
    if (act.includes("SUCCESS") || act.includes("APPROVE") || act.includes("OK")) return "success";
    if (act.includes("CREATE") || act.includes("UPDATE") || act.includes("CHANGE")) return "warning";
    return "secondary";
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#0F1059]" />
            Audit Logs / บันทึกการทำงานระบบ
          </h1>
          <p className="text-sm font-medium uppercase tracking-widest text-[#0F1059]">Security, Requests, & Action Logging History</p>
        </div>
        <div className="flex items-center gap-3">
            <Button onClick={fetchLogs} variant="outline" className="rounded-xl border-zinc-200 h-11 px-4 bg-white/50 backdrop-blur-sm">
                <Clock className="h-4 w-4 mr-2" /> Refresh
            </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
         <Card className="p-5 rounded-3xl border-zinc-100 flex items-center gap-4 group bg-white/80 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-[#0F1059] border border-zinc-100 group-hover:bg-[#0F1059] group-hover:text-white transition-all">
               <Activity className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Total Logs</p>
               <p className="text-lg font-black text-[#0F1059] leading-none">{logs.length}</p>
            </div>
         </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-zinc-100">
        <div className="flex w-full sm:w-1/2 items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 focus-within:border-[#0F1059]/20 transition-all group">
             <Search className="h-4 w-4 text-zinc-300 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-zinc-300"
                placeholder="Search user, device, action, or module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100 overflow-x-auto scrollbar-hide shrink-0 max-w-full">
               {modules.map(mod => (
                 <button
                   key={mod}
                   onClick={() => setFilterModule(mod)}
                   className={cn(
                     "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                     filterModule === mod ? "bg-[#0F1059] text-white scale-105" : "text-zinc-400 hover:text-zinc-600"
                   )}
                 >
                   {mod}
                 </button>
               ))}
            </div>
        </div>
      </div>

      <Card className="rounded-[40px] overflow-hidden bg-white/90 backdrop-blur-xl border-t border-l border-white/40">
        <Table className="w-full text-left">
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                    Timestamp
                    {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => handleSort('module')}
              >
                <div className="flex items-center gap-1">
                    Module
                    {sortConfig.key === 'module' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center gap-1">
                    Action
                    {sortConfig.key === 'action' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => handleSort('userName')}
              >
                <div className="flex items-center gap-1">
                    User (Name)
                    {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Device</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-50">
            {isLoading ? (
               Array.from({ length: 10 }).map((_, i) => (
                 <TableRow key={i}>
                   <TableCell colSpan={6} className="h-20 animate-pulse bg-zinc-50/20" />
                 </TableRow>
               ))
            ) : filteredLogs.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                        <FileText className="h-14 w-14" />
                        <p className="text-xs font-black uppercase tracking-widest">No logs match your search</p>
                    </div>
                 </TableCell>
               </TableRow>
            ) : filteredLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-[#0F1059]/2 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">{new Date(log.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                     <div className={cn(
                        "h-2 w-2 rounded-full",
                        log.module === "AUTH" ? "bg-amber-400 ring-4 ring-amber-400/10" : log.module === "EQUIPMENT_BORROW" ? "bg-blue-400 ring-4 ring-blue-400/10" : "bg-emerald-400 ring-4 ring-emerald-400/10"
                     )} />
                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{log.module}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                  <Badge variant={getActionBadge(log.action)} className="rounded-xl text-[9px] font-black uppercase tracking-widest px-3 py-1 border-none ">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-2">
                       <div className="h-7 w-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-[#0F1059]" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-zinc-800">{log.userName || "Unknown"}</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter font-mono">{log.userId?.slice(0, 10) || "GUEST"}</span>
                       </div>
                   </div>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap">
                   <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg">
                      {log.device || "Unknown Device"}
                   </span>
                </TableCell>
                <TableCell className="px-6 py-5 whitespace-nowrap text-right">
                    <button className="h-9 w-9 rounded-2xl flex items-center justify-center bg-zinc-50 border border-zinc-100 transition-all text-zinc-300 group-hover:text-white group-hover:bg-[#0F1059] group-hover:scale-110">
                       <LayoutGrid className="h-4 w-4" />
                    </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details / รายละเอียดบันทึกการทำงาน"
      >
        {selectedLog && (
           <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-[32px] bg-zinc-50/50 border border-zinc-100">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="h-3 w-3" /> Action & Module
                    </p>
                    <div className="flex items-center gap-2">
                        <Badge variant={getActionBadge(selectedLog.action)} className="rounded-lg">{selectedLog.action}</Badge>
                        <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                        <span className="text-xs font-black text-[#0F1059] uppercase tracking-wider">{selectedLog.module}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Timestamp</p>
                    <p className="text-xs font-bold text-zinc-600">{new Date(selectedLog.createdAt).toLocaleString('en-GB')}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-3xl border border-zinc-100 bg-zinc-50/30">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                       <User className="h-3 w-3" /> User Name
                    </p>
                    <p className="text-xs font-black text-zinc-700">{selectedLog.userName || "Guest Access"}</p>
                 </div>
                 <div className="p-4 rounded-3xl border border-zinc-100 bg-zinc-50/30">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                       <LayoutGrid className="h-3 w-3" /> Device Info
                    </p>
                    <p className="text-xs font-black text-[#0F1059] uppercase">{selectedLog.device || "Unknown"}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Details / ข้อมูลดิบ (JSON)
                 </p>
                 <div className="p-6 rounded-[32px] bg-[#0F1059] text-[#A5A6D9] font-mono text-xs overflow-x-auto border border-zinc-800 ring-1 ring-white/5">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                        {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : "NO ADDITIONAL DATA"}
                    </pre>
                 </div>
              </div>
              
              <div className="p-4 rounded-3xl border border-zinc-100 bg-zinc-50/30">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">User Agent String</p>
                <p className="text-[10px] font-medium text-zinc-500 break-all leading-tight">{selectedLog.userAgent || "N/A"}</p>
              </div>

              <Button 
                onClick={() => setSelectedLog(null)}
                className="w-full h-14 rounded-3xl bg-[#0F1059] hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95"
              >
                  Close Details / ปิดหน้าต่าง
              </Button>
           </div>
        )}
      </Modal>
    </div>
  );
}
