"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Laptop, 
  ChevronUp, 
  ChevronDown, 
  Calendar,
  AlertTriangle,
  History,
  MapPin,
  User as UserIcon,
  Filter
} from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { AssetDrawer } from "@/components/assets/asset-drawer";
import { getAssets, upsertAsset, deleteAsset } from "@/lib/actions/asset-actions";
import { AssetInput } from "@/lib/validations/asset";
import { useToast } from "@/components/ui/toast";

export default function AssetsPage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [equipmentEntries, setEquipmentEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetInput | null>(null);

  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'asset_code',
    direction: 'desc'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, empRes, equipRes] = await Promise.all([
        getAssets(),
        fetch("/api/employees").then(res => res.json()),
        fetch("/api/equipment-entry-lists").then(res => res.json())
      ]);

      if (assetsRes.success) setAssets(assetsRes.data);
      if (Array.isArray(empRes)) setEmployees(empRes);
      if (Array.isArray(equipRes)) setEquipmentEntries(equipRes);
    } catch (error) {
      console.error("Initial fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAssets = assets
    .filter(asset => {
      const searchLow = search.toLowerCase();
      const matchesSearch = asset.asset_code.toLowerCase().includes(searchLow) ||
                           asset.serial_number.toLowerCase().includes(searchLow) ||
                           asset.name.toLowerCase().includes(searchLow) ||
                           (asset.employee?.employee_name_th || "").toLowerCase().includes(searchLow);
      
      const matchesType = filterType === "ALL" || asset.type === filterType;
      const matchesStatus = filterStatus === "ALL" || asset.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.key] || "";
      const bValue = (b as any)[sortConfig.key] || "";
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleUpsert = async (data: AssetInput) => {
    const result = await upsertAsset(data);
    if (result.success) {
      toast({
        title: "Success",
        message: "Asset saved successfully",
        variant: "success"
      });
      fetchInitialData();
      setIsDrawerOpen(false);
    } else {
      toast({
        title: "Error",
        message: result.error,
        variant: "error"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    const result = await deleteAsset(id);
    if (result.success) {
      toast({
        message: "Asset deleted successfully",
        variant: "success"
      });
      fetchInitialData();
    }
  };

  const openDrawer = (asset: any = null) => {
    if (asset) {
      setSelectedAsset(asset);
    } else {
      setSelectedAsset(null);
    }
    setIsDrawerOpen(true);
  };

  const getWarrantyStatus = (expireDate: string | null) => {
    if (!expireDate) return { label: "N/A", color: "bg-zinc-50 text-zinc-400" };
    const expire = new Date(expireDate);
    const today = new Date();
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: t("assets.expired"), color: "bg-rose-50 text-rose-600" };
    if (diffDays <= 30) return { label: t("assets.expiring_soon"), color: "bg-amber-50 text-amber-600" };
    return { label: t("assets.active"), color: "bg-emerald-50 text-emerald-600" };
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-sm">
                <Laptop className="h-6 w-6" />
             </div>
             {t('assets.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('assets.subtitle')}</p>
        </div>
        <Button onClick={() => openDrawer()} className="rounded-2xl bg-[#0F1059] hover:bg-black h-14 px-8 font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-[#0F1059]/10">
          <Plus className="mr-2 h-4 w-4" /> {t('assets.add_asset')}
        </Button>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center p-4 rounded-3xl border border-zinc-100 bg-white/50 shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all col-span-1 md:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full"
                placeholder={t('assets.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3 text-zinc-400" />
          <select 
            className="flex-1 bg-white border border-zinc-100 rounded-2xl px-4 py-2 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 cursor-pointer transition-all"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">{t('assets.all_types')}</option>
            <option value="NOTEBOOK">NOTEBOOK</option>
            <option value="PC">PC / DESKTOP</option>
            <option value="SCREEN">SCREEN / MONITOR</option>
            <option value="PRINTER">PRINTER</option>
          </select>
        </div>

        <select 
          className="bg-white border border-zinc-100 rounded-2xl px-4 py-2.5 text-[10px] font-black uppercase outline-none text-zinc-600 focus:border-[#0F1059]/30 cursor-pointer transition-all"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t('assets.all_status')}</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="IN_USE">IN USE</option>
          <option value="REPAIR">REPAIR</option>
          <option value="SCRAP">SCRAP</option>
        </select>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white/90">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead 
                   className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100"
                   onClick={() => handleSort('asset_code')}
                >
                  <div className="flex items-center gap-1">
                    {t('assets.asset_info')}
                    {sortConfig.key === 'asset_code' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('assets.location')}</TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('assets.holder')}</TableHead>
                <TableHead 
                  className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest cursor-pointer hover:bg-zinc-100"
                  onClick={() => handleSort('warranty_expire')}
                >
                  <div className="flex items-center gap-1">
                    {t('assets.warranty_expire')}
                    {sortConfig.key === 'warranty_expire' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('assets.status')}</TableHead>
                <TableHead className="p-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                     <TableCell colSpan={6} className="h-20 animate-pulse bg-zinc-50/10" />
                   </TableRow>
                 ))
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      {t('assets.no_assets_found')}
                  </TableCell>
                </TableRow>
              ) : filteredAssets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-[#0F1059]/10 group-hover:text-[#0F1059] transition-colors">
                           <Laptop className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#0F1059] uppercase text-sm truncate">{asset.name}</div>
                          <div className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter mt-0.5 flex items-center gap-2">
                            <span className="text-[#0F1059]/60">{asset.asset_code}</span>
                            <span className="text-zinc-200">|</span>
                            <span>SN: {asset.serial_number}</span>
                            <span className="text-zinc-200">|</span>
                            <span>{asset.type}</span>
                          </div>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-2 text-[11px] font-black text-zinc-700 uppercase tracking-tight">
                        <MapPin className="h-3 w-3 text-zinc-300" />
                        {asset.location || '-'}
                     </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    {asset.employee ? (
                      <div className="flex flex-col">
                        <div className="text-[11px] font-black text-[#0F1059] uppercase flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {asset.employee.employee_name_th}
                        </div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase ml-4">{asset.employee.employee_code}</div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">{t('assets.unassigned')}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-zinc-300" />
                        {asset.warranty_expire ? new Date(asset.warranty_expire).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB') : '-'}
                      </div>
                      {asset.warranty_expire && (
                        <div className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit", getWarrantyStatus(asset.warranty_expire).color)}>
                          {getWarrantyStatus(asset.warranty_expire).label}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                     <Badge className={cn(
                       "rounded-lg text-[9px] font-black uppercase tracking-widest border-none shadow-none px-3 py-1", 
                       asset.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600" : 
                       asset.status === "IN_USE" ? "bg-blue-50 text-blue-600" :
                       asset.status === "REPAIR" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                     )}>
                        {asset.status}
                     </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 whitespace-nowrap text-right">
                     <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button 
                           onClick={() => openDrawer(asset)}
                           className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-[#0F1059] transition-all shadow-sm"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => handleDelete(asset.id)}
                           className="p-2.5 rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-rose-600 transition-all shadow-sm"
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

      <AssetDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleUpsert}
        initialData={selectedAsset}
        employees={employees}
        equipmentEntries={equipmentEntries}
      />
    </div>
  );
}
