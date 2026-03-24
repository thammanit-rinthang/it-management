"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Package, Filter, CheckCircle, XCircle, Clock, ScrollText, User2, Edit2, Trash2, ChevronUp, ChevronDown, FileSpreadsheet } from "lucide-react";
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

interface EquipmentRequest {
  id: string;
  userId: string;
  user: { username: string; employee?: { employee_name_th: string } };
  equipment_list_id: string;
  equipmentList: {
    equipmentEntry: {
      item_name: string;
      item_type: string;
      list?: string;
    }
  };
  quantity: number;
  reason: string;
  approval?: string;
  approval_status: string;
  approval_comment?: string;
  approval_date?: string;
  it_approval?: string;
  it_approval_status: string;
  it_approval_comment?: string;
  it_approval_date?: string;
  createdAt: string;
}

interface Equipment {
  id: string;
  remaining: number;
  equipmentEntry?: {
    list: string;
    item_name?: string;
  }
}

interface User {
  id: string;
  username: string;
}

interface Employee {
  id: string;
  employee_name_th: string;
  department?: string;
  position?: string;
}

export default function AdminEquipmentRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters & Sorting logic states
  const [filterItStatus, setFilterItStatus] = useState("ALL");
  const [filterDeptStatus, setFilterDeptStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof EquipmentRequest; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    equipment_list_id: "",
    quantity: 1,
    reason: "",
    approval: "",
    approval_status: "PENDING",
    approval_comment: "",
    it_approval: "",
    it_approval_status: "PENDING",
    it_approval_comment: ""
  });

  useEffect(() => {
    fetchRequests();
    fetchInventory();
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-requests");
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch (error) {
      console.error("Fetch requests error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/equipment-lists");
      const data = await res.json();
      if (Array.isArray(data)) setInventory(data);
    } catch (error) {
       console.error("Fetch inventory error:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
       console.error("Fetch users error:", error);
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
  }

  const handleSort = (key: keyof EquipmentRequest) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredRequests = requests
    .filter(r => {
      const searchLow = search.toLowerCase();
      const matchesSearch = (r.user?.username || "").toLowerCase().includes(searchLow) ||
                           (r.user?.employee?.employee_name_th || "").toLowerCase().includes(searchLow) ||
                           (r.equipmentList?.equipmentEntry?.item_name || "").toLowerCase().includes(searchLow) ||
                           (r.equipmentList?.equipmentEntry?.list || "").toLowerCase().includes(searchLow);
      
      const matchesItStatus = filterItStatus === "ALL" || r.it_approval_status === filterItStatus;
      const matchesDeptStatus = filterDeptStatus === "ALL" || r.approval_status === filterDeptStatus;
      
      return matchesSearch && matchesItStatus && matchesDeptStatus;
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
    let dataToExport = filteredRequests;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(r => {
        const date = new Date(r.createdAt);
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

    const worksheetData = dataToExport.map(r => ({
      "ID": r.id,
      "Request Date": new Date(r.createdAt).toLocaleDateString('en-GB'),
      "Requester": r.user?.employee?.employee_name_th || r.user?.username,
      "Item": r.equipmentList?.equipmentEntry?.list || r.equipmentList?.equipmentEntry?.item_name || 'Legacy',
      "Quantity": r.quantity,
      "Reason": r.reason,
      "Dept Status": r.approval_status,
      "Dept Approver": r.approval,
      "IT Status": r.it_approval_status,
      "IT Auditor": r.it_approval,
      "Last Updated": r.it_approval_date || r.approval_date || r.createdAt
    }));

    await exportToExcel(worksheetData, `Equipment_Requests_${new Date().toISOString().split('T')[0]}`, "Requests");
    setIsExportModalOpen(false);
  };

  const openModal = (request?: any) => {
    if (request) {
      setEditingId(request.id);
      setFormData({
        userId: request.userId,
        equipment_list_id: request.equipment_list_id || "",
        quantity: request.quantity,
        reason: request.reason || "",
        approval: request.approval || "",
        approval_status: request.approval_status || "PENDING",
        approval_comment: request.approval_comment || "",
        it_approval: request.it_approval || "",
        it_approval_status: request.it_approval_status || "PENDING",
        it_approval_comment: request.it_approval_comment || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        userId: "",
        equipment_list_id: "",
        quantity: 1,
        reason: "",
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
      const url = editingId ? `/api/equipment-requests/${editingId}` : "/api/equipment-requests";
      const method = editingId ? "PATCH" : "POST";
      
      const payload = {
        ...formData,
        it_approval: (formData.it_approval_status !== "PENDING" && !formData.it_approval) 
          ? (session?.user?.name || "IT Admin") 
          : formData.it_approval,
        approval: (formData.approval_status !== "PENDING" && !formData.approval) 
          ? (session?.user?.name || "Dept Reviewer") 
          : formData.approval
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchRequests();
      } else {
         const err = await res.json();
         alert(err.error || "Failed to save request");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatusInline = async (id: string, field: string, status: string) => {
    try {
      const payload: any = {};
      payload[field] = status;
      if (field === 'it_approval_status') {
         payload.it_approval = session?.user?.name || "IT Admin";
      } else {
         payload.approval = session?.user?.name || "Supervisor";
      }

      const res = await fetch(`/api/equipment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchRequests();
    } catch (error) {
      console.error("Quick status update error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the request and restore inventory stock (if IT approved).")) return;
    try {
      const res = await fetch(`/api/equipment-requests/${id}`, { method: "DELETE" });
      if (res.ok) fetchRequests();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white shadow-sm">
                <Package className="h-5 w-5" />
             </div>
             รายการคำขอเบิกอุปกรณ์ / Borrowing Requests
          </h1>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">การจัดการและดำเนินการคำร้องขอเบิกอุปกรณ์ (2 ขั้นตอน) / Multi-stage Approval Process</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-2xl border-zinc-200 hover:border-[#0F1059] hover:text-[#0F1059] py-6 px-6 font-black uppercase tracking-widest text-[11px] transition-all"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> ส่งออก Excel / EXPORT
          </Button>
          <Button onClick={() => openModal()} className="rounded-2xl bg-[#0F1059] hover:bg-black py-6 px-8 shadow-sm font-black uppercase tracking-widest text-[11px] transition-all">
            <Package className="mr-2 h-4 w-4" /> สร้างคำขอ / Create Request
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-3xl border border-zinc-100 bg-white/50">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all lg:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-medium w-full"
                placeholder="Search user or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterDeptStatus}
          onChange={(e) => setFilterDeptStatus(e.target.value)}
        >
          <option value="ALL">Dept Status: ALL</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterItStatus}
          onChange={(e) => setFilterItStatus(e.target.value)}
        >
          <option value="ALL">IT Status: ALL</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Equipment Info
                    {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Requester</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">Qty</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">Dept</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-center">IT Final</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-20 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      ไม่พบรายการคำขอ / No borrowing requests found
                  </TableCell>
                </TableRow>
              ) : filteredRequests.map((r: any) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-primary uppercase text-sm">
                        {r.equipmentList?.equipmentEntry?.list || r.equipmentList?.equipmentEntry?.item_name || 'Legacy Item'}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 italic">
                        Date: {new Date(r.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <User2 className="h-3.5 w-3.5 text-zinc-300" />
                        <span className="text-xs font-black text-zinc-700 uppercase">{r.user?.employee?.employee_name_th || r.user?.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-base font-black tracking-tighter text-[#0F1059]">{r.quantity}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                    <select 
                      value={r.approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(r.id, 'approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer",
                        r.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                        r.approval_status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                    <select 
                      value={r.it_approval_status || "PENDING"}
                      onChange={(e) => updateStatusInline(r.id, 'it_approval_status', e.target.value)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-tight border-none outline-none cursor-pointer",
                        r.it_approval_status === "APPROVED" ? "bg-[#0F1059] text-white" :
                        r.it_approval_status === "REJECTED" ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button onClick={() => openModal(r)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
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
        title={editingId ? "ตรวจสอบคว่ามถูกต้องและอนุมัติ / PROCESS APPROVAL" : "สร้างคำขอใหม่ / NEW REQUEST"}
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ผู้ขอเบิก / Requester</label>
                 <select 
                    required
                    disabled={!!editingId}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none disabled:opacity-70"
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                 >
                    <option value="">-- SELECT USER --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">รายการอุปกรณ์ / Item</label>
                 <select 
                    required
                    disabled={!!editingId}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none disabled:opacity-70"
                    value={formData.equipment_list_id}
                    onChange={(e) => setFormData({...formData, equipment_list_id: e.target.value})}
                 >
                    <option value="">-- SELECT ITEM --</option>
                    {inventory.map((item: any) => (
                      <option key={item.id} value={item.id} disabled={item.remaining <= 0}>
                        {item.equipmentEntry?.list || item.equipmentEntry?.item_name} (Stock: {item.remaining})
                      </option>
                    ))}
                 </select>
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">เหตุผลความจำเป็น / Request Reason</label>
              <textarea 
                 readOnly={!!editingId}
                 className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[50px]"
                 value={formData.reason}
                 onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
           </div>

           {/* Step 1: Department Approval */}
           <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100 space-y-4">
              <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 pb-2">ขั้นตอนที่ 1: การอนุมัติแผนก / Dept Approval</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase">สถานะแผนก / Status</label>
                    <select 
                       className="w-full bg-white border border-amber-100 rounded-lg px-3 py-2 text-xs font-bold uppercase"
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
                 <label className="text-[9px] font-black text-zinc-400 uppercase">ความเห็นแผนก / Comment</label>
                 <textarea 
                    className="w-full bg-white border border-amber-100 rounded-lg px-3 py-2 text-xs"
                    value={formData.approval_comment}
                    onChange={(e) => setFormData({...formData, approval_comment: e.target.value})}
                 />
              </div>
           </div>

           {/* Step 2: IT Approval */}
           <div className="p-4 rounded-2xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-4">
              <h3 className="text-[11px] font-black text-[#0F1059] uppercase tracking-[0.2em] border-b border-[#0F1059]/10 pb-2">ขั้นตอนที่ 2: การอนุมัติ IT / IT Final Approval</h3>
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
                    <label className="text-[9px] font-black text-zinc-400 uppercase">เจ้าหน้าที่ IT / IT Auditor</label>
                    <EmployeeSearchSelect 
                       value={formData.it_approval || ""}
                       employees={employees}
                       onChange={(val) => setFormData({...formData, it_approval: val})}
                       placeholder="เลือกเจ้าหน้าที่... / Select..."
                    />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-zinc-400 uppercase">ความเห็น IT / IT Audit Comment</label>
                 <textarea 
                    className="w-full bg-white border border-[#0F1059]/10 rounded-lg px-3 py-2 text-xs"
                    placeholder="Stock check result..."
                    value={formData.it_approval_comment}
                    onChange={(e) => setFormData({...formData, it_approval_comment: e.target.value})}
                 />
              </div>
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
                 ปิด / Close
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกผลการอนุมัติ / Save Result"}
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
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Dept: {filterDeptStatus}</Badge>
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">IT: {filterItStatus}</Badge>
                   {search && <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Search: {search}</Badge>}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
             <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
                Cancel
             </Button>
             <Button 
                onClick={processExport}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest"
             >
                Download Excel
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
