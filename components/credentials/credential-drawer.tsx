"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loader2, Key, Mail, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { CredentialInput } from "@/lib/validations/credential";
import { EmployeeSearchSelect, Employee } from "@/components/employee-search-select";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = ["EMAIL", "FILE_SHARE", "VPN", "ERP", "SOFTWARE", "OTHER"];

interface CredentialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CredentialInput) => Promise<void>;
  initialData?: CredentialInput | null;
  employees: Employee[];
}

export function CredentialDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
}: CredentialDrawerProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CredentialInput>({
    employeeId: "",
    account_type: [],
    username: "",
    password: "",
    email_address: "",
    remarks: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        employeeId: "",
        account_type: [],
        username: "",
        password: "",
        email_address: "",
        remarks: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const accountTypes = [
    { value: "EMAIL", label: t("credentials.account_types.EMAIL") },
    { value: "FILE_SHARE", label: t("credentials.account_types.FILE_SHARE") },
    { value: "VPN", label: t("credentials.account_types.VPN") },
    { value: "ERP", label: t("credentials.account_types.ERP") },
    { value: "SOFTWARE", label: t("credentials.account_types.SOFTWARE") },
    { value: "OTHER", label: t("credentials.account_types.OTHER") },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      direction="top"
      title={initialData ? t("credentials.edit_credential") : t("credentials.add_credential")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-20 font-sans">
        <div className="space-y-4">
          <div className="space-y-1.5 px-1">
             <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                {t("credentials.employee")}
             </label>
             <EmployeeSearchSelect
               value={formData.employeeId}
               onChange={(val) => {
                 const emp = employees.find(e => e.employee_name_th === val || e.id === val);
                 setFormData({ ...formData, employeeId: emp?.id || "" });
               }}
               employees={employees}
               placeholder={t("credentials.search_placeholder")}
             />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />{t("credentials.account_type")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNT_TYPES.map((type) => {
                  const isSelected = formData.account_type.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const current = [...formData.account_type];
                        if (isSelected) {
                          setFormData({ ...formData, account_type: current.filter(t => t !== type) });
                        } else {
                          setFormData({ ...formData, account_type: [...current, type] });
                        }
                      }}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left border",
                        isSelected 
                          ? "bg-[#0F1059] text-white border-[#0F1059] shadow-lg shadow-[#0F1059]/20" 
                          : "bg-zinc-50 text-zinc-400 border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      {t(`credentials.account_types.${type}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("credentials.username")}</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059] transition-colors" />
                <input
                  required
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm font-black text-[#0F1059] outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. user.name"
                />
              </div>
            </div>

            <div className="space-y-1.5 focus-within:text-[#0f7a59] transition-colors">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("credentials.password")}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  required
                  type="text"
                  className="w-full bg-emerald-50/30 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm font-black text-[#0F1059] outline-none focus:bg-white focus:border-emerald-500/30 transition-all shadow-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter Password..."
                />
              </div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter px-1 flex items-center gap-1">
                 <ShieldAlert className="h-3 w-3" /> Data will be AES-256 encrypted automatically
              </p>
            </div>

            <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("credentials.email_address")}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059] transition-colors" />
                <input
                  type="email"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
                  value={formData.email_address || ""}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  placeholder="e.g. employee@ndc.co.th"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-1.5 focus-within:text-[#0F1059] transition-colors">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("credentials.remarks")}</label>
              <textarea
                rows={3}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm resize-none"
                value={formData.remarks || ""}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Installation location, specific permissions, etc."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving || !formData.employeeId}
            className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#0F1059]/20"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
