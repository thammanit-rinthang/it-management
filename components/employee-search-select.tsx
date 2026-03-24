"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  employee_name_th: string;
  department?: string;
  position?: string;
}

interface EmployeeSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  employees: Employee[];
  placeholder?: string;
  className?: string;
}

export function EmployeeSearchSelect({ 
  value, 
  onChange, 
  employees, 
  placeholder = "เลือกพนักงาน... / Select Employee...",
  className
}: EmployeeSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current selected name
  const selectedEmployee = employees.find(emp => emp.employee_name_th === value || emp.id === value);
  const displayValue = selectedEmployee ? selectedEmployee.employee_name_th : (value || "");

  const filteredEmployees = employees.filter(emp => 
    emp.employee_name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-100/50",
          isOpen && "border-[#0F1059]/20 ring-2 ring-[#0F1059]/5 bg-white"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <User className={cn("h-4 w-4 shrink-0", displayValue ? "text-[#0F1059]" : "text-zinc-400")} />
          <span className={cn("truncate", !displayValue && "text-zinc-400")}>
            {displayValue || placeholder}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-zinc-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="p-3 border-b border-zinc-50 flex items-center gap-2 bg-zinc-50/30">
            <Search className="h-4 w-4 text-zinc-400" />
            <input 
              autoFocus
              className="w-full bg-transparent border-none outline-none text-sm font-medium"
              placeholder="ค้นหาชื่อ หรือ แผนก... / Search name or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
               <button onClick={(e) => { e.stopPropagation(); setSearchTerm(""); }} className="p-1 hover:bg-white rounded-lg">
                  <X className="h-3 w-3 text-zinc-400" />
               </button>
            )}
          </div>
          <div className="max-h-[250px] overflow-y-auto pt-1">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest italic">
                ไม่พบข้อมูล / No results found
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = value === emp.employee_name_th;
                return (
                  <div 
                    key={emp.id}
                    onClick={() => {
                      onChange(emp.employee_name_th);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between group hover:bg-[#0F1059]/5 transition-colors",
                      isSelected && "bg-[#0F1059]/5 text-[#0F1059]"
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                       <span className={cn("font-medium truncate transition-colors", isSelected ? "text-[#0F1059]" : "text-zinc-700")}>
                          {emp.employee_name_th}
                       </span>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight truncate group-hover:text-[#0F1059]/40">
                          {emp.department && emp.position ? `${emp.department} • ${emp.position}` : (emp.department || emp.position || '---')}
                       </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-[#0F1059] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
