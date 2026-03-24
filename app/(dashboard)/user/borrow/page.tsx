"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Package, Plus, ClipboardCheck, AlertCircle, ShoppingBag, Link as LinkIcon, Check, User } from "lucide-react";
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

interface InventoryItem {
  id: string;
  remaining: number;
  equipmentEntry?: {
    item_name: string;
    item_type: string;
    brand_name?: string;
    unit?: string;
    list?: string;
    purchaseOrder?: {
       picture?: string;
       detail?: string;
    }
  }
}

interface BorrowRequest {
  id: string;
  quantity: number;
  reason: string;
  approval_status: string;
  approval?: string;
  createdAt: string;
  equipmentList?: {
    equipmentEntry?: {
       item_name: string;
       list: string;
    }
  }
}

interface Employee {
  id: string;
  employee_name_th: string;
}

export default function BorrowPage() {
  const { data: session } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [myHistory, setMyHistory] = useState<BorrowRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewRequest, setViewRequest] = useState<BorrowRequest | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ id: string, approvalNeeded: boolean } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    quantity: 1,
    reason: "",
    approval: ""
  });

  useEffect(() => {
    if (session) {
      fetchData();
      fetchEmployees();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, histRes] = await Promise.all([
        fetch("/api/equipment-lists"),
        fetch("/api/equipment-requests")
      ]);
      const invData = await invRes.json();
      const histData = await histRes.json();
      if (Array.isArray(invData)) setInventory(invData);
      if (Array.isArray(histData)) setMyHistory(histData);
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

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    // Validation for MAIN items
    if (selectedItem.equipmentEntry?.item_type === "MAIN" && !formData.approval) {
      alert("Please select an approver for MAIN equipment.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/equipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_list_id: selectedItem.id,
          quantity: formData.quantity,
          reason: formData.reason,
          approval: formData.approval
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsModalOpen(false);
        setFormData({ quantity: 1, reason: "", approval: "" });
        fetchData();
        if (formData.approval) {
          setShowSuccess({ id: data.id, approvalNeeded: true });
        } else {
          setShowSuccess({ id: data.id, approvalNeeded: false });
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyApprovalLink = (id: string) => {
    const url = `${window.location.origin}/approve/${id}?t=e`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      const res = await fetch(`/api/equipment-requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setViewRequest(null);
        fetchData();
      }
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm("ท่านต้องการสร้างลิงก์อนุมัติใหม่ใช่หรือไม่? (สถานะการอนุมัติเดิมจะถูกรีเซ็ต)")) return;
    try {
      const res = await fetch(`/api/equipment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_status: "PENDING",
          approval_comment: "",
        })
      });
      if (res.ok) {
        setViewRequest(null);
        fetchData();
        alert("สร้างลิงก์ใหม่สำเร็จ! กรุณากดคัดลอกลิงก์ส่งให้หัวหน้าอีกครั้ง");
      }
    } catch (error) {
      console.error("Regenerate error:", error);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const searchLow = search.toLowerCase();
    const itemName = (item.equipmentEntry?.list || item.equipmentEntry?.item_name || "").toLowerCase();
    const brandName = (item.equipmentEntry?.brand_name || "").toLowerCase();
    return itemName.includes(searchLow) || brandName.includes(searchLow);
  });

   return (
    <div className="p-4 sm:p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">เบิกอุปกรณ์ / Borrow Equipment</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">คลังอุปกรณ์ / Available Store</h2>
              <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                 <Search className="h-3.5 w-3.5 text-zinc-400" />
                 <input 
                    className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-wider w-32"
                    placeholder="ค้นหา... / Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                   <div key={i} className="h-28 animate-pulse bg-zinc-50 rounded-2xl border border-zinc-100" />
                ))
              ) : filteredInventory.length === 0 ? (
                 <div className="p-10 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                    <AlertCircle className="h-8 w-8 mx-auto text-zinc-200 mb-2" />
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">ไม่พบรายการอุปกรณ์ / No items found</p>
                 </div>
              ) : filteredInventory.map((item: any) => (
                <div key={item.id} className={cn(
                  "p-5 bg-white border border-zinc-100 rounded-2xl transition-all group items-start justify-between gap-4 grid grid-cols-1 sm:grid-cols-2",
                  item.remaining > 0 ? "hover:border-[#0F1059]/40" : "opacity-60 grayscale-[0.5]"
                )}>
                   <div 
                      className="flex items-start gap-5 cursor-pointer flex-1"
                      onClick={() => setViewingItem(item)}
                   >
                      <div className="h-20 w-20 rounded-2xl bg-[#F8F9FA] flex items-center justify-center border border-[#E9ECEF] text-[#0F1059] overflow-hidden shrink-0 group-hover:border-[#0F1059]/20 transition-colors">
                         {item.equipmentEntry?.purchaseOrder?.picture ? (
                            <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         ) : (
                            <ShoppingBag className="h-8 w-8 opacity-20" />
                         )}
                      </div>
                      <div className="space-y-1">
                         <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-2">
                             <p className="text-[15px] font-bold text-zinc-900 uppercase tracking-tight leading-none group-hover:text-[#0F1059] transition-colors">{item.equipmentEntry?.list || item.equipmentEntry?.item_name || 'อุปกรณ์ / Equipment'}</p>
                             <Badge variant="secondary" className="rounded-lg h-5 text-[10px] font-semibold uppercase bg-[#0F1059]/5 text-[#0F1059] border-none">
                                {item.equipmentEntry?.item_type}
                             </Badge>
                         </div>
                         
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{item.equipmentEntry?.brand_name || 'ยี่ห้อทั่วไป / Generic Brand'}</span>
                            <span className="h-1 w-1 bg-zinc-200 rounded-full" />
                            {item.remaining > 0 ? (
                              <span className="text-xs font-bold text-emerald-600">มีของ {item.remaining} {item.equipmentEntry?.unit || 'Unit'} ในคลัง</span>
                            ) : (
                              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">หมดอุปกรณ์ / OUT OF STOCK</span>
                            )}
                         </div>
                         
                         <p className="text-[13px] font-normal text-zinc-500 line-clamp-2 leading-relaxed max-w-[300px]">
                            {item.equipmentEntry?.purchaseOrder?.detail || 'ไม่มีข้อมูลเพิ่มเติม / No additional specifications provided.'}
                         </p>
                      </div>
                   </div>
                   <Button 
                      onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                      disabled={item.remaining === 0}
                      className={cn(
                        "rounded-2xl h-12 px-6 text-[11px] font-black uppercase tracking-widest shrink-0 self-center",
                        item.remaining > 0 ? "bg-[#0F1059] hover:bg-[#0F1059]/90" : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      )}
                   >
                      {item.remaining > 0 ? "เบิกตอนนี้ / Borrow Now" : "สินค้าหมด / No Stock"}
                   </Button>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-4">
           <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">ประวัติการเบิก / My Borrow History</h2>
           <Card className="rounded-3xl border-zinc-100 shadow-sm overflow-hidden">
              <Table className="w-full text-left">
                 <TableHeader className="bg-zinc-50/50">
                    <TableRow>
                       <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">รายการ / Item</TableHead>
                       <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider text-center">จำนวน / Qty</TableHead>
                       <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider">สถานะ / Status</TableHead>
                       <TableHead className="px-6 py-4 text-xs font-semibold text-accent uppercase tracking-wider text-right"></TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody className="divide-y divide-zinc-100">
                    {myHistory.length === 0 ? (
                       <TableRow>
                          <TableCell colSpan={4} className="px-6 py-10 text-center text-accent italic font-medium uppercase">ไม่มีกิจกรรมล่าสุด / No recent activity</TableCell>
                       </TableRow>
                    ) : myHistory.map((h) => (
                       <TableRow key={h.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                             <div className="font-semibold text-primary uppercase">{h.equipmentList?.equipmentEntry?.list}</div>
                             <div className="text-[10px] text-accent font-medium uppercase">{new Date(h.createdAt).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                             <span className="text-sm font-black text-[#0F1059]">{h.quantity}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                             <Badge variant={h.approval_status === "APPROVED" ? "success" : h.approval_status === "REJECTED" ? "destructive" : "warning"} className="rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {h.approval_status}
                             </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                     onClick={() => setViewRequest(h)}
                                     className="text-primary hover:text-primary/80 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end ml-auto"
                                 >
                                     รายละเอียด / Details
                                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </section>

      </div>

      <Modal 
        isOpen={!!viewRequest} 
        onClose={() => setViewRequest(null)} 
        title="รายละเอียดการขอเบิก / REQUEST DETAILS"
      >
        <div className="space-y-6">
           <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ชื่ออุปกรณ์ / Item Name</p>
                 <p className="text-sm font-bold text-[#0F1059] leading-relaxed">{viewRequest?.equipmentList?.equipmentEntry?.item_name || viewRequest?.equipmentList?.equipmentEntry?.list}</p>
              </div>
              
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">เหตุผลที่เบิก / Reason / Purpose</p>
                  <p className="text-[12px] font-medium text-zinc-600 leading-relaxed whitespace-pre-line">{viewRequest?.reason || 'ไม่ได้ระบุข้อมูลเพิ่ม / No additional context provided.'}</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-zinc-100 bg-white">
                 <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">จำนวน / Quantity</p>
                 <span className="text-xl font-black text-[#0F1059]">{viewRequest?.quantity}</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-100 bg-white">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">สถานะการอนุมัติ / Approval Status</p>
                  <Badge variant={viewRequest?.approval_status === "APPROVED" ? "success" : viewRequest?.approval_status === "REJECTED" ? "destructive" : "warning"} className="rounded-lg text-[10px] font-black uppercase tracking-widest">
                     {viewRequest?.approval_status}
                  </Badge>
               </div>
            </div>

            {viewRequest?.approval && (
              <div className="space-y-3 animate-in fade-in duration-500">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">การอนุมัติโดย / To be Approved by: <span className="text-[#0F1059] font-black">{viewRequest.approval}</span></p>
                 <div className="flex gap-2">
                    <Button 
                       onClick={() => copyApprovalLink(viewRequest.id)}
                       className="flex-1 h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[#0F1059] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                       <LinkIcon className="h-3.5 w-3.5" /> คัดลอกลิงก์ / Copy Link
                    </Button>
                    {viewRequest.approval_status !== 'PENDING' && (
                       <Button 
                          onClick={() => handleRegenerate(viewRequest.id)}
                          className="flex-1 h-12 rounded-xl bg-[#0F1059]/5 hover:bg-[#0F1059]/10 text-[#0F1059] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-[#0F1059]/10"
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
              {viewRequest?.approval_status === 'PENDING' && (
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
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        title="รายละเอียดทางเทคนิค / EQUIPMENT SPECIFICATIONS"
      >
        <div className="space-y-6">
           {viewingItem?.equipmentEntry?.purchaseOrder?.picture ? (
              <div className="w-full h-64 rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200">
                 <img src={viewingItem.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-contain" />
              </div>
           ) : (
              <div className="w-full h-64 rounded-3xl bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300">
                 <ShoppingBag className="h-12 w-12 opacity-20" />
              </div>
           )}

           <div className="space-y-4">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{viewingItem?.equipmentEntry?.brand_name || 'ยี่ห้อทั่วไป / Generic Brand'}</span>
                    <Badge variant="secondary" className="rounded-lg h-5 text-[9px] font-black uppercase bg-[#0F1059]/5 text-[#0F1059] border-none">
                       {viewingItem?.equipmentEntry?.item_type}
                    </Badge>
                 </div>
                 <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{viewingItem?.equipmentEntry?.list || viewingItem?.equipmentEntry?.item_name}</h3>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">ข้อมูลทางเทคนิค / Asset Technical Details</p>
                    <p className="text-sm font-medium text-zinc-600 leading-relaxed font-sans italic whitespace-pre-line">
                       {viewingItem?.equipmentEntry?.purchaseOrder?.detail || 'ไม่มีข้อมูลเพิ่มเติม / No additional specifications provided.'}
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/50">
                    <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border-none px-2 py-0.5">
                       มี {viewingItem?.remaining} {viewingItem?.equipmentEntry?.unit || 'Unit'} พร้อมเบิก / AVAILABLE
                    </Badge>
                 </div>
              </div>
           </div>

           <div className="flex gap-3">
              <Button 
                   onClick={() => setViewingItem(null)}
                   className="flex-1 h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-black uppercase tracking-widest"
              >
                   ปิดหน้าต่าง / Close
              </Button>
              <Button 
                   onClick={() => { setSelectedItem(viewingItem); setViewingItem(null); setIsModalOpen(true); }}
                   className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-[#0F1059]/90 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#0F1059]/20"
              >
                   ขอเบิก / Request
              </Button>
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="แบบฟอร์มการยืมอุปกรณ์ / EQUIPMENT REQUEST"
      >
        <form onSubmit={handleBorrow} className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E9ECEF]">
               <p className="text-[10px] font-black text-[#ADB5BD] uppercase tracking-widest mb-1">อุปกรณ์ที่ขอเบิก / Requested Item</p>
               <p className="text-sm font-bold text-[#0F1059]">{selectedItem?.equipmentEntry?.item_name || selectedItem?.equipmentEntry?.list}</p>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">จำนวน / Quantity</label>
                  <input 
                     type="number"
                     min="1"
                     max={selectedItem?.remaining}
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                     value={formData.quantity}
                     onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">* เบิกได้สูงสุด / Max allowed: {selectedItem?.remaining}</p>
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">เหตุผลประกอบ / Reason / Purpose</label>
                  <textarea 
                     required
                     className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[100px]"
                     placeholder="ระบุเหตุผลความจำเป็นในการใช้อุปกรณ์... / Describe why you need this equipment..."
                     value={formData.reason}
                     onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
               </div>

               {selectedItem?.equipmentEntry?.item_type === "MAIN" && (
                 <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest">ผู้อนุมัติ (จำเป็น) / Person Approval (Required)</label>
                    <select 
                       required
                       className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium outline-none appearance-none cursor-pointer hover:border-[#0F1059]/30 transition-all shadow-sm"
                       value={formData.approval}
                       onChange={(e) => setFormData({...formData, approval: e.target.value})}
                    >
                       <option value="">-- เลือกผู้อนุมัติ / SELECT APPROVER --</option>
                       {employees.map(emp => (
                         <option key={emp.id} value={emp.employee_name_th}>{emp.employee_name_th}</option>
                       ))}
                    </select>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">* จำเป็นสำหรับอุปกรณ์หลัก (เช่น โน้ตบุ๊ก) / Required for MAIN assets</p>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
               <Button 
                 type="submit" 
                 disabled={isSaving}
                 className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-[#0F1059]/90 text-white shadow-xl shadow-[#0F1059]/10 text-[11px] font-black uppercase tracking-widest"
               >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ส่งคำขอเบิก / Submit Request"}
               </Button>
            </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal 
        isOpen={!!showSuccess} 
        onClose={() => setShowSuccess(null)} 
        title="ส่งคำขอสำเร็จ / SUBMITTED SUCCESSFULLY"
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
                         {typeof window !== 'undefined' ? `${window.location.origin}/approve/${showSuccess.id}?t=e` : ''}
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
