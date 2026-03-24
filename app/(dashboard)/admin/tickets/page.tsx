"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Ticket, Edit2, Clock, Trash2, ChevronUp, ChevronDown, FileSpreadsheet } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { exportToExcel } from "@/lib/export-utils";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

interface RequestTicket {
  id: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  employeeId?: string;
  type_request?: string;
  approval?: string;
  approval_status?: string;
  approval_comment?: string;
  it_approval?: string;
  it_approval_status?: string;
  it_approval_comment?: string;
  employee?: { id: string, employee_name_th: string };
  user?: { username: string };
}

interface Employee {
  id: string;
  employee_name_th: string;
}

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<RequestTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter States
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof RequestTicket; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  const [formData, setFormData] = useState({
    description: "",
    category: "Software",
    priority: "MEDIUM",
    status: "OPEN",
    employeeId: "",
    type_request: "SERVICE",
    approval: "",
    approval_status: "PENDING",
    approval_comment: "",
    it_approval: "",
    it_approval_status: "PENDING",
    it_approval_comment: ""
  });

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (error) {
      console.error("Fetch employees error:", error);
    }
  };

  const handleSort = (key: keyof RequestTicket) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTickets = tickets
    .filter(t => {
      const searchLow = search.toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(searchLow) ||
                           (t.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
                           t.category.toLowerCase().includes(searchLow);
      
      const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
      const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
      const matchesCategory = filterCategory === "ALL" || t.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.key] || "";
      const bValue = (b as any)[sortConfig.key] || "";
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleExportExcel = () => {
    setIsExportModalOpen(true);
  };

  const processExport = async () => {
    let dataToExport = filteredTickets;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(t => {
        const date = new Date(t.createdAt);
        const start = exportDateStart ? new Date(exportDateStart) : null;
        const end = exportDateEnd ? new Date(exportDateEnd) : null;
        
        if (start && date < start) return false;
        if (end) {
          const endAdjusted = new Date(end);
          endAdjusted.setHours(23, 59, 59);
          if (date > endAdjusted) return false;
        }
        return true;
      });
    }

    if (dataToExport.length === 0) {
      alert("No data to export for the selected criteria.");
      return;
    }

    const worksheetData = dataToExport.map(t => ({
      "ID": t.id,
      "Date": new Date(t.createdAt).toLocaleDateString('en-GB'),
      "Description": t.description,
      "Category": t.category,
      "Priority": t.priority,
      "Requester": t.employee?.employee_name_th || t.user?.username || '-',
      "Dept Status": t.approval_status,
      "IT Status": t.it_approval_status,
      "Final Status": t.status
    }));

    await exportToExcel(worksheetData, `Support_Tickets_${new Date().toISOString().split('T')[0]}`, "Tickets");
    setIsExportModalOpen(false);
  };

  const openModal = (ticket?: any) => {
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({
        description: ticket.description || "",
        category: ticket.category || "Software",
        priority: ticket.priority || "MEDIUM",
        status: ticket.status || "OPEN",
        employeeId: ticket.employeeId || "",
        type_request: ticket.type_request || "SERVICE",
        approval: ticket.approval || "",
        approval_status: ticket.approval_status || "PENDING",
        approval_comment: ticket.approval_comment || "",
        it_approval: ticket.it_approval || "",
        it_approval_status: ticket.it_approval_status || "PENDING",
        it_approval_comment: ticket.it_approval_comment || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        description: "",
        category: "Software",
        priority: "MEDIUM",
        status: "OPEN",
        employeeId: "",
        type_request: "SERVICE",
        approval: "",
        approval_status: "PENDING",
        approval_comment: "",
        it_approval: "",
        it_approval_status: "PENDING",
        it_approval_comment: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/requests/${editingId}` : "/api/requests";
      const method = editingId ? "PATCH" : "POST";
      
      const payload = {
        ...formData,
        it_approval: (formData.it_approval_status !== "PENDING" && !formData.it_approval) 
          ? (session?.user?.name || "IT Admin") 
          : formData.it_approval,
        approval: (formData.approval_status !== "PENDING" && !formData.approval) 
          ? (session?.user?.name || "Supervisor") 
          : formData.approval
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTickets();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (res.ok) fetchTickets();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const updateStatusInline = async (id: string, field: string, status: string) => {
    try {
      const payload: any = {};
      payload[field] = status;
      
      if (field === 'it_approval_status') {
         payload.it_approval = session?.user?.name || "IT Admin";
      } else if (field === 'approval_status') {
         payload.approval = session?.user?.name || "Supervisor";
      }

      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchTickets();
    } catch (error) {
      console.error("Quick status update error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10">
                <Ticket className="h-5 w-5" />
             </div>
             จัดการคำแจ้งซ่อม / Ticket Management
          </h1>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">การติดตามและดำเนินการคำร้องขอ (อนุมัติ 2 ขั้นตอน) / Multi-stage Review Process</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-2xl border-zinc-100 hover:border-[#0F1059] hover:text-[#0F1059] py-6 px-6 font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> ส่งออก EXPORT
          </Button>
          <Button onClick={() => openModal()} className="rounded-2xl bg-[#0F1059] hover:bg-black py-6 px-8 font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95">
            <Ticket className="mr-2 h-4 w-4" /> สร้างรายการ / Create Ticket
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-3xl border border-zinc-100 backdrop-blur-xl bg-white/50 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm group focus-within:border-[#0F1059]/30 transition-all">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-medium w-full"
                placeholder="Search description or employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Status / สถานะทั้งหมด</option>
          <option value="OPEN">OPEN / รอดำเนินการ</option>
          <option value="IN_PROGRESS">IN PROGRESS / กำลังทำ</option>
          <option value="RESOLVED">RESOLVED / แก้ไขแล้ว</option>
          <option value="CLOSED">CLOSED / ปิดงาน</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="ALL">All Priority / ความสำคัญทั้งหมด</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="URGENT">URGENT</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="ALL">All Categories / หมวดหมู่ทั้งหมด</option>
          <option value="Software">Software</option>
          <option value="Hardware">Hardware</option>
          <option value="Network">Network</option>
          <option value="Account/Access">Account/Access</option>
        </select>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Request Info
                    {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Dept Status</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">IT Status</TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Progress
                    {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      ไม่พบรายการแจ้งซ่อม / No tickets found
                  </TableCell>
                </TableRow>
              ) : filteredTickets.map((t: any) => (
                <TableRow key={t.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-primary uppercase line-clamp-1 max-w-[250px]">{t.description}</div>
                    <div className="text-[10px] text-zinc-400 font-medium uppercase flex items-center gap-1 mt-1">
                      {t.employee?.employee_name_th || 'N/A'} • {new Date(t.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={t.approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(t.id, 'approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer",
                        t.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                        t.approval_status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={t.it_approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(t.id, 'it_approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer",
                        t.it_approval_status === "APPROVED" ? "bg-[#0F1059] text-white" :
                        t.it_approval_status === "REJECTED" ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={t.status || "OPEN"}
                      onChange={(e) => updateStatusInline(t.id, 'status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest border-none outline-none cursor-pointer",
                        t.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(t)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "ตรวจสอบและอนุมัติใบแจ้งซ่อม / PROCESS TICKET" : "สร้างรายการแจ้งซ่อมใหม่ / CREATE NEW TICKET"}
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">รายละเอียดปัญหา / Description</label>
              <textarea 
                 required
                 readOnly={!!editingId}
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px]"
                 value={formData.description}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">หมวดหมู่ / Category</label>
                 <select 
                    disabled={!!editingId}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                 >
                    <option value="Software">ซอฟต์แวร์ / Software</option>
                    <option value="Hardware">ฮาร์ดแวร์ / Hardware</option>
                    <option value="Network">ระบบเน็ตเวิร์ก / Network</option>
                    <option value="Account/Access">บัญชีผู้ใช้ / Account/Access</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">พนักงาน / Employee</label>
                 <select 
                    required
                    disabled={!!editingId}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                 >
                    <option value="">-- SELECT --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employee_name_th}</option>)}
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ความสำคัญ / Priority</label>
                 <select 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                 >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                 </select>
              </div>
           </div>

           {/* Step 1: Dept Approval */}
           <div className="p-4 rounded-2xl bg-amber-50/30 border border-zinc-100 space-y-4">
              <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">ขั้นตอนที่ 1: การอนุมัติแผนก / Dept Approval</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">สถานะแผนก / Status</label>
                    <select 
                       className="w-full bg-white border border-zinc-100 rounded-lg px-3 py-2 text-xs font-bold uppercase"
                       value={formData.approval_status}
                       onChange={(e) => setFormData({...formData, approval_status: e.target.value})}
                    >
                       <option value="PENDING">PENDING</option>
                       <option value="APPROVED">APPROVED</option>
                       <option value="REJECTED">REJECTED</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">ผู้อนุมัติแผนก / Signed By</label>
                    <EmployeeSearchSelect 
                       value={formData.approval || ""}
                       employees={employees}
                       onChange={(val) => setFormData({...formData, approval: val})}
                       placeholder="เลือกผู้อนุมัติ... / Select..."
                    />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-zinc-400 uppercase">ความเห็นแผนก / Review Comment</label>
                 <textarea 
                    className="w-full bg-white border border-amber-100 rounded-lg px-3 py-2 text-xs"
                    value={formData.approval_comment}
                    onChange={(e) => setFormData({...formData, approval_comment: e.target.value})}
                 />
              </div>
           </div>

           {/* Step 2: IT Approval */}
           <div className="p-4 rounded-2xl bg-[#0F1059]/5 border border-zinc-100 space-y-4">
              <h3 className="text-[11px] font-black text-[#0F1059] uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">ขั้นตอนที่ 2: การอนุมัติ IT / IT Final Approval</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">สถานะ IT / IT Status</label>
                    <select 
                       className="w-full bg-white border border-[#0F1059]/10 rounded-lg px-3 py-2 text-xs font-bold uppercase"
                       value={formData.it_approval_status}
                       onChange={(e) => setFormData({...formData, it_approval_status: e.target.value})}
                    >
                       <option value="PENDING">PENDING</option>
                       <option value="APPROVED">APPROVED</option>
                       <option value="REJECTED">REJECTED</option>
                    </select>
                 </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-zinc-400 uppercase">เจ้าหน้าที่ IT / Auditor</label>
                     <EmployeeSearchSelect 
                        value={formData.it_approval || ""}
                        employees={employees}
                        onChange={(val: string) => setFormData({...formData, it_approval: val})}
                        placeholder="เลือกเจ้าหน้าที่... / Select..."
                     />
                  </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-zinc-400 uppercase">ความเห็น IT / IT Comment</label>
                 <textarea 
                    className="w-full bg-white border border-zinc-100 rounded-lg px-3 py-2 text-xs"
                    value={formData.it_approval_comment}
                    onChange={(e) => setFormData({...formData, it_approval_comment: e.target.value})}
                 />
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">สถานะงานปัจจุบัน / Workflow Status</label>
              <select 
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] uppercase"
                 value={formData.status}
                 onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                 <option value="OPEN">รอดำเนินการ / OPEN</option>
                 <option value="IN_PROGRESS">กำลังดำเนินการ / IN PROGRESS</option>
                 <option value="RESOLVED">แก้ไขแล้ว / RESOLVED</option>
                 <option value="CLOSED">ปิดงาน / CLOSED</option>
              </select>
           </div>
           
           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
                 ยกเลิก / Cancel
              </Button>
              <Button 
                 type="submit"
                 disabled={isSaving}
                 className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-[#0F1059]/90 text-white shadow-xl shadow-[#0F1059]/10 text-[11px] font-black uppercase tracking-widest"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกผลการตรวจสอบ / Save Changes"}
              </Button>
           </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="ส่งออกรายงาน Excel / EXPORT DATA"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <FileSpreadsheet className="h-6 w-6" />
             </div>
             <div>
                <h3 className="text-sm font-black text-emerald-900 uppercase">Export Settings</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Select filters for your report</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Start Date</label>
                   <input 
                      type="date" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={exportDateStart}
                      onChange={(e) => setExportDateStart(e.target.value)}
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">End Date</label>
                   <input 
                      type="date" 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={exportDateEnd}
                      onChange={(e) => setExportDateEnd(e.target.value)}
                   />
                </div>
             </div>

             <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase">Active UI Filters (Will be applied)</p>
                <div className="flex flex-wrap gap-2">
                   <Badge className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Status: {filterStatus}</Badge>
                   <Badge className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Category: {filterCategory}</Badge>
                   {search && <Badge className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Search: {search}</Badge>}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
             <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
                Cancel
             </Button>
             <Button 
                onClick={processExport}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20"
             >
                Download Excel
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
