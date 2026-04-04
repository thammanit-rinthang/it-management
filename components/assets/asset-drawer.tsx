"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { AssetInput } from "@/lib/validations/asset";
import { EmployeeSearchSelect, Employee } from "@/components/employee-search-select";
import { cn } from "@/lib/utils";

interface AssetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssetInput) => Promise<void>;
  initialData?: AssetInput | null;
  employees: Employee[];
  equipmentEntries: any[];
}

export function AssetDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  employees,
  equipmentEntries,
}: AssetDrawerProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AssetInput>({
    serial_number: "",
    type: "NOTEBOOK",
    name: "",
    brand: "",
    model: "",
    specs: "",
    purchase_date: "",
    warranty_expire: "",
    price: 0,
    status: "AVAILABLE",
    location: "Rayong Office",
    employeeId: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        purchase_date: initialData.purchase_date ? new Date(initialData.purchase_date).toISOString().split("T")[0] : "",
        warranty_expire: initialData.warranty_expire ? new Date(initialData.warranty_expire).toISOString().split("T")[0] : "",
      });
    } else {
      setFormData({
        serial_number: "",
        type: "NOTEBOOK",
        name: "",
        brand: "",
        model: "",
        specs: "",
        purchase_date: "",
        warranty_expire: "",
        price: 0,
        status: "AVAILABLE",
        location: "Rayong Office",
        employeeId: null,
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

  const handleSelectEquipEntry = (entryId: string) => {
    const entry = equipmentEntries.find((e) => e.id === entryId);
    if (entry) {
      setFormData((prev) => ({
        ...prev,
        name: entry.list || "",
        brand: entry.brand_name || "",
        purchase_date: entry.date_received ? new Date(entry.date_received).toISOString().split("T")[0] : prev.purchase_date,
      }));
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t("assets.edit_asset") : t("assets.add_asset")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-20 font-sans">
        {/* Quick Reference from Equipment Entry */}
        {!initialData && (
          <div className="p-4 bg-[#0F1059]/5 border border-[#0F1059]/10 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-[#0F1059] font-black text-[10px] uppercase tracking-widest">
              <Database className="h-3 w-3" />
              Quick Fill from Reception
            </div>
            <select
              className="w-full bg-white border border-zinc-100 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
              onChange={(e) => handleSelectEquipEntry(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>--- Select Received Equipment ---</option>
              {equipmentEntries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.list} ({e.brand_name}) - {e.date_received ? new Date(e.date_received).toLocaleDateString() : "No Date"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.type")}</label>
            <select
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="NOTEBOOK">NOTEBOOK</option>
              <option value="PC">PC / DESKTOP</option>
              <option value="SCREEN">SCREEN / MONITOR</option>
              <option value="PRINTER">PRINTER</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.serial_number")}</label>
            <input
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="e.g. SN123456789"
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors col-span-2">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">Device Name / Description</label>
            <input
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Notebook Admin 01"
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.brand")}</label>
            <input
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.brand || ""}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. Dell, HP, Lenovo"
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.model")}</label>
            <input
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.model || ""}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. Latitude 5420"
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors col-span-2">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.specs")}</label>
            <textarea
              rows={3}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm resize-none"
              value={formData.specs || ""}
              onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
              placeholder="CPU, RAM, Storage details..."
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.purchase_date")}</label>
            <input
              type="date"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.purchase_date || ""}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.warranty_expire")}</label>
            <input
              type="date"
              className={cn(
                "w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:bg-white transition-all shadow-sm",
                formData.warranty_expire && new Date(formData.warranty_expire) < new Date() ? "text-rose-500 border-rose-100 bg-rose-50" : "text-[#0F1059]"
              )}
              value={formData.warranty_expire || ""}
              onChange={(e) => setFormData({ ...formData, warranty_expire: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.location")}</label>
            <input
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.location || ""}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. IT Room, Rayong"
            />
          </div>

          <div className="space-y-1.5 focus-within:text-[#0F1059] transition-colors">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("assets.status")}</label>
            <select
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black text-[#0F1059] outline-none focus:bg-white focus:border-[#0F1059]/30 transition-all shadow-sm"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN_USE">IN USE</option>
              <option value="REPAIR">REPAIR</option>
              <option value="SCRAP">SCRAP / DISPOSAL</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-zinc-100">
          <label className="text-[11px] font-black text-[#0F1059] uppercase tracking-widest px-1 flex items-center gap-2">
            Assign to Employee (Optional)
          </label>
          <EmployeeSearchSelect
            value={formData.employeeId || ""}
            onChange={(val) => {
              // Find the employee ID based on the name or code returned by the select
              const emp = employees.find(e => e.employee_name_th === val || e.id === val);
              setFormData({ ...formData, employeeId: emp?.id || null, status: emp ? "IN_USE" : formData.status });
            }}
            employees={employees}
            placeholder={t("assets.unassigned")}
          />
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest">
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            className="flex-1 h-12 rounded-xl bg-[#0F1059] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#0F1059]/20"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
