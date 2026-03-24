"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, ShoppingCart, Plus, Edit2, Trash2, FileText, Image as ImageIcon, Upload, X, ChevronUp, ChevronDown, FileSpreadsheet } from "lucide-react";
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
import { exportToExcel } from "@/lib/export-utils";

import { EmployeeSearchSelect } from "@/components/employee-search-select";

interface PO {
  id: string;
  list: string;
  detail?: string;
  quantity: number;
  reason_order?: string;
  picture?: string;
  buyer?: string;
  reviewer?: string;
  approver?: string;
  date_order?: string;
  status: string;
}

interface Employee {
  id: string;
  employee_name_th: string;
  department?: string;
  position?: string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PO | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof PO; direction: 'asc' | 'desc' }>({
    key: 'date_order',
    direction: 'desc'
  });

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDateStart, setExportDateStart] = useState("");
  const [exportDateEnd, setExportDateEnd] = useState("");

  // Form
  const [formData, setFormData] = useState({
    list: "",
    detail: "",
    quantity: 1,
    reason_order: "",
    picture: "",
    buyer: "",
    reviewer: "",
    approver: "",
    status: "PENDING",
    date_order: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/equipment-purchase-orders");
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
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

  const handleSort = (key: keyof PO) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredOrders = orders
    .filter(order => {
      const searchLow = search.toLowerCase();
      const matchesSearch = order.list.toLowerCase().includes(searchLow) ||
                           (order.buyer || "").toLowerCase().includes(searchLow);
      
      const matchesStatus = filterStatus === "ALL" || order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
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
    let dataToExport = filteredOrders;

    if (exportDateStart || exportDateEnd) {
      dataToExport = dataToExport.filter(o => {
        const date = o.date_order ? new Date(o.date_order) : new Date();
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

    const worksheetData = dataToExport.map(o => ({
      "ID": o.id,
      "Order Date": o.date_order ? new Date(o.date_order).toLocaleDateString('en-GB') : '-',
      "Item": o.list,
      "Detail": o.detail,
      "Quantity": o.quantity,
      "Status": o.status,
      "Buyer": o.buyer,
      "Reviewer": o.reviewer,
      "Approver": o.approver,
      "Reason": o.reason_order
    }));

    await exportToExcel(worksheetData, `Purchase_Orders_${new Date().toISOString().split('T')[0]}`, "Orders");
    setIsExportModalOpen(false);
  };

  const openModal = (order: PO | null = null) => {
    if (order) {
      setSelectedOrder(order);
      setFormData({
        list: order.list || "",
        detail: order.detail || "",
        quantity: order.quantity || 1,
        reason_order: order.reason_order || "",
        picture: order.picture || "",
        buyer: order.buyer || "",
        reviewer: order.reviewer || "",
        approver: order.approver || "",
        status: order.status || "PENDING",
        date_order: order.date_order ? order.date_order.split('T')[0] : ""
      });
    } else {
      setSelectedOrder(null);
      setFormData({
        list: "",
        detail: "",
        quantity: 1,
        reason_order: "",
        picture: "",
        buyer: "",
        reviewer: "",
        approver: "",
        status: "PENDING",
        date_order: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name || 'image.png')}`, {
        method: "POST",
        body: file,
      });

      if (response.ok) {
        const blob = await response.json();
        setFormData((prev) => ({ ...prev, picture: blob.url }));
      } else {
        const error = await response.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const removePicture = () => {
    setFormData((prev) => ({ ...prev, picture: "" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = selectedOrder 
        ? `/api/equipment-purchase-orders/${selectedOrder.id}` 
        : "/api/equipment-purchase-orders";
      const method = selectedOrder ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchOrders();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return;
    try {
      const res = await fetch(`/api/equipment-purchase-orders/${id}`, { method: "DELETE" });
      if (res.ok) fetchOrders();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10">
                <ShoppingCart className="h-6 w-6" />
             </div>
             รายการสั่งซื้อ / Purchase Orders
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">การจัดหาอุปกรณ์และพัสดุไอที / Strategic IT Procurement & Asset Sourcing</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
             onClick={() => handleExportExcel()} 
             variant="outline"
             className="rounded-2xl border-zinc-200 hover:border-[#0F1059] hover:text-[#0F1059] py-6 px-6 font-black uppercase tracking-widest text-[11px] transition-all h-14"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> ส่งออก Excel / EXPORT
          </Button>
          <Button 
            onClick={() => openModal()}
            className="rounded-2xl h-14 px-8 bg-[#0F1059] hover:bg-black text-white transition-all text-[11px] font-black uppercase tracking-widest"
           >
              <Plus className="mr-2 h-4 w-4" /> เพิ่มรายการใหม่ / New Order
           </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center p-4 rounded-3xl border border-zinc-100 bg-white/50">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all lg:col-span-3">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-medium w-full"
                placeholder="Search by item name or buyer..."
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
          <option value="PENDING">PENDING / รออนุมัติ</option>
          <option value="ORDERED">ORDERED / สั่งซื้อแล้ว</option>
          <option value="RECEIVED">RECEIVED / ได้รับแล้ว</option>
          <option value="CANCELLED">CANCELLED / ยกเลิก</option>
        </select>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest w-24">Media</TableHead>
                <TableHead 
                  className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('list')}
                >
                  <div className="flex items-center gap-1">
                    Order Details
                    {sortConfig.key === 'list' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center gap-1">
                    Quantity
                    {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                  onClick={() => handleSort('date_order')}
                >
                  <div className="flex items-center gap-1">
                    Order Date
                    {sortConfig.key === 'date_order' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Buyer</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Status</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-24 animate-pulse bg-zinc-50/20" />
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      ไม่พบรายการสั่งซื้อ / No purchase orders found
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {order.picture ? (
                       <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                          <img 
                            src={order.picture} 
                            alt={order.list} 
                            className="w-full h-full object-cover cursor-pointer hover:scale-125 transition-transform duration-700"
                            onClick={() => window.open(order.picture, '_blank')}
                          />
                       </div>
                    ) : (
                       <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300">
                          <ImageIcon className="w-6 h-6" />
                       </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-primary uppercase text-sm">{order.list}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase truncate max-w-[200px] mt-1 italic">
                       {order.detail || 'No specifications provided'}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xl font-black tracking-tighter text-[#0F1059]">{order.quantity}</span>
                    <span className="text-[9px] font-black text-zinc-300 uppercase ml-1">Units</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-600">
                    {order.date_order ? new Date(order.date_order).toLocaleDateString('en-GB') : '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-xs font-black text-[#0F1059] uppercase tracking-tight">
                    {order.buyer || '-'}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline"
                      className={cn("rounded-lg text-[8px] font-black uppercase tracking-widest px-2.5 py-1 border-zinc-200", 
                        order.status === "RECEIVED" ? "text-emerald-600" : 
                        order.status === "PENDING" ? "text-amber-600" : 
                        order.status === "CANCELLED" ? "text-rose-600" : "text-blue-600"
                      )}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button onClick={() => openModal(order)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(order.id)} className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all">
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
        title={selectedOrder ? "แก้ไขรายการสั่งซื้อ / EDIT PURCHASE ORDER" : "รายละเอียดใบสั่งซื้อ / NEW PURCHASE ORDER"}
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 px-1">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ชื่อรายการ / Item Name / List</label>
                <input 
                  required
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all"
                  value={formData.list}
                  onChange={(e) => setFormData({...formData, list: e.target.value})}
                />
            </div>
            
            <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">รายละเอียด / Order Details</label>
                <textarea 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px]"
                  value={formData.detail}
                  onChange={(e) => setFormData({...formData, detail: e.target.value})}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">จำนวน / Quantity</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">วันที่สั่ง / Order Date</label>
                <input 
                  type="date"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                  value={formData.date_order}
                  onChange={(e) => setFormData({...formData, date_order: e.target.value})}
                />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">เหตุผลการจัดซื้อ / Reason for Order</label>
                <textarea 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px]"
                  value={formData.reason_order}
                  onChange={(e) => setFormData({...formData, reason_order: e.target.value})}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ผู้สั่งซื้อ / Buyer</label>
                <EmployeeSearchSelect 
                  value={formData.buyer}
                  employees={employees}
                  onChange={(val) => setFormData({...formData, buyer: val})}
                  placeholder="Select Buyer..."
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">สถานะ / Status</label>
                <select 
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold text-[#0F1059] uppercase outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="PENDING">PENDING / รออนุมัติ</option>
                  <option value="ORDERED">ORDERED / สั่งซื้อแล้ว</option>
                  <option value="RECEIVED">RECEIVED / ได้รับแล้ว</option>
                  <option value="CANCELLED">CANCELLED / ยกเลิก</option>
                </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">พิกัดไฟล์รูปภาพ / Image Attachment</label>
                <div className="flex flex-col gap-3">
                   {formData.picture ? (
                     <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100 group">
                       <img 
                        src={formData.picture} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                       />
                       <button 
                        type="button"
                        onClick={removePicture}
                        className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-2xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                       >
                          <Trash2 className="w-5 h-5" />
                       </button>
                     </div>
                   ) : (
                     <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full aspect-video rounded-3xl border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 hover:border-[#0F1059]/30 transition-all text-zinc-300 group"
                     >
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-[#0F1059]" />
                        ) : (
                          <>
                            <div className="h-14 w-14 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-white transition-colors">
                               <Upload className="w-6 h-6 group-hover:text-[#0F1059]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Click or Paste image to upload</span>
                          </>
                        )}
                     </button>
                   )}
                   <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleUpload}
                   />
                </div>
            </div>
           </div>

           <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
              <Button 
                 type="button" 
                 variant="ghost" 
                 onClick={() => setIsModalOpen(false)}
                 className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest"
              >
                 ยกเลิก / Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving || isUploading}
                className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all"
              >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกรายการ / Save Order"}
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
                   <Badge variant="outline" className="bg-white text-[#0F1059] border-zinc-100 text-[10px]">Status: {filterStatus}</Badge>
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
