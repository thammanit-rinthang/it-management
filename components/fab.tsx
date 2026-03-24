"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Ticket, 
  Package, 
  Users, 
  ShieldCheck, 
  X,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role || "user";

  const userActions = [
    { 
      label: "แจ้งซ่อมอุปกรณ์ / Report Ticket", 
      icon: Ticket, 
      href: "/user/my-requests",
      color: "bg-blue-600"
    },
    { 
      label: "ขอเบิกอุปกรณ์ / Borrow Gear", 
      icon: Package, 
      href: "/user/borrow",
      color: "bg-sky-500"
    },
  ];

  const adminActions = [
    { 
      label: "ตรวจสอบการอนุมัติ / Approvals", 
      icon: ShieldCheck, 
      href: "/admin/approvals",
      color: "bg-[#0F1059]"
    },
    { 
      label: "จัดการพนักงาน / Directory", 
      icon: Users, 
      href: "/admin/employees",
      color: "bg-emerald-600"
    },
    { 
      label: "จัดการรายการซ่อม / Service", 
      icon: Ticket, 
      href: "/admin/tickets",
      color: "bg-amber-600"
    },
  ];

  const actions = role === "admin" ? adminActions : userActions;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {actions.map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-[#0F1059] uppercase tracking-widest border border-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
                <button
                  onClick={() => {
                    router.push(action.href);
                    setIsOpen(false);
                  }}
                  className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 duration-300",
                    action.color
                  )}
                >
                  <action.icon className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-[24px] flex items-center justify-center text-white border-4 border-white transition-all duration-500 active:scale-90",
          isOpen ? "bg-rose-500 rotate-45" : "bg-[#0F1059] rotate-0"
        )}
      >
        {isOpen ? <X className="h-8 w-8 -rotate-45" /> : <Plus className="h-8 w-8" />}
      </button>
    </div>
  );
}
