"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User2, 
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

import { Modal } from "@/components/ui/modal";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"EQUIPMENT" | "TICKETS">("EQUIPMENT");
  const [equipmentRequests, setEquipmentRequests] = useState<any[]>([]);
  const [ticketRequests, setTicketRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Sort State
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmData, setConfirmData] = useState<any>({
    id: "",
    type: "EQUIPMENT",
    step: "DEPT",
    isReject: false,
    comment: "",
    title: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eqRes, ticketRes] = await Promise.all([
        fetch("/api/equipment-requests"),
        fetch("/api/requests")
      ]);
      const eqData = await eqRes.json();
      const ticketData = await ticketRes.json();

      setEquipmentRequests(Array.isArray(eqData) ? eqData : []);
      setTicketRequests(Array.isArray(ticketData) ? ticketData : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openConfirm = (req: any, type: "EQUIPMENT" | "TICKETS", step: "DEPT" | "IT", isReject: boolean = false) => {
    const title = type === "EQUIPMENT" 
      ? (req.equipmentList?.equipmentEntry?.item_name || "Equipment Request")
      : (req.description || "Support Ticket");

    setConfirmData({
      id: req.id,
      type,
      step,
      isReject,
      comment: "",
      title
    });
    setIsConfirmOpen(true);
  };

  const handleAction = async () => {
    setProcessing(true);
    const { id, type, step, isReject, comment } = confirmData;
    
    const field = step === "DEPT" ? "approval_status" : "it_approval_status";
    const nameField = step === "DEPT" ? "approval" : "it_approval";
    const commentField = step === "DEPT" ? "approval_comment" : "it_approval_comment";
    const approverName = session?.user?.name || "IT Admin";
    
    const status = isReject ? "REJECTED" : "APPROVED";
    
    const payload: any = { 
      [field]: status, 
      [nameField]: approverName,
      [commentField]: comment 
    };
    
    const endpoint = type === "EQUIPMENT" ? `/api/equipment-requests/${id}` : `/api/requests/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsConfirmOpen(false);
        fetchData();
      }
    } catch (error) {
       console.error("Action error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const processAndFilter = (data: any[], type: "EQUIPMENT" | "TICKETS") => {
    return data
      .filter(r => {
        const isPending = (r.approval_status === "PENDING" || r.it_approval_status === "PENDING");
        const searchLow = search.toLowerCase();
        const matchesSearch = type === "EQUIPMENT" 
           ? ((r.user?.username || "").toLowerCase().includes(searchLow) ||
                           (r.user?.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
                           (r.equipmentList?.equipmentEntry?.item_name || "").toLowerCase().includes(searchLow) ||
                           (r.equipmentList?.equipmentEntry?.list || "").toLowerCase().includes(searchLow))
           : (r.description?.toLowerCase().includes(searchLow) || r.employee?.employee_name_th?.toLowerCase().includes(searchLow));
        
        return isPending && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.request_date).getTime();
        const dateB = new Date(b.createdAt || b.request_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  };

  const pendingEq = processAndFilter(equipmentRequests, "EQUIPMENT");
  const pendingTickets = processAndFilter(ticketRequests, "TICKETS");

  const stats = {
    eqTotal: equipmentRequests.filter(r => r.approval_status === "PENDING" || r.it_approval_status === "PENDING").length,
    ticketTotal: ticketRequests.filter(r => r.approval_status === "PENDING" || r.it_approval_status === "PENDING").length
  };

  const activeList = activeTab === "EQUIPMENT" ? pendingEq : pendingTickets;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tight uppercase mb-2 flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white shadow-xl shadow-[#0F1059]/30">
                <CheckCircle className="h-6 w-6" />
             </div>
             ศูนย์กลางการอนุมัติ / Approvals Dashboard
          </h1>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mt-4 ml-1">
             <Layers className="h-4 w-4" /> ตรวจสอบและดำเนินการคำร้องที่ค้างอยู่ / Pending workflow control
          </p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-zinc-100">
          <button 
            onClick={() => setActiveTab("EQUIPMENT")}
            className={cn(
              "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
              activeTab === "EQUIPMENT" ? "bg-[#0F1059] text-white shadow-2xl shadow-[#0F1059]/20" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <Package className="h-4 w-4" /> 
            อุปกรณ์ / Borrow ({stats.eqTotal})
          </button>
          <button 
            onClick={() => setActiveTab("TICKETS")}
            className={cn(
              "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
              activeTab === "TICKETS" ? "bg-[#0F1059] text-white shadow-2xl shadow-[#0F1059]/20" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <Ticket className="h-4 w-4" /> 
            แจ้งซ่อม / Tickets ({stats.ticketTotal})
          </button>
        </div>
      </header>

      {/* Enhanced Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-xl p-4 rounded-[32px] border border-zinc-100 shadow-sm">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059] transition-colors" />
          <input 
            type="text" 
            placeholder="Search keywords, requester, item..."
            className="w-full bg-zinc-50 border border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/20 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
           <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 h-14 px-6 bg-white border border-zinc-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#0F1059] hover:shadow-lg transition-all"
           >
              {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {sortOrder === 'desc' ? "Newest First" : "Oldest First"}
           </button>
           <div className="h-10 w-px bg-zinc-100 mx-2 hidden md:block" />
           <div className="bg-[#0F1059]/5 text-[#0F1059] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              Showing {activeList.length} items
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-56 bg-white animate-pulse rounded-[40px] border border-zinc-100" />
          ))
        ) : activeList.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[50px] border-2 border-dashed border-zinc-100 shadow-inner">
             <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                <CheckCircle2 className="h-10 w-10" />
             </div>
             <p className="text-2xl font-black text-[#0F1059] uppercase tracking-tighter">ไม่มีรายการค้างอนุมัติ / All Caught Up</p>
             <p className="text-sm font-bold text-zinc-400 mt-2 uppercase tracking-widest">Excellent! All pending items have been cleared.</p>
          </div>
        ) : activeList.map((r) => (
          <Card key={r.id} className="group relative bg-white border-zinc-100 hover:border-[#0F1059]/30 transition-all duration-500 p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-[#0F1059]/10 overflow-hidden">
            {/* Visual background indicator */}
            <div className={cn(
              "absolute -right-12 -top-12 h-40 w-40 rounded-full blur-[80px] opacity-10 transition-all duration-700 group-hover:scale-150 group-hover:opacity-20",
              activeTab === "EQUIPMENT" ? "bg-amber-500" : "bg-sky-500"
            )} />

            <div className="flex items-start gap-5 mb-8 relative z-10">
               <div className={cn(
                  "h-16 w-16 rounded-[22px] flex items-center justify-center text-white shadow-2xl transition-all group-hover:scale-110 duration-700 group-hover:rotate-6",
                  activeTab === "EQUIPMENT" ? "bg-linear-to-br from-amber-400 to-amber-600 shadow-amber-500/30" : "bg-linear-to-br from-sky-400 to-sky-600 shadow-sky-500/30"
               )}>
                  {activeTab === "EQUIPMENT" ? <Package className="h-8 w-8" /> : <Ticket className="h-8 w-8" />}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                     <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border-zinc-200 text-zinc-400 bg-zinc-50/50">
                        REF: {r.id.slice(-8)}
                     </Badge>
                     {activeTab === "TICKETS" && (
                        <Badge className="bg-[#0F1059] text-white border-none text-[9px] font-black uppercase tracking-widest px-2.5">
                           {r.category}
                        </Badge>
                     )}
                  </div>
                  <h3 className="text-xl font-black text-[#0F1059] uppercase leading-[1.2] px-1 group-hover:text-black transition-colors">
                     {activeTab === "EQUIPMENT" 
                        ? (r.equipmentList?.equipmentEntry?.list || r.equipmentList?.equipmentEntry?.item_name || 'Legacy Item') 
                        : r.description}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 px-1 text-zinc-400">
                     <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-zinc-600">
                        <div className="h-6 w-6 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                           <User2 className="h-3 w-3" />
                        </div>
                        {activeTab === "EQUIPMENT" ? (r.user?.employee?.employee_name_th || r.user?.username || 'user') : (r.employee?.employee_name_th || 'employee')}
                     </div>
                     <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight">
                        <Calendar className="h-3.5 w-3.5 text-zinc-300" />
                        {new Date(r.createdAt || r.request_date).toLocaleDateString('en-GB')}
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
               <div className={cn(
                  "p-4 rounded-3xl border transition-all duration-500",
                  r.approval_status === "APPROVED" ? "bg-emerald-50/50 border-emerald-100 shadow-inner" : "bg-zinc-50 border-zinc-100"
               )}>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                     {r.approval_status === "APPROVED" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                     Dept Review
                  </p>
                  <p className={cn(
                    "text-[11px] font-black uppercase tracking-tighter",
                    r.approval_status === "APPROVED" ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {r.approval_status || "PENDING"}
                  </p>
               </div>
               <div className={cn(
                  "p-4 rounded-3xl border transition-all duration-500",
                  r.it_approval_status === "APPROVED" ? "bg-emerald-50/50 border-emerald-100 shadow-inner" : "bg-zinc-50 border-zinc-100"
               )}>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                     {r.it_approval_status === "APPROVED" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                     IT Auditor
                  </p>
                  <p className={cn(
                    "text-[11px] font-black uppercase tracking-tighter",
                    r.it_approval_status === "APPROVED" ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {r.it_approval_status || "PENDING"}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
               {r.approval_status === "PENDING" ? (
                  <Button 
                    onClick={() => openConfirm(r, activeTab, "DEPT")}
                    className="flex-1 bg-amber-500 hover:bg-black text-white rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 border-none"
                  >
                     Step 1 Review
                  </Button>
               ) : r.it_approval_status === "PENDING" ? (
                  <Button 
                    onClick={() => openConfirm(r, activeTab, "IT")}
                    className="flex-1 bg-[#0F1059] hover:bg-black text-white rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#0F1059]/20 transition-all hover:scale-[1.02] active:scale-95 border-none"
                  >
                     IT Final Audit
                  </Button>
               ) : (
                  <div className="flex-1 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-3 text-emerald-600">
                     <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                     </div>
                     <span className="text-[11px] font-black uppercase tracking-widest">Workflow Completed</span>
                  </div>
               )}
               <Button 
                  variant="outline" 
                  className="w-14 h-14 rounded-2xl p-0 border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-[#0F1059] transition-all"
                  onClick={() => window.location.href = activeTab === "EQUIPMENT" ? "/admin/equipment-requests" : "/admin/tickets"}
               >
                  <ChevronRight className="h-5 w-5" />
               </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        title={confirmData.isReject ? "ปฏิเสธคำร้อง / REJECT REQUEST" : "อนุมัติคำร้อง / APPROVE REQUEST"}
      >
        <div className="space-y-6">
           <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-3 shadow-inner">
              <div className="flex items-center gap-2">
                 <Badge className="bg-[#0F1059] text-white border-none text-[8px] font-black uppercase px-2 py-0">Target</Badge>
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Processing Request</p>
              </div>
              <h4 className="text-base font-black text-[#0F1059] uppercase tracking-tight leading-tight">{confirmData.title}</h4>
              <div className="flex items-center gap-3 text-zinc-500 pt-1 border-t border-zinc-200/50">
                 <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                    <Layers className="h-3 w-3" /> Step: {confirmData.step === "DEPT" ? "Dept Review" : "IT Final"}
                 </div>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">ความคิดเห็นประกอบการพิจารณา / Strategic Comments</label>
              <textarea 
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-3xl px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 focus:shadow-2xl focus:shadow-[#0F1059]/5 transition-all min-h-[140px]"
                placeholder="Enter approval notes, technical checks, or rejection reason here..."
                value={confirmData.comment}
                onChange={(e) => setConfirmData({...confirmData, comment: e.target.value})}
              />
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              {!confirmData.isReject && (
                <Button 
                   variant="ghost" 
                   onClick={() => setConfirmData({...confirmData, isReject: true})}
                   className="flex-1 h-14 rounded-2xl text-rose-500 hover:bg-rose-50 text-[11px] font-black uppercase tracking-widest transition-all"
                >
                   เปลี่ยนเป็นปฏิเสธ / Reject
                </Button>
              )}
              <Button 
                 disabled={processing}
                 onClick={handleAction}
                 className={cn(
                    "flex-1 h-14 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95",
                    confirmData.isReject ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 font-black" : "bg-[#0F1059] hover:bg-black shadow-[#0F1059]/30 font-black"
                 )}
              >
                 {processing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (confirmData.isReject ? "Confirm Rejection" : "Confirm Approval")}
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
