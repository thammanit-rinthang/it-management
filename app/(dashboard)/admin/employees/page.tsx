"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Loader2, User, ChevronUp, ChevronDown } from "lucide-react";
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

interface Employee {
  id: string;
  employee_code: string;
  employee_name_th: string;
  employee_name_en?: string;
  gender?: string;
  department?: string;
  position?: string;
  work_location?: string;
  supervisor_name?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters & Sorting logic states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' }>({
    key: 'employee_name_th',
    direction: 'asc'
  });

  // Form State
  const [formData, setFormData] = useState({
    employee_code: "",
    employee_name_th: "",
    employee_name_en: "",
    gender: "MALE",
    department: "",
    position: "",
    work_location: "",
    supervisor_name: "",
    start_date: "",
    end_date: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof Employee) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredEmployees = employees
    .filter(emp => {
      const searchLow = search.toLowerCase();
      const matchesSearch = emp.employee_name_th.toLowerCase().includes(searchLow) ||
                           (emp.employee_name_en || "").toLowerCase().includes(searchLow) ||
                           emp.employee_code.toLowerCase().includes(searchLow);
      
      const matchesStatus = filterStatus === "ALL" || emp.status === filterStatus;
      const matchesDepartment = filterDepartment === "ALL" || emp.department === filterDepartment;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.key] || "";
      const bValue = (b as any)[sortConfig.key] || "";
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const openModal = (employee: Employee | null = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        employee_code: employee.employee_code || "",
        employee_name_th: employee.employee_name_th || "",
        employee_name_en: employee.employee_name_en || "",
        gender: employee.gender || "MALE",
        department: employee.department || "",
        position: employee.position || "",
        work_location: employee.work_location || "",
        supervisor_name: employee.supervisor_name || "",
        start_date: employee.start_date ? new Date(employee.start_date).toISOString().split('T')[0] : "",
        end_date: employee.end_date ? new Date(employee.end_date).toISOString().split('T')[0] : "",
        status: employee.status || "ACTIVE"
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        employee_code: "",
        employee_name_th: "",
        employee_name_en: "",
        gender: "MALE",
        department: "",
        position: "",
        work_location: "",
        supervisor_name: "",
        start_date: "",
        end_date: "",
        status: "ACTIVE"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = selectedEmployee 
        ? `/api/employees/${selectedEmployee.id}` 
        : "/api/employees";
      const method = selectedEmployee ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchEmployees();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await fetch(`/api/employees/${id}`, { method: "DELETE" });
      fetchEmployees();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10">
                <User className="h-5 w-5" />
             </div>
             ข้อมูลพนักงาน / Staff Directory
          </h1>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-1">การจัดการข้อมูลพนักงานและเจ้าหน้าที่ / Manage system employees and staff</p>
        </div>
        <Button onClick={() => openModal()} className="rounded-2xl bg-[#0F1059] hover:bg-black py-6 px-8 font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> เพิ่มพนักงาน / Add Employee
        </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-white p-4 rounded-3xl border border-zinc-100 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all col-span-1 lg:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-sm font-medium w-full"
                placeholder="Search by name or code..."
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
          <option value="ACTIVE">ACTIVE / ทำงานอยู่</option>
          <option value="INACTIVE">INACTIVE / พักงาน</option>
          <option value="RESIGNED">RESIGNED / ลาออก</option>
        </select>

        <select 
          className="bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="ALL">All Departments / ทุกแผนก</option>
          {departments.map(dept => (
            <option key={dept} value={dept || ""}>{dept}</option>
          ))}
        </select>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('employee_name_th')}
                >
                  <div className="flex items-center gap-1">
                    Employee Info
                    {sortConfig.key === 'employee_name_th' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100 transition-colors"
                   onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-1">
                    Department
                    {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Position</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">Status</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                     <TableCell colSpan={5} className="h-20 animate-pulse bg-zinc-50/10" />
                   </TableRow>
                 ))
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                     ไม่มีข้อมูลพนักงาน / No employees found
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <div className="font-semibold text-primary uppercase text-sm">{emp.employee_name_th}</div>
                     <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter mt-1">Code: {emp.employee_code}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <div className="text-xs font-black text-zinc-700 uppercase tracking-tight">{emp.department}</div>
                     <div className="text-[9px] text-zinc-400 font-medium uppercase">{emp.work_location}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase bg-zinc-100 border-none px-2 py-0.5 shadow-none text-zinc-500">{emp.position}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                     <Badge className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest border-none shadow-none px-2.5 py-1", emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500")}>
                        {emp.status === "ACTIVE" ? "ACTIVE" : "RESIGNED"}
                     </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                     <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button 
                           onClick={() => openModal(emp)}
                           className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => handleDelete(emp.id)}
                           className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all"
                        >
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
        title={selectedEmployee ? "แก้ไขข้อมูลพนักงาน / EDIT EMPLOYEE" : "เพิ่มพนักงานใหม่ / ADD EMPLOYEE"}
      >
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">รหัสพนักงาน / Employee Code</label>
              <input 
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0F1059]/30 transition-all font-mono"
                value={formData.employee_code}
                onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">เพศ / Gender</label>
              <select 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="MALE">ชาย / MALE</option>
                <option value="FEMALE">หญิง / FEMALE</option>
                <option value="OTHER">อื่นๆ / OTHER</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ชื่อ-นามสกุล (ไทย) / Full Name (Thai)</label>
              <input 
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.employee_name_th}
                onChange={(e) => setFormData({...formData, employee_name_th: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ชื่อ-นามสกุล (อังกฤษ) / English Name</label>
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.employee_name_en}
                onChange={(e) => setFormData({...formData, employee_name_en: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">แผนก / Department</label>
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ตำแหน่ง / Position</label>
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">สถานที่ทำงาน / Location</label>
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.work_location}
                onChange={(e) => setFormData({...formData, work_location: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">ชื่อหัวหน้างาน / Supervisor</label>
              <input 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.supervisor_name}
                onChange={(e) => setFormData({...formData, supervisor_name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">วันที่เริ่มงาน / Start Date</label>
              <input 
                type="date"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">วันที่ลาออก / Resigned Date</label>
              <input 
                type="date"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">สถานะพนักงาน / Employment Status</label>
              <select 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold text-[#0F1059] uppercase outline-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="ACTIVE">ACTIVE / ยังทำงานอยู่</option>
                <option value="INACTIVE">INACTIVE / พักงาน</option>
                <option value="RESIGNED">RESIGNED / ลาออก</option>
              </select>
          </div>
          
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
              ยกเลิก / Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกข้อมูล / Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
