"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Key, 
  Mail,
  AlertTriangle,
  Lock as LockIcon,
  Eye,
  ShieldCheck,
  User as UserIcon,
  Filter,
  Monitor,
  Server,
  Network
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
import { CredentialDrawer } from "@/components/credentials/credential-drawer";
import { getCredentials, upsertCredential, deleteCredential, getCredentialDetails } from "@/lib/actions/credential-actions";
import { CredentialInput } from "@/lib/validations/credential";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

export default function CredentialsPage() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<any | null>(null);

  // Password decryption modal
  const [viewingPassword, setViewingPassword] = useState<{ isOpen: boolean; data: any | null }>({ isOpen: false, data: null });
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [res, empRes] = await Promise.all([
        getCredentials(),
        fetch("/api/employees").then(res => res.json())
      ]);

      if (res.success) setCredentials(res.data);
      if (Array.isArray(empRes)) setEmployees(empRes);
    } catch (error) {
      console.error("Initial fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCredentials = credentials.filter(cred => {
    const searchLow = search.toLowerCase();
    const employeeName = (cred.employee?.employee_name_th || "").toLowerCase();
    const matchesSearch = cred.username.toLowerCase().includes(searchLow) ||
                         employeeName.includes(searchLow) ||
                         (cred.email_address || "").toLowerCase().includes(searchLow);
    
    const matchesType = filterType === "ALL" || cred.account_type.includes(filterType);
    
    return matchesSearch && matchesType;
  });

  const handleUpsert = async (data: CredentialInput) => {
    const result = await upsertCredential(data);
    if (result.success) {
      toast({
        title: "Success",
        message: "Credential saved and encrypted",
        variant: "success"
      });
      fetchInitialData();
      setIsDrawerOpen(false);
    } else {
      toast({ title: "Error", message: result.error || "Failed to save", variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    const result = await deleteCredential(id);
    if (result.success) {
      toast({ message: "Credential revoked successfully", variant: "success" });
      fetchInitialData();
    }
  };

  const handleViewPassword = async (id: string) => {
    setIsDecrypting(true);
    const result = await getCredentialDetails(id);
    setIsDecrypting(false);
    if (result.success) {
      setViewingPassword({ isOpen: true, data: result.data });
    } else {
      toast({ title: "Error", message: result.error || "Failed to decrypt", variant: "error" });
    }
  };

  const openDrawer = (cred: any = null) => {
    if (cred) {
      setSelectedCredential(cred);
    } else {
      setSelectedCredential(null);
    }
    setIsDrawerOpen(true);
  };

  const getAccountIcon = (types: string[]) => {
    if (types.includes("EMAIL")) return <Mail className="h-4 w-4" />;
    if (types.includes("VPN")) return <Network className="h-4 w-4" />;
    if (types.includes("FILE_SHARE") || types.includes("ERP")) return <Server className="h-4 w-4" />;
    return <Key className="h-4 w-4" />;
  };

  const getAccountColor = (types: string[]) => {
    if (types.includes("EMAIL")) return "bg-amber-50 text-amber-500 border-amber-100";
    if (types.includes("VPN")) return "bg-blue-50 text-blue-500 border-blue-100";
    if (types.includes("ERP")) return "bg-purple-50 text-purple-500 border-purple-100";
    return "bg-zinc-50 text-zinc-500 border-zinc-100";
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 lg:ml-0 overflow-y-auto max-h-screen pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F1059] tracking-tighter uppercase leading-none flex items-center gap-3">
             <div className="h-12 w-12 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white border border-[#0F1059]/10 shadow-lg shadow-[#0F1059]/20">
                <ShieldCheck className="h-6 w-6" />
             </div>
             {t('credentials.title')}
          </h1>
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest mt-2">{t('credentials.subtitle')}</p>
        </div>
        <Button onClick={() => openDrawer()} className="rounded-2xl bg-[#0F1059] hover:bg-black h-14 px-8 font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-[#0F1059]/10">
          <Plus className="mr-2 h-4 w-4" /> {t('credentials.add_credential')}
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         <Card className="p-5 rounded-3xl border-rose-100 bg-rose-50/30 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
               <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
               <div className="text-2xl font-black text-rose-700">
                  {credentials.filter(c => c.employee?.status === "RESIGNED").length}
               </div>
               <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Resigned Pending Revoke</div>
            </div>
         </Card>
         <Card className="p-5 rounded-3xl border-blue-100 bg-blue-50/30 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
               <Mail className="h-6 w-6" />
            </div>
            <div>
               <div className="text-2xl font-black text-blue-700">
                  {credentials.filter(c => c.account_type.includes("EMAIL")).length}
               </div>
               <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Email Accounts</div>
            </div>
         </Card>
         <Card className="p-5 rounded-3xl border-zinc-100 bg-white shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600">
               <Key className="h-6 w-6" />
            </div>
            <div>
               <div className="text-2xl font-black text-zinc-700">{credentials.length}</div>
               <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Managed Access</div>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center p-4 rounded-3xl border border-zinc-100 bg-white shadow-sm font-sans uppercase">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-2xl border border-zinc-100 group focus-within:border-[#0F1059]/30 transition-all col-span-1 md:col-span-2">
             <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#0F1059]" />
             <input 
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-full placeholder:text-zinc-300"
                placeholder={t('credentials.search_placeholder')}
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
            <option value="ALL">{t('credentials.all_types')}</option>
            <option value="EMAIL">EMAIL / OUTLOOK</option>
            <option value="FILE_SHARE">FILE SERVER</option>
            <option value="VPN">VPN ACCESS</option>
            <option value="ERP">ERP SYSTEM</option>
            <option value="SOFTWARE">SPECIFIC SOFTWARE</option>
          </select>
        </div>
      </div>

      <Card className="rounded-[40px] border-zinc-100 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="w-full text-left font-sans">
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('credentials.employee')}</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('credentials.account_type')}</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('credentials.username')}</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{t('credentials.email_address')}</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black text-[#0F1059] uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                     <TableCell colSpan={5} className="h-20 animate-pulse bg-zinc-50/10" />
                   </TableRow>
                 ))
              ) : filteredCredentials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-20 text-center text-zinc-400 italic font-bold uppercase tracking-widest">
                      {t('credentials.no_credentials_found')}
                  </TableCell>
                </TableRow>
              ) : filteredCredentials.map((cred) => (
                <TableRow key={cred.id} className={cn("hover:bg-zinc-50/50 transition-colors group", cred.employee?.status === "RESIGNED" && "bg-rose-50/40 hover:bg-rose-50/60")}>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <UserIcon className="h-5 w-5 text-zinc-400 group-hover:text-[#0F1059]" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0F1059] uppercase tracking-tight truncate max-w-[200px]">
                            {locale === 'th' ? cred.employee?.employee_name_th : cred.employee?.employee_name_en}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{cred.employee?.employee_code}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {cred.account_type.map((type: string) => (
                        <span key={type} className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          type === "EMAIL" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          type === "VPN" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          type === "ERP" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          type === "FILE_SHARE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          "bg-zinc-50 text-zinc-500 border-zinc-100"
                        )}>
                          {t(`credentials.account_types.${type}`)}
                        </span>
                      ))}
                      {cred.employee?.status === "RESIGNED" && (
                         <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black animate-pulse shadow-sm">REVOKE REQUIRED</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center border",
                          getAccountColor(cred.account_type)
                       )}>
                          {getAccountIcon(cred.account_type)}
                       </div>
                       <span className="font-bold text-[#0F1059] uppercase text-sm">{cred.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 whitespace-nowrap">
                     <span className="text-xs font-medium text-zinc-500 lowercase">{cred.email_address || "-"}</span>
                  </TableCell>
                  <TableCell className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                          <Button 
                            onClick={() => handleViewPassword(cred.id)}
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 text-zinc-300 transition-all border border-transparent hover:border-emerald-100 shadow-sm"
                          >
                             {isDecrypting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            onClick={() => openDrawer(cred)}
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-2xl hover:bg-zinc-100 text-zinc-300 hover:text-[#0F1059] transition-all border border-transparent hover:border-zinc-200"
                          >
                             <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDelete(cred.id)}
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-2xl hover:bg-rose-50 text-zinc-300 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CredentialDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleUpsert}
        initialData={selectedCredential}
        employees={employees}
      />

      <Modal 
        isOpen={viewingPassword.isOpen} 
        onClose={() => setViewingPassword({ isOpen: false, data: null })}
      >
         <div className="space-y-6 pt-2 pb-4">
            <div className="text-center space-y-2">
               <h3 className="text-lg font-black text-[#0F1059] uppercase tracking-tighter">Credential Decrypted</h3>
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest underline decoration-emerald-500 underline-offset-4">Identity Verified & Logged</p>
            </div>

            <div className="p-6 rounded-[30px] bg-emerald-50 border border-emerald-100 flex flex-col items-center gap-4 text-center">
               <div className="h-16 w-16 rounded-[24px] bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                  <LockIcon className="h-8 w-8" />
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('credentials.password')}</div>
                  <div className="text-3xl font-black text-[#0F1059] tracking-wider select-all font-mono">
                     {viewingPassword.data?.password}
                  </div>
               </div>
               <Button 
                  className="w-full rounded-2xl bg-[#0F1059] text-white hover:bg-black h-12 text-[11px] font-black uppercase tracking-widest transition-all"
                  onClick={() => {
                     navigator.clipboard.writeText(viewingPassword.data?.password);
                     toast({ message: "Password copied to clipboard", variant: "success" });
                  }}
               >
                  Copy Password
               </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t('credentials.username')}</div>
                  <div className="text-sm font-black text-[#0F1059]">{viewingPassword.data?.username}</div>
               </div>
               <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t('credentials.account_type')}</div>
                  <div className="text-sm font-black text-[#0F1059]">{Array.isArray(viewingPassword.data?.account_type) ? viewingPassword.data.account_type.join(', ') : viewingPassword.data?.account_type}</div>
               </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#0F1059] flex items-center justify-between text-white shadow-xl shadow-[#0F1059]/10">
               <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                      <UserIcon className="h-6 w-6" />
                   </div>
                   <div>
                      <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{t('credentials.employee')}</div>
                      <div className="text-sm font-black uppercase tracking-tight">{viewingPassword.data?.employee?.employee_name_th}</div>
                   </div>
               </div>
               {viewingPassword.data?.employee?.status === "RESIGNED" && (
                  <Badge className="bg-rose-500 text-white border-none py-1 px-3 rounded-lg text-[9px] font-black animate-pulse shadow-lg shadow-rose-500/20">RESIGNED</Badge>
               )}
            </div>
         </div>
      </Modal>
    </div>
  );
}
