"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Ticket,
  Package,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  TrendingUp,
  Inbox,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  Loader2,
  X,
  ImageIcon,
  TrendingDown,
  ArrowUpDown,
  Filter,
  Settings2,
  Search,
  ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LabelList
} from "recharts";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Month Filter States
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthOptions = useMemo(() => {
    const options = new Set<string>();
    const now = new Date();
    options.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        options.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(options).sort().reverse();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (dateFilter === "ALL") return requests;
    return requests.filter(r => {
      const d = new Date(r.createdAt);
      return !isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === dateFilter;
    });
  }, [requests, dateFilter]);

  const filteredActivities = useMemo(() => {
    if (dateFilter === "ALL") return activities;
    return activities.filter(a => {
      const d = new Date(a.createdAt);
      return !isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === dateFilter;
    });
  }, [activities, dateFilter]);

  // Chart interactivity states
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const toggleSeries = (key: string) => {
    setHiddenSeries(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleChartClick = (type: string, value: string) => {
    if (isAdmin) {
      router.push(`/admin/tickets?q=${encodeURIComponent(value)}`);
    }
  };

  // Comment & Reply States
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  
  // Dashboard Chart Config States
  const [chartConfig, setChartConfig] = useState<any>({
    trend: { months: 6 },
    proportion: { sort: 'value', order: 'desc', limit: 10 },
    priority: { months: 6 },
    department: { months: 6, selected: [] as string[] },
    type: { sort: 'value', order: 'desc', limit: 7 }
  });

  const updateChartConfig = (chart: string, updates: any) => {
    setChartConfig((prev: any) => ({
      ...prev,
      [chart]: { ...prev[chart], ...updates }
    }));
  };

  const isAdmin = (session?.user as any)?.role === "admin";
  const userName = session?.user?.name || "Member";

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const endpoints = isAdmin
        ? ["/api/requests", "/api/equipment-entry-lists", "/api/equipment-lists"]
        : ["/api/requests", "/api/equipment-lists"];

      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      const data = await Promise.all(responses.map(res => res.json()));

      const requestsData = data[0] || [];
      setRequests(Array.isArray(requestsData) ? requestsData : []);

      if (isAdmin) {
        const entriesData = data[1] || [];
        const inventoryData = data[2] || [];
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);

        const merged = [
          ...(Array.isArray(requestsData) ? requestsData.filter(r => r.status !== 'CLOSED' && r.status !== 'RESOLVED').map(r => ({ ...r, type: 'REQUEST' })) : []),
          ...(Array.isArray(entriesData) ? entriesData.map(e => ({ ...e, type: 'EQUIPMENT' })) : [])
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(merged);
      } else {
        const inventoryData = data[1] || [];
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setActivities(Array.isArray(requestsData) ? requestsData.filter(r => r.status !== 'CLOSED' && r.status !== 'RESOLVED').map(r => ({ ...r, type: 'REQUEST' })) : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async (requestId: string) => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText,
          requestId,
          parentId: replyingToId
        })
      });
      setCommentText("");
      setReplyingToId(null);
      setReplyingToUser(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  useEffect(() => {
    if (session) fetchDashboardData();
  }, [session]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRequests.forEach(r => {
      const cat = r.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    let data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const { sort, order, limit } = chartConfig.proportion;

    data.sort((a, b) => {
      if (sort === 'value') {
        return order === 'asc' ? a.value - b.value : b.value - a.value;
      }
      return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    if (limit !== 'ALL') {
      data = data.slice(0, Number(limit));
    }

    return data;
  }, [filteredRequests, chartConfig.proportion]);

  const trendData = useMemo(() => {
    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const result: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const count = chartConfig.trend.months;
    for (let i = count - 1; i >= 0; i--) {
       const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
       result.push({
         month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
         yearMonth: `${d.getFullYear()}-${d.getMonth()}`,
         new: 0, resolved: 0, pending: 0, total: 0
       });
    }

    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = result.findIndex(item => item.yearMonth === ym);
      if (idx !== -1) {
        result[idx].new += 1;
        result[idx].total += 1;
        if (r.status === 'RESOLVED' || r.status === 'CLOSED') result[idx].resolved += 1;
        else result[idx].pending += 1;
      }
    });
    return result.map(({ yearMonth, ...rest }) => rest);
  }, [requests, dateFilter, chartConfig.trend.months]);

  const urgencyData = useMemo(() => {
    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const result: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const count = chartConfig.priority.months;
    for (let i = count - 1; i >= 0; i--) {
       const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
       result.push({
         month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
         yearMonth: `${d.getFullYear()}-${d.getMonth()}`,
         high: 0, medium: 0, low: 0
       });
    }
    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = result.findIndex(item => item.yearMonth === ym);
      if (idx !== -1) {
        const p = r.priority || 'LOW';
        if (p === 'HIGH') result[idx].high += 1;
        else if (p === 'MEDIUM') result[idx].medium += 1;
        else result[idx].low += 1;
      }
    });
    return result.map(({ yearMonth, ...rest }) => rest);
  }, [requests, dateFilter, chartConfig.priority.months]);

  const resolutionRateThisMonth = useMemo(() => {
    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const targetMonth = refDate.getMonth();
    const targetYear = refDate.getFullYear();
    const targetMonthRequests = dateFilter === "ALL" ? requests.filter(r => {
      const d = new Date(r.createdAt);
      return !isNaN(d.getTime()) && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    }) : filteredRequests;
    
    const total = targetMonthRequests.length;
    const resolved = targetMonthRequests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
    return total === 0 ? 0 : Math.round((resolved / total) * 100);
  }, [requests, filteredRequests, dateFilter]);

  const departmentMonthData = useMemo(() => {
    const deptSet = new Set<string>();
    requests.forEach(r => deptSet.add(r.employee?.department || 'ไม่ระบุ (Unknown)'));

    const refDate = dateFilter === "ALL" ? new Date() : new Date(dateFilter + "-01T00:00:00");
    const result: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const count = chartConfig.department.months;
    for (let i = count - 1; i >= 0; i--) {
       const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
       const obj: any = { 
         month: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
         yearMonth: `${d.getFullYear()}-${d.getMonth()}`, 
         total: 0 
       };
       deptSet.forEach(dept => {
         if (chartConfig.department.selected.length === 0 || chartConfig.department.selected.includes(dept)) {
           obj[dept] = 0;
         }
       });
       result.push(obj);
    }

    requests.forEach(r => {
      const d = new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = result.findIndex(item => item.yearMonth === ym);
      if (idx !== -1) {
        const dept = r.employee?.department || 'ไม่ระบุ (Unknown)';
        result[idx][dept] += 1;
        result[idx].total += 1;
      }
    });

    return {
      data: result.map(({ yearMonth, ...rest }) => rest),
      departments: Array.from(deptSet).filter(dept => chartConfig.department.selected.length === 0 || chartConfig.department.selected.includes(dept))
    };
  }, [requests, dateFilter, chartConfig.department]);

  const typeRequestData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRequests.forEach(r => {
      const type = r.type_request || 'ไม่ระบุ (None)';
      counts[type] = (counts[type] || 0) + 1;
    });
    
    let data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const { sort, order, limit } = chartConfig.type;
    
    data.sort((a, b) => {
      if (sort === 'value') {
        return order === 'asc' ? a.value - b.value : b.value - a.value;
      }
      return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    if (limit !== 'ALL') {
      data = data.slice(0, Number(limit));
    }
    
    return data;
  }, [filteredRequests, chartConfig.type]);

  const EXTENDED_COLORS = [
    '#0F1059', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
    '#6366F1', '#84CC16', '#D946EF', '#EAB308', '#64748B'
  ];

  const COLORS = ['#0F1059', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  type StatCard = {
    label: string;
    value: string | number;
    icon: any;
    sub: React.ReactNode;
    color: string;
    isGauge?: boolean;
    trendLabel?: string;
    trendValue?: number;
  };

  const adminStats: StatCard[] = [
    { 
      label: "รายการแจ้งซ่อม / Active Tickets", 
      value: filteredRequests.filter(r => r.status !== 'CLOSED').length, 
      icon: Ticket, 
      sub: <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-rose-500" /><span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">กำลังดำเนินการ / Pending</span></div>, 
      color: "blue" 
    },
    { 
      label: "สต็อกต่ำ / Inventory Alert", 
      value: inventory.filter(i => i.remaining < 3).length, 
      icon: Package, 
      sub: <div className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3 text-amber-500" /><span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">ใกล้หมด / Low stock</span></div>, 
      color: "amber" 
    },
    { 
      label: "เป้าหมายเดือนนี้ / Resolution KPI", 
      value: resolutionRateThisMonth, 
      isGauge: true, 
      icon: CheckCircle2, 
      sub: <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-500" /><span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">ปิดงาน / Resolved</span></div>, 
      color: "emerald" 
    },
    {
      label: "รายการใหม่ / Total Requests", 
      value: filteredRequests.length, 
      icon: TrendingUp, 
      sub: <div className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-blue-500" /><span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">{dateFilter === "ALL" ? "ทั้งหมด / All Time" : "ในเดือนนี้ / This Period"}</span></div>, 
      color: "rose"
    },
  ];

  const userStats: StatCard[] = [
    { label: "แจ้งซ่อมของฉัน / My Active Tickets", value: filteredRequests.filter(r => r.userId === (session?.user as any)?.id && r.status !== 'RESOLVED' && r.status !== 'CLOSED').length, icon: Ticket, sub: "กำลังดำเนินการ / In-progress", color: "blue" },
    { label: "รายการที่ปิดแล้ว / Closed Tasks", value: filteredRequests.filter(r => r.userId === (session?.user as any)?.id && (r.status === 'RESOLVED' || r.status === 'CLOSED')).length, icon: CheckCircle2, sub: "เรียบร้อย / Resolved", color: "emerald" },
    { label: "รอการตรวจสอบ / Wait for Review", value: filteredRequests.filter(r => r.userId === (session?.user as any)?.id && r.status === 'OPEN').length, icon: Clock, sub: "รอดำเนินการ / Pending", color: "amber" },
    { label: "รายการสำคัญ / Urgent items", value: filteredRequests.filter(r => r.userId === (session?.user as any)?.id && r.priority === 'HIGH').length, icon: AlertCircle, sub: "ต้องการความสนใจ / Attention", color: "rose" },
  ];

  const statsToUse: StatCard[] = isAdmin ? adminStats : userStats;

  const [deptSearch, setDeptSearch] = useState("");

  const ChartSettings = ({ chartKey, type, options }: { chartKey: string, type: 'categorical' | 'trend' | 'department', options?: string[] }) => {
    const config = chartConfig[chartKey];
    return (
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <Settings2 className="h-4 w-4" />
          </Button>
        }
        className="w-64"
      >
        {type === 'trend' && (
          <div className="p-1">
            <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1 flex items-center gap-2">
              <Clock className="h-3 w-3" /> ช่วงเวลา (Time Range)
            </div>
            {[3, 6, 12, 18, 24].map(m => (
              <DropdownItem key={m} onClick={() => updateChartConfig(chartKey, { months: m })} className={config.months === m ? "bg-zinc-50 font-bold text-blue-600" : ""}>
                <div className="flex items-center justify-between w-full">
                  <span>{m} เดือนล่าสุด / Last {m} Months</span>
                  {config.months === m && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
              </DropdownItem>
            ))}
          </div>
        )}
        {type === 'categorical' && (
          <div className="p-1">
            <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1 flex items-center gap-2">
              <ArrowUpDown className="h-3 w-3" /> เรียงลำดับ (Sort By)
            </div>
            <DropdownItem onClick={() => updateChartConfig(chartKey, { sort: 'value' })} className={config.sort === 'value' ? "bg-zinc-50 font-bold text-blue-600" : ""}>
              <div className="flex items-center justify-between w-full">
                <span>จำนวนงาน / Ticket Count</span>
                {config.sort === 'value' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => updateChartConfig(chartKey, { sort: 'name' })} className={config.sort === 'name' ? "bg-zinc-50 font-bold text-blue-600" : ""}>
              <div className="flex items-center justify-between w-full">
                <span>ตามตัวอักษร / Alphabetical</span>
                {config.sort === 'name' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </DropdownItem>
            
            <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-t border-b border-zinc-50 mt-2 mb-1 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> ลำดับ (Order)
            </div>
            <DropdownItem onClick={() => updateChartConfig(chartKey, { order: 'desc' })} className={config.order === 'desc' ? "bg-zinc-50 font-bold text-blue-600" : ""}>
              <div className="flex items-center justify-between w-full">
                <span>มากไปน้อย / Descending</span>
                {config.order === 'desc' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => updateChartConfig(chartKey, { order: 'asc' })} className={config.order === 'asc' ? "bg-zinc-50 font-bold text-blue-600" : ""}>
              <div className="flex items-center justify-between w-full">
                <span>น้อยไปมาก / Ascending</span>
                {config.order === 'asc' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </div>
            </DropdownItem>
            
            <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-t border-b border-zinc-50 mt-2 mb-1 flex items-center gap-2">
              <Filter className="h-3 w-3" /> แสดงผล (Display Limit)
            </div>
            {[5, 7, 10, 15, 'ALL'].map(l => (
              <DropdownItem key={l} onClick={() => updateChartConfig(chartKey, { limit: l })} className={config.limit === l ? "bg-zinc-50 font-bold text-blue-600" : ""}>
                <div className="flex items-center justify-between w-full">
                  <span>{l === 'ALL' ? 'ทั้งหมด / Show All' : `แสดง ${l} รายการ / Top ${l}`}</span>
                  {config.limit === l && <CheckCircle2 className="h-3.5 w-3.5" />}
                </div>
              </DropdownItem>
            ))}
          </div>
        )}
        {type === 'department' && (
          <div className="p-1">
            <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
               ช่วงเวลา / Time Range
            </div>
            {[3, 6, 12].map(m => (
              <DropdownItem key={m} onClick={() => updateChartConfig(chartKey, { months: m })} className={config.months === m ? "bg-zinc-50 font-bold text-blue-600" : ""}>
                {m} เดือนล่าสุด / Last {m} Months
              </DropdownItem>
            ))}
            <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-t border-b border-zinc-50 mt-2 mb-1">
               กรองแผนก / Filter Departments
            </div>
            <div className="px-2 py-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาแผนก..." 
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto mt-1 custom-scrollbar">
              <DropdownItem onClick={() => updateChartConfig(chartKey, { selected: [] })} className={config.selected.length === 0 ? "bg-blue-50 text-blue-600 font-bold" : ""}>
                แสดงทั้งหมด / All Departments
              </DropdownItem>
              {options?.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => (
                <DropdownItem 
                  key={dept} 
                  onClick={(e: any) => {
                    e.stopPropagation();
                    const current = config.selected;
                    const next = current.includes(dept) ? current.filter((d: string) => d !== dept) : [...current, dept];
                    updateChartConfig(chartKey, { selected: next });
                  }}
                  className={config.selected.includes(dept) ? "bg-blue-50 text-blue-600 font-bold" : ""}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors", config.selected.includes(dept) ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-200")}>
                      {config.selected.includes(dept) && <CheckCircle2 className="h-2.5 w-2.5" />}
                    </div>
                    <span className="truncate">{dept}</span>
                  </div>
                </DropdownItem>
              ))}
            </div>
          </div>
        )}
      </Dropdown>
    );
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full animate-in fade-in duration-1000">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            {isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> : <LayoutDashboard className="h-3.5 w-3.5 text-blue-500" />}
            {isAdmin ? 'ศูนย์ควบคุมระบบ / Administrative Control Center' : 'หน้าแรก/ Dashboard'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-50 p-1 rounded-xl border border-zinc-100 h-9">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-full bg-white text-zinc-700 text-[11px] font-black uppercase tracking-wider px-3 rounded-lg border border-zinc-100 outline-none cursor-pointer focus:ring-2 focus:ring-[#0F1059]/10"
          >
            <option value="ALL">ทุกช่วงเวลา / All Time</option>
            {monthOptions.map(m => {
              const [year, month] = m.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1);
              const label = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
        </div>
      </header>

      {/* Stats Grid */}
      <div className={cn("grid gap-3", isAdmin ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 " : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4")}>
        {statsToUse.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden p-5 border-zinc-100 rounded-2xl hover:border-[#0F1059]/20 hover:-translate-y-0.5 transition-all duration-500 bg-white">
            <div className={cn(
              "absolute -right-3 -top-3 w-20 h-20 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700",
              stat.color === 'blue' ? "bg-blue-600" : stat.color === 'amber' ? "bg-amber-600" : stat.color === 'emerald' ? "bg-emerald-600" : stat.color === 'indigo' ? "bg-indigo-600" : "bg-rose-600"
            )} />

            <div className="flex justify-between items-start mb-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" : stat.color === 'amber' ? "bg-amber-50 text-amber-600" : stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"
              )}>
                <stat.icon className="h-5.5 w-5.5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-200 group-hover:text-zinc-900 transition-colors" />
            </div>

            <div className="flex justify-between items-end gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">{stat.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-zinc-900">{stat.isGauge ? `${stat.value}%` : stat.value}</span>
                  <span className="hidden sm:block shrink-0">{stat.sub}</span>
                </div>
              </div>

              {stat.isGauge && (
                <div className="relative flex items-center justify-center h-12 w-12 shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <svg className="transform -rotate-90 w-12 h-12">
                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-50" />
                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={(2 * Math.PI * 22) - ((stat.value as number) / 100) * (2 * Math.PI * 22)} className={cn("transition-all duration-1500 ease-out", (stat.value as number) >= 80 ? 'text-emerald-500' : (stat.value as number) >= 50 ? 'text-amber-500' : 'text-rose-500')} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><Activity className={cn("h-3.5 w-3.5", (stat.value as number) >= 80 ? "text-emerald-500" : (stat.value as number) >= 50 ? "text-amber-500" : "text-rose-500")} /></div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Layout grid: 3-column split, Left 2/3 (Charts), Right 1/3 (Activity) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5 w-full">
          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* Chart 1: Trend Area Chart */}
              <Card className="rounded-2xl border-zinc-100 p-4 sm:p-5 bg-white flex flex-col min-h-[350px] lg:col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[100px] opacity-20 pointer-events-none" />
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" /> สมดุลภาระงาน / Workload Balance Trend
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                      เปรียบเทียบเคสเปิดใหม่ VS ปิดได้ (ย้อนหลัง {chartConfig.trend.months} เดือน)
                    </p>
                  </div>
                  <ChartSettings chartKey="trend" type="trend" />
                </div>
                <div className="flex-1 w-full min-h-[250px] -ml-4 sm:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dx={-10} />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-zinc-100 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[150px]">
                                <p className="text-[12px] font-black text-[#0F1059] mb-2 uppercase border-b border-zinc-100 pb-2">{label} <span className="text-zinc-400 font-bold ml-1 text-[9px]">- {d.total} TICKETS</span></p>
                                {!hiddenSeries.includes('new') && (
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between gap-4 mb-2">
                                    <span className="text-rose-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />เปิดใหม่ / New</span><span className="text-zinc-900">{d.new}</span>
                                  </p>
                                )}
                                {!hiddenSeries.includes('resolved') && (
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between gap-4 mb-2">
                                    <span className="text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />ปิดได้ / Resolved</span><span className="text-zinc-900">{d.resolved}</span>
                                  </p>
                                )}
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex justify-between gap-4 border-t border-zinc-50 pt-2 mt-1">
                                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />ค้างคา / Pending</span><span className="text-zinc-900">{d.pending}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Legend
                        content={() => (
                          <ul className="flex flex-wrap justify-center gap-6 pb-5 border-b border-zinc-50 mb-3">
                            <li className={cn("flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wider transition-opacity duration-300", !hiddenSeries.includes('new') ? "opacity-100" : "opacity-40")} onClick={() => toggleSeries('new')}>
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" />
                              <span className={cn(!hiddenSeries.includes('new') ? "text-rose-600" : "text-zinc-400")}>เปิดใหม่ (New)</span>
                            </li>
                            <li className={cn("flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wider transition-opacity duration-300", !hiddenSeries.includes('resolved') ? "opacity-100" : "opacity-40")} onClick={() => toggleSeries('resolved')}>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                              <span className={cn(!hiddenSeries.includes('resolved') ? "text-emerald-600" : "text-zinc-400")}>ปิดแล้ว (Resolved)</span>
                            </li>
                          </ul>
                        )}
                        verticalAlign="top"
                      />
                      <Area hide={hiddenSeries.includes('new')} name="เปิดใหม่ / New" type="monotone" dataKey="new" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" animationDuration={1500} activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#EF4444' }} />
                      <Area hide={hiddenSeries.includes('resolved')} name="ปิดแล้ว / Resolved" type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" animationDuration={1500} activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#10B981' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 3: Urgency Stacked Bar */}
              <Card className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-8 h-full bg-linear-to-r from-red-50/50 to-transparent pointer-events-none" />
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500" /> วิเคราะห์ระดับความด่วน
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Priority Analysis (ย้อนหลัง {chartConfig.priority.months} เดือน)</p>
                  </div>
                  <ChartSettings chartKey="priority" type="trend" />
                </div>
                <div className="flex-1 w-full min-h-[250px] -ml-4 sm:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={urgencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dx={-10} />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const total = payload.reduce((acc: number, item: any) => acc + item.value, 0);
                            return (
                              <div className="bg-white p-3 border border-zinc-100 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[150px]">
                                <p className="text-[12px] font-black text-[#0F1059] mb-2 uppercase border-b border-zinc-100 pb-2">{label} <span className="text-zinc-400 font-bold ml-1 text-[9px]">- {total} TICKETS</span></p>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center gap-4 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: entry.fill }}>
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                      {entry.name}
                                    </span>
                                    <span className="text-[11px] font-black text-zinc-900">{entry.value}</span>
                                  </div>
                                ))}
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2 opacity-70 border-t border-zinc-50 pt-2 text-center">คลิกที่แท่งสีเพื่อดูข้อมูล</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend
                        content={() => {
                          const items = [
                            { key: 'high', name: 'สูง (High)', color: '#EF4444' },
                            { key: 'medium', name: 'ปานกลาง (Medium)', color: '#F59E0B' },
                            { key: 'low', name: 'ต่ำ (Low)', color: '#3B82F6' }
                          ];
                          return (
                            <ul className="flex flex-wrap justify-center gap-4 pb-4 border-b border-zinc-50 mb-3">
                              {items.map(item => {
                                const isActive = !hiddenSeries.includes(item.key);
                                return (
                                  <li key={item.key} className={cn("flex items-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider transition-opacity duration-300", isActive ? "opacity-100" : "opacity-40 grayscale")} onClick={() => toggleSeries(item.key)}>
                                    <span className="w-2.5 h-1.5 rounded" style={{ backgroundColor: item.color }} />
                                    <span className={cn(isActive ? "text-zinc-700" : "text-zinc-400")}>{item.name.split(' ')[0]}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        }}
                        verticalAlign="top"
                      />
                      <Bar hide={hiddenSeries.includes('high')} name="สูง" dataKey="high" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} animationDuration={1000} onClick={() => handleChartClick('priority', 'HIGH')} cursor="pointer" className="hover:opacity-80 transition-opacity outline-none" />
                      <Bar hide={hiddenSeries.includes('medium')} name="ปานกลาง" dataKey="medium" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} animationDuration={1000} onClick={() => handleChartClick('priority', 'MEDIUM')} cursor="pointer" className="hover:opacity-80 transition-opacity outline-none" />
                      <Bar hide={hiddenSeries.includes('low')} name="ต่ำ" dataKey="low" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1000} onClick={() => handleChartClick('priority', 'LOW')} cursor="pointer" className="hover:opacity-80 transition-opacity outline-none" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 2: Proportion Donut */}
              <Card className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col relative overflow-hidden">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-[#0F1059]" /> สัดส่วนอุปกรณ์ที่เป็นปัญหา
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                      {chartConfig.proportion.limit === 'ALL' ? 'ทั้งหมด' : `Top ${chartConfig.proportion.limit}`} แบ่งตาม Hardware/Software
                    </p>
                  </div>
                  <ChartSettings chartKey="proportion" type="categorical" />
                </div>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.map(d => ({ ...d, value: hiddenSeries.includes(`pie-${d.name}`) ? 0 : d.value }))}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1200}
                        onClick={(data) => handleChartClick('category', data.name || 'Unknown')}
                        cursor="pointer"
                      >
                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />)}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const fill = payload[0].payload.fill;
                            return (
                              <div className="bg-white p-3 border border-zinc-100 rounded-xl flex items-center gap-3">
                                <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: fill }} />
                                <div>
                                  <p className="text-[11px] font-black text-zinc-900 uppercase">{payload[0].name}</p>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5"><span className="text-zinc-900 text-sm font-black mr-1">{payload[0].value}</span> Tickets</p>
                                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-70">คลิกเพื่อดูรายการ / Click to drill down</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        content={() => (
                          <ul className="flex flex-wrap justify-center gap-3 pt-6 border-t border-zinc-50 mt-2">
                            {categoryData.map((entry, index) => {
                              const key = `pie-${entry.name}`;
                              const isActive = !hiddenSeries.includes(key);
                              return (
                                <li key={index}
                                  className={cn("flex items-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider transition-all duration-300", isActive ? "opacity-100" : "opacity-40 grayscale")}
                                  onClick={() => toggleSeries(key)}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <span className={cn(isActive ? "text-zinc-700" : "text-zinc-400")}>{entry.name}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 4: Department Breakdown */}
              <Card className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col lg:col-span-2 xl:col-span-2 relative overflow-hidden mt-2 lg:mt-0">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" /> แหล่งที่มาของปัญหารายเดือน
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                      Requests by Department (ย้อนหลัง {chartConfig.department.months} เดือน)
                    </p>
                  </div>
                  <ChartSettings 
                    chartKey="department" 
                    type="department" 
                    options={Array.from(new Set(requests.map(r => r.employee?.department || 'ไม่ระบุ (Unknown)')))} 
                  />
                </div>
                <div className="flex-1 w-full min-h-[250px] -ml-4 sm:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentMonthData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dx={-10} />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const total = payload[0].payload.total;
                            return (
                              <div className="bg-white p-3 border border-zinc-100 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[150px]">
                                <p className="text-[12px] font-black text-[#0F1059] mb-2 uppercase border-b border-zinc-100 pb-2">{label} <span className="text-zinc-400 font-bold ml-1 text-[9px]">- {total} TICKETS</span></p>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center gap-4 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: entry.fill }}>
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                      <span className="truncate max-w-[80px]">{entry.name}</span>
                                    </span>
                                    <span className="text-[11px] font-black text-zinc-900">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend
                        content={() => (
                          <ul className="flex flex-wrap justify-center gap-2 pb-4 border-b border-zinc-50 mb-3 max-h-[60px] overflow-y-auto custom-scrollbar">
                            {departmentMonthData.departments.map((dept, idx) => {
                              const color = EXTENDED_COLORS[idx % EXTENDED_COLORS.length];
                              const key = `dept-${dept}`;
                              const isActive = !hiddenSeries.includes(key);
                              return (
                                <li key={key} className={cn("flex items-center gap-1 cursor-pointer text-[8px] font-black uppercase tracking-wider transition-opacity duration-300", isActive ? "opacity-100" : "opacity-40 grayscale")} onClick={() => toggleSeries(key)}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                  <span className={cn(isActive ? "text-zinc-700" : "text-zinc-400", "truncate max-w-[60px]")}>{dept}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        verticalAlign="top"
                      />
                      {departmentMonthData.departments.map((dept, idx) => (
                        <Bar
                          key={dept}
                          hide={hiddenSeries.includes(`dept-${dept}`)}
                          name={dept}
                          dataKey={dept}
                          stackId="a"
                          fill={EXTENDED_COLORS[idx % EXTENDED_COLORS.length]}
                          animationDuration={1000}
                          onClick={() => handleChartClick('department', dept)}
                          cursor="pointer"
                          className="hover:brightness-110 transition-all outline-none"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Chart 5: Top Type Requests */}
              <Card className="rounded-2xl border-zinc-100 shadow-sm p-4 sm:p-5 bg-white min-h-[350px] flex flex-col lg:col-span-2 xl:col-span-2 relative overflow-hidden mt-2 lg:mt-0">
                <div className="absolute -right-10 top-10 w-40 h-40 bg-purple-50 rounded-full opacity-50 pointer-events-none" />
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-purple-500" /> ลักษณะงานที่พบบ่อย
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                      {chartConfig.type.limit === 'ALL' ? 'ประเภทงานทั้งหมด' : `Top ${chartConfig.type.limit} ประเภทงานที่พบบ่อย`}
                    </p>
                  </div>
                  <ChartSettings chartKey="type" type="categorical" />
                </div>
                <div className="flex-1 w-full min-h-[250px] -ml-2 sm:ml-0 mt-4 pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={typeRequestData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} axisLine={false} tickLine={false} allowDataOverflow={false} />
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#0F1059] text-white p-3 shadow-xl rounded-xl flex items-center gap-3 border border-white/10">
                                <div className="w-2 h-8 rounded-full bg-purple-500" />
                                <div>
                                  <p className="text-[11px] font-black uppercase truncate max-w-[150px]">{payload[0].payload.name}</p>
                                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5"><span className="text-white text-sm font-black mr-1">{payload[0].value}</span> Tickets</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ fill: '#f8fafc', radius: 8 }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#8B5CF6"
                        radius={[0, 8, 8, 0]}
                        barSize={20}
                        animationDuration={1200}
                        onClick={(data) => handleChartClick('type_request', data.name || 'Unknown')}
                        cursor="pointer"
                        className="hover:fill-purple-600 transition-colors"
                      >
                        <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: '#64748B', fontWeight: 900 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>
          )}

          {/* User IT Stock Section */}
          {!isAdmin && (
            <Card className="rounded-2xl border-zinc-100 overflow-hidden flex flex-col bg-white">
              <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/10">
                <h2 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-500" /> สต็อกอุปกรณ์ไอที / IT Equipment Stock
                </h2>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-slate-50/50">
                {inventory.map((item, idx) => (
                  <div key={idx} className="p-3 border border-zinc-100 rounded-xl bg-white flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all group">
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3 shadow-xs text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {item.equipmentEntry?.purchaseOrder?.picture ? (
                        <div className="rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                          <img src={item.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover hover:scale-125 transition-transform duration-700" />
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300"><ImageIcon className="w-6 h-6" /></div>
                      )}
                    </div>
                    <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight line-clamp-1 w-full" title={item.equipmentEntry?.list || 'Unknown'}>{item.equipmentEntry?.list || 'Unknown'}</p>
                    <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase w-full truncate">{item.equipmentEntry?.brand_name || '-'}</p>
                    <div className="mt-4 bg-zinc-50 w-full py-2 rounded-lg border border-zinc-100/50 group-hover:bg-indigo-50 transition-colors">
                      <p className="text-[10px] font-black text-[#0F1059]"><span className="text-zinc-400 font-bold mr-1">คงเหลือ:</span>{item.remaining}</p>
                    </div>
                  </div>
                ))}
                {inventory.length === 0 && (
                  <div className="col-span-full py-10 text-center flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-zinc-300" />
                    <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">ไม่พบอุปกรณ์ในคลัง / No stock found</p>
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>

        {/* Right Side 1/3: Recent Activity */}
        <div className="xl:col-span-1 space-y-5">
          <Card className="rounded-2xl border-zinc-100 overflow-hidden flex flex-col bg-white h-full">
            <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/10">
              <div>
                <h2 className="text-[13px] font-black text-zinc-900 uppercase tracking-widest">{isAdmin ? 'กิจกรรมล่าสุด / Recent Activity' : 'รายการแจ้งซ่อม / Activity'}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(isAdmin ? "/admin/equipment-entry-lists" : "/user/my-requests")}
                className="h-8 rounded-lg text-[10px] font-black uppercase text-[#0F1059] bg-[#0F1059]/5 hover:bg-[#0F1059]/10"
              >
                ดูประวัติ / View History
              </Button>
            </div>
            <div className="divide-y divide-zinc-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse flex gap-4">
                    <div className="h-12 w-12 bg-zinc-50 rounded-2xl" />
                    <div className="flex-1 space-y-2"><div className="h-4 bg-zinc-50 rounded w-1/3" /><div className="h-3 bg-zinc-100 rounded w-1/4" /></div>
                  </div>
                ))
              ) : filteredActivities.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-3">
                  <Inbox className="h-12 w-12 text-zinc-100" />
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">ไม่มีการร้องขอ / No Request</p>
                </div>
              ) : filteredActivities.slice(0, 10).map((act) => (
                <div key={act.id} className="p-5 flex flex-col group border-b last:border-0 border-zinc-50">
                  <div className="grid items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100 transition-transform group-hover:scale-105",
                          act.type === 'EQUIPMENT' ? "bg-emerald-50 text-emerald-600" :
                            act.status === 'CLOSED' ? "bg-zinc-50 text-zinc-400" : "bg-white text-[#0F1059]"
                        )}>
                          {act.type === 'EQUIPMENT' ? <Package className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                        </div>
                        <h3 className="text-[13px] font-black text-zinc-900 truncate uppercase tracking-tight">
                          {act.type === 'EQUIPMENT' ? `นำเข้าไอเทม: ${act.list || 'Hardware'}` : act.description}
                        </h3>
                        <Badge className={cn(
                          "rounded-lg px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest border-none shadow-none",
                          act.type === 'EQUIPMENT' ? "bg-emerald-100 text-emerald-700" :
                            act.status === 'OPEN' ? "bg-blue-100 text-blue-700" :
                              act.status === 'IN_PROGRESS' ? "bg-amber-100 text-amber-700" :
                                act.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-700" :
                                  "bg-zinc-100 text-zinc-500"
                        )}>
                          {act.type === 'EQUIPMENT' ? 'ลงสต็อก / STOCKED' : act.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5">
                          {act.type === 'EQUIPMENT' ? <Activity className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {act.type === 'EQUIPMENT' ? `จำนวน / Qty: ${act.quantity}` : `${act.employee?.employee_name_th || 'ระบบ / System'}`}
                        </span>
                        <span className="h-1 w-1 bg-zinc-200 rounded-full" />
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(act.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                    <div className="flex w-full justify-end">
                      {act.type === 'REQUEST' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCommentId(expandedCommentId === act.id ? null : act.id)}
                          className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#0F1059] bg-[#0F1059]/5 hover:bg-[#0F1059]/10"
                        >
                          <Inbox className="h-3.5 w-3.5 mr-1.5" />{act.comments?.length || 0} ความคิดเห็น / Comments
                        </Button>
                      )}
                    </div>
                  </div>

                  {act.type === 'REQUEST' && expandedCommentId === act.id && (
                    <div className="mt-4 pl-14 space-y-4 border-l-2 border-[#0F1059]/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-3">
                        {act.comments?.map((comment: any) => (
                          <div key={comment.id} className={cn(
                            "bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 relative group/comment",
                            comment.parentId && "ml-4 border-l-2 border-[#0F1059]/10"
                          )}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black text-[#0F1059] uppercase tracking-widest">{comment.user?.username || 'User'}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setReplyingToId(comment.id); setReplyingToUser(comment.user?.username); }} className="opacity-0 group-hover/comment:opacity-100 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline transition-opacity">ตอบกลับ / Reply</button>
                                <span className="text-[9px] font-bold text-zinc-300">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <p className="text-[12px] font-medium text-zinc-600 leading-tight">
                              {comment.parentId && <span className="text-[#0F1059]/50 font-bold mr-1 italic">ตอบกลับคุณ / replied:</span>}
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {replyingToId && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-[#0F1059]/5 rounded-lg w-fit">
                            <span className="text-[9px] font-black uppercase text-[#0F1059]">กำลังตอบกลับคุณ / Replying to @{replyingToUser}</span>
                            <button onClick={() => { setReplyingToId(null); setReplyingToUser(null); }}><X className="h-3 w-3 text-rose-500" /></button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input type="text" placeholder={replyingToId ? "เขียนข้อความตอบกลับ... / Write a reply..." : "เขียนข้อความ... / Write a comment..."} className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-[11px] font-medium outline-none focus:border-[#0F1059]/20 transition-all" value={commentText} onChange={(e) => setCommentText(e.target.value)} disabled={isCommenting} onKeyDown={(e) => e.key === 'Enter' && handleComment(act.id)} />
                          <Button size="sm" onClick={() => handleComment(act.id)} disabled={isCommenting || !commentText.trim()} className="h-8 rounded-xl bg-[#0F1059] hover:bg-[#0F1059]/90 text-[10px] font-black uppercase px-4">{isCommenting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'ส่ง / Send'}</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
