"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Ticket, MessageSquare, Clock, Plus, BarChart2, ClipboardCheck, Link as LinkIcon, Check, User } from "lucide-react";
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

interface UserRequest {
  id: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  reason: string;
  createdAt: string;
  approval: string;
  approval_status: string;
}

export default function MyRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewRequest, setViewRequest] = useState<UserRequest | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState<{ id: string, approvalNeeded: boolean } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: "",
    reason: "",
    category: "GENERAL",
    priority: "LOW",
    type_request: "REPAIR",
    employeeId: (session?.user as any)?.employeeId || "",
    approval: ""
  });

  useEffect(() => {
    if (session) {
      fetchMyRequests();
      fetchEmployees();
      setFormData(prev => ({ ...prev, employeeId: (session.user as any).employeeId }));
    }
  }, [session]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (error) {
      console.error("Fetch employees error:", error);
    }
  };

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      // The API already filters if not admin
      if (Array.isArray(data)) setRequests(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setIsModalOpen(false);
        setFormData({ ...formData, description: "", reason: "", approval: "" });
        fetchMyRequests();
        if (formData.approval) {
          setShowSuccess({ id: data.id, approvalNeeded: true });
        } else {
          setShowSuccess({ id: data.id, approvalNeeded: false });
        }
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyApprovalLink = (id: string) => {
    const url = `${window.location.origin}/approve/${id}?t=r`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setViewRequest(null);
        fetchMyRequests();
      }
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm("ท่านต้องการสร้างลิงก์อนุมัติใหม่ใช่หรือไม่? (สถานะการอนุมัติเดิมจะถูกรีเซ็ต)")) return;
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_status: "PENDING",
          approval_comment: "",
        })
      });
      if (res.ok) {
        setViewRequest(null);
        fetchMyRequests();
        alert("สร้างลิงก์ใหม่สำเร็จ! กรุณากดคัดลอกลิงก์ส่งให้หัวหน้าอีกครั้ง");
      }
    } catch (error) {
      console.error("Regenerate error:", error);
    }
  };

   return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">รายการแจ้งซ่อมของฉัน / My Requests</h1>
          <p className="text-sm font-medium uppercase tracking-widest text-[#0F1059]">การติดตามสถานะการแจ้งซ่อมอุปกรณ์ / Tracking your active support tickets</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl bg-[#0F1059] hover:bg-[#0F1059]/90 py-6 px-6">
          <TickPlus className="mr-2 h-4 w-4" /> แจ้งเสีย / Create Ticket
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Card className="p-6 rounded-3xl border-zinc-100 flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform">
               <Ticket className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">กำลังดำเนินการ / Ongoing</p>
               <p className="text-xl font-black text-[#0F1059] tracking-tighter">{requests.filter(r => r.status !== 'CLOSED' && r.status !== 'RESOLVED').length} รายการ</p>
            </div>
         </Card>
      </div>

      <Card className="rounded-3xl border-zinc-100 overflow-hidden mt-6">
        <Table className="w-full text-left">
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">รายละเอียดปัญหา / Problem Description</TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">หมวดหมู่ / Category</TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">ความสำคัญ / Priority</TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">วันเวลาที่แจ้ง / Date</TableHead>
              <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100">
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <TableRow key={i}>
                   <TableCell colSpan={5} className="h-16 animate-pulse bg-zinc-50/20" />
                 </TableRow>
               ))
            ) : requests.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                    ไม่มีรายการแจ้งซ่อมของคุณ / No support tickets found
                 </TableCell>
               </TableRow>
            ) : requests.map((t) => (
              <TableRow key={t.id} className="hover:bg-zinc-50/50 transition-colors group">
                <TableCell className="px-6 py-4 whitespace-nowrap">
                   <div className="font-semibold text-primary uppercase">{t.description}</div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="secondary" className="rounded-lg text-[10px] font-bold uppercase transition-all group-hover:bg-white">
                    {t.category === "HARDWARE" ? "ฮาร์ดแวร์ / HARDWARE" :
                     t.category === "SOFTWARE" ? "ซอฟต์แวร์ / SOFTWARE" :
                     t.category === "NETWORK" ? "เน็ตเวิร์ก / NETWORK" :
                     t.category === "GENERAL" ? "ทั่วไป / GENERAL" : t.category}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge className={cn(
                    "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none text-white",
                    t.priority === "HIGH" ? "bg-rose-500" : 
                    t.priority === "MEDIUM" ? "bg-amber-500" :
                    "bg-zinc-400"
                  )}>
                    {t.priority === "HIGH" ? "เร่งด่วน / HIGH" :
                     t.priority === "MEDIUM" ? "ปานกลาง / MEDIUM" :
                     t.priority === "LOW" ? "ปกติ / LOW" : t.priority}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                   <span className="text-sm font-medium text-zinc-700">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                   <button 
                      onClick={() => setViewRequest(t)}
                      className="text-[#0F1059] hover:bg-[#0F1059]/5 px-3 py-1.5 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end ml-auto transform translate-x-2 group-hover:translate-x-0"
                   >
                       ดูรายละเอียด / Details
                       <svg className="w-3 h-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                   </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </Card>

      <Modal 
        isOpen={!!viewRequest} 
        onClose={() => setViewRequest(null)} 
        title="รายละเอียดการแจ้งซ่อม / TICKET DETAILS"
      >
        <div className="space-y-6">
           <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-4">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">รายละเอียดปัญหา / Problem Description</p>
                 <p className="text-sm font-bold text-[#0F1059] leading-relaxed">{viewRequest?.description}</p>
              </div>
              
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">เหตุผล / ความเร่งด่วน / Reasoning / Urgency</p>
                 <p className="text-[12px] font-medium text-zinc-600 leading-relaxed">{viewRequest?.reason || 'ไม่มีข้อมูลเพิ่มเติม / No additional context.'}</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border border-zinc-100 bg-white">
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">หมวดหมู่ / Category</p>
                 <Badge variant="secondary" className="rounded-lg text-[10px] font-bold uppercase">{viewRequest?.category}</Badge>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-100 bg-white">
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">ความสำคัญ / Priority</p>
                 <Badge className={cn(
                    "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none text-white font-sans",
                    viewRequest?.priority === "HIGH" ? "bg-rose-500" : "bg-zinc-400"
                 )}>
                    {viewRequest?.priority}
                 </Badge>
              </div>
           </div>

           <div className="p-4 rounded-2xl bg-[#0F1059] text-white flex justify-between items-center">
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">สถานะการอนุมัติ / Approval Status</span>
               <Badge className={cn(
                  "border-none rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1",
                  viewRequest?.approval_status === "APPROVED" ? "bg-emerald-500 text-white" :
                  viewRequest?.approval_status === "REJECTED" ? "bg-rose-500 text-white" : "bg-white/20 text-white"
               )}>
                  {viewRequest?.approval_status || 'PENDING'}
               </Badge>
            </div>

            {viewRequest?.approval && (
              <div className="space-y-3 animate-in fade-in duration-500">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">การอนุมัติโดย / To be Approved by: <span className="text-[#0F1059] font-black">{viewRequest.approval}</span></p>
                 <div className="flex gap-2">
                    <Button 
                       onClick={() => copyApprovalLink(viewRequest.id)}
                       className="flex-1 h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#0F1059] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                    >
                       <LinkIcon className="h-3.5 w-3.5" /> คัดลอกลิงก์ / Copy Link
                    </Button>
                    {viewRequest.approval_status !== 'PENDING' && (
                       <Button 
                          onClick={() => handleRegenerate(viewRequest.id)}
                          className="flex-1 h-12 rounded-xl bg-[#0F1059]/5 hover:bg-[#0F1059]/10 text-[#0F1059] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                       >
                          <Plus className="h-3.5 w-3.5" /> เจนลิงก์ใหม่ / REGEN
                       </Button>
                    )}
                 </div>
              </div>
            )}
           
           <div className="flex gap-3">
              <Button 
                   onClick={() => setViewRequest(null)}
                   className="flex-1 h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-black uppercase tracking-widest"
              >
                   ปิดหน้าต่าง / Close
              </Button>
              {(viewRequest?.status === 'OPEN' || viewRequest?.status === 'PENDING') && (
                  <Button 
                       onClick={() => handleCancel(viewRequest?.id!)}
                       variant="danger"
                       className="flex-1 h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest"
                  >
                       ยกเลิกคำขอ / Cancel Request
                  </Button>
              )}
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="แจ้งซ่อมหรือขอรับบริการ / NEW SERVICE TICKET"
      >
        <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">อธิบายปัญหาที่พบ / Describe the Problem</label>
                  <textarea 
                     required
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/20 transition-all"
                     placeholder="ระบุอาการเสีย เช่น หน้าจอโน้ตบุ๊กกระพริบ... / e.g. Laptop screen flickering..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">เหตุผลความจำเป็น / Reason / Context</label>
                  <textarea 
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px] focus:border-[#0F1059]/20 transition-all"
                     placeholder="ระบุความเร่งด่วน (ถ้ามี) / Why is this urgent?"
                     value={formData.reason}
                     onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
               </div>
            </div>

            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
               <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">ผู้อนุมัติ (ถ้ามี) / Person Approval (Optional)</label>
               <select 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium outline-none appearance-none cursor-pointer hover:border-[#0F1059]/30 transition-all shadow-sm"
                  value={formData.approval}
                  onChange={(e) => setFormData({...formData, approval: e.target.value})}
               >
                  <option value="">-- ไม่ต้องการการอนุมัติ / NO APPROVAL NEEDED --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employee_name_th}>{emp.employee_name_th}</option>
                  ))}
               </select>
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">* เลือกหากต้องการการอนุมัติจากหัวหน้าแผนก / Select if supervisor approval is required</p>
            </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">หมวดหมู่ / Category</label>
                 <select 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/20"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                 >
                    <option value="HARDWARE">ฮาร์ดแวร์ / HARDWARE</option>
                    <option value="SOFTWARE">ซอฟต์แวร์ / SOFTWARE</option>
                    <option value="NETWORK">เน็ตเวิร์ก / NETWORK</option>
                    <option value="GENERAL">ทั่วไป / GENERAL</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ความสำคัญ / Priority</label>
                 <select 
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-[#0F1059]/20"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                 >
                    <option value="LOW">ปกติ / LOW</option>
                    <option value="MEDIUM">ปานกลาง / MEDIUM</option>
                    <option value="HIGH">เร่งด่วน / HIGH (URGENT)</option>
                 </select>
              </div>
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-[#0F1059]/90 text-white text-[11px] font-black uppercase tracking-widest"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ส่งคำขอ / Submit Request"}
              </Button>
           </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal 
        isOpen={!!showSuccess} 
        onClose={() => setShowSuccess(null)} 
        title="แจ้งซ่อมสำเร็จ / TICKET CREATED"
      >
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
           <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-50/50">
              <ClipboardCheck className="h-10 w-10" />
           </div>
           
           <div className="space-y-2">
              <h3 className="text-xl font-black text-[#0F1059] uppercase tracking-tight">บันทึกข้อมูลสำเร็จ!</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                 {showSuccess?.approvalNeeded 
                    ? "กรุณาส่งลิงก์ให้หัวหน้าแผนกเพื่อขอการอนุมัติ / Please send link to your supervisor for approval" 
                    : "รายการของคุณถูกส่งไปยังฝ่าย IT เรียบร้อยแล้ว / Your request has been sent to IT Dept."}
              </p>
           </div>

           {showSuccess?.approvalNeeded && (
             <div className="w-full p-4 rounded-2xl bg-[#0F1059]/5 border border-[#0F1059]/10 space-y-3">
                <p className="text-[10px] font-black text-[#0F1059] uppercase tracking-[0.25em] text-left ml-1">ลิงก์อนุมัติ / Approval Link</p>
                <div className="flex gap-2">
                   <div className="flex-1 h-12 bg-white rounded-xl border flex items-center px-4 overflow-hidden border-[#0F1059]/10">
                      <span className="text-[10px] text-zinc-400 truncate font-mono">
                         {typeof window !== 'undefined' ? `${window.location.origin}/approve/${showSuccess.id}?t=r` : ''}
                      </span>
                   </div>
                   <Button 
                      onClick={() => copyApprovalLink(showSuccess.id)}
                      className={cn(
                        "h-12 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest shrink-0",
                        isCopied ? "bg-emerald-500 text-white" : "bg-[#0F1059] text-white"
                      )}
                   >
                      {isCopied ? <><Check className="h-3.5 w-3.5 mr-1.5" /> Copied!</> : <><LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Copy Link</>}
                   </Button>
                </div>
             </div>
           )}

           <Button 
              onClick={() => setShowSuccess(null)}
              className="w-full h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-black uppercase tracking-widest mt-4"
           >
              ตกลง / OK
           </Button>
        </div>
      </Modal>
    </div>
  );
}

function TickPlus({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Ticket className="h-4 w-4" />
      <Plus className="h-2.5 w-2.5 absolute -top-1 -right-1" />
    </div>
  )
}
