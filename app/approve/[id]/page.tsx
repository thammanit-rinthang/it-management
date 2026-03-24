"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Package,
  ShieldAlert,
  Lock,
  ArrowRight,
  Ticket,
  ImageIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function ApprovalPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("t") || "r"; // r: Request, e: EquipmentRequest
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [requestData, setRequestData] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/approve/${id}?t=${type}`);
    }
  }, [authStatus, id, type, router]);

  useEffect(() => {
    if (session && id) {
      fetchData();
      fetchEmployee();
    }
  }, [session, id, type]);

  const fetchEmployee = async () => {
    const empId = (session?.user as any)?.employeeId;
    if (!empId) return;
    try {
      const res = await fetch(`/api/employees/${empId}`);
      const data = await res.json();
      setEmployee(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = type === "e"
        ? `/api/equipment-requests/${id}`
        : `/api/requests/${id}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("ไม่พบข้อมูลคำร้องขอ / Request not found");
      }
      const data = await res.json();
      setRequestData(data);
      console.log(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestData && employee) {
      // Comparison: logged in user's Thai Name vs. request's Approval name
      const isApproverMatch = employee.employee_name_th === requestData.approval;
      setIsAuthorized(isApproverMatch || (session?.user as any)?.role === "admin");
    }
  }, [requestData, employee, session]);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!isAuthorized) return;
    setIsSubmitting(true);
    try {
      const endpoint = type === "e"
        ? `/api/equipment-requests/${id}`
        : `/api/requests/${id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_status: status,
          approval_comment: comment,
        })
      });

      if (res.ok) {
        fetchData();
        alert(`ดำเนินการ${status === "APPROVED" ? "อนุมัติ" : "ไม้อนุมัติ"}เรียบร้อยแล้ว`);
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-100 gap-4 bg-zinc-50 h-screen w-full fixed inset-0">
        <Loader2 className="h-10 w-10 text-[#0F1059] animate-spin" />
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">กำลังดึงข้อมูล... / Processing auth & details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-10 text-center space-y-4 border-rose-100 bg-white">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-[#0F1059] uppercase">{error}</h2>
          <Button onClick={() => router.push('/')} variant="ghost" className="text-[#0F1059] hover:bg-zinc-100">
            <ChevronLeft className="h-4 w-4 mr-2" /> กลับหน้าหลัก / Home
          </Button>
        </Card>
      </div>
    );
  }

  // Requirement: Once approved/rejected, the form is inaccessible
  if (requestData?.approval_status !== "PENDING") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-10 text-center space-y-6 border-amber-100 bg-white rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
          <div className="h-20 w-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0F1059] uppercase tracking-tight leading-none">เข้าสู่ระบบการอนุมัติไม่ได้</h2>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Access Denied / Form Already Processed</p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 text-[13px] font-medium text-zinc-600 leading-relaxed italic">
            "ลิงก์การอนุมัตินี้ถูกใช้งานไปแล้ว หรือหมดอายุการใช้งาน กรุณาแจ้งผู้ร้องขอเพื่อให้กดสร้างลิงก์สำหรับอนุมัติใหม่อีกครั้ง"
          </div>
          <Button
            onClick={() => router.push('/')}
            className="w-full h-14 rounded-2xl bg-[#0F1059] hover:bg-[#0F1059]/90 text-white text-[11px] font-black uppercase tracking-widest"
          >
            กลับหน้าหลัก / Back to Portal <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  // Requirement: Name must match
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-10 text-center space-y-6 border-rose-100 bg-white rounded-[2.5rem]">
          <div className="h-20 w-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
            <Lock className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#0F1059] uppercase">ไม่มีสิทธิ์ในการอนุมัติ</h2>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">Unauthorized Approver</p>
          </div>
          <p className="text-sm font-medium text-zinc-600 leading-relaxed px-4 italic">
            คุณ {employee?.employee_name_th} ไม่มีชื่อเป็นผู้อนุมัติสำหรับรายการนี้ กรุณาตรวจสอบลิงก์หรือสลับบัญชีผู้ใช้งาน
          </p>
          <div className="pt-4 border-t border-zinc-50 flex gap-2">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase"
            >
              Home
            </Button>
            <Button
              onClick={() => router.push('/login')}
              className="flex-1 h-12 rounded-xl bg-[#0F1059] text-white text-[10px] font-black uppercase"
            >
              Relogin
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const requester = type === "e" ? requestData?.user?.employee?.employee_name_th : requestData?.employee?.employee_name_th;
  const description = type === "e" ? `เบิกอุปกรณ์: ${requestData?.equipmentList?.equipmentEntry?.list} (จำนวน ${requestData?.quantity})` : requestData?.description;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center">
      {/* Mini Header */}
      <div className="w-full bg-white h-20 border-b border-zinc-100 flex items-center justify-between px-8 mb-8 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#0F1059] flex items-center justify-center text-white font-semibold text-sm">IT</div>
          <span className="text-[13px] font-black tracking-widest text-[#0F1059] uppercase">Approval Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-black text-[#0F1059] leading-none uppercase">{employee?.employee_name_th}</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-1">{employee?.department}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-[#0F1059] border border-zinc-100">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full px-4 pb-20 space-y-8 animate-in slide-in-from-bottom-4 duration-1000">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-[#0F1059] uppercase tracking-tight leading-none">ฝ่าย IT - ขออนุมัติ</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Departmental Authorization Request</p>
        </header>

        <section className="space-y-6">
          <Card className="p-10 rounded-[2.5rem] border-zinc-100 space-y-10 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#0F1059]/5 rounded-bl-[100px] pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">ข้อมูลคำร้อง / Request Info</h2>
              </div>
              <div className="p-8 rounded-3xl bg-[#F8F9FA] border border-zinc-100 flex flex-col sm:flex-row items-center gap-6">
                {type === "e" ? (
                  <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-50">
                    {requestData.equipmentList?.equipmentEntry?.purchaseOrder?.picture ? (
                      <div className="rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                        <img src={requestData.equipmentList.equipmentEntry.purchaseOrder.picture} alt="" className="w-full h-full object-cover hover:scale-125 transition-transform duration-700" />
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200 text-zinc-300"><ImageIcon className="w-6 h-6" /></div>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center text-amber-600 shrink-0 border border-amber-50">
                    <Ticket className="h-10 w-10" />
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-black text-[#0F1059] uppercase tracking-tight leading-tight">
                    {description}
                  </h2>
                  <Badge className="bg-[#0F1059]/5 text-[#0F1059] border-none rounded-lg text-[9px] font-black uppercase mt-2 px-3 py-1">
                    Category: {type === "e" ? "EQUIPMENT" : "SERVICE TICKET"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ผู้ร้องขอ / Requester</p>
                <p className="text-base font-black text-zinc-900 uppercase">{requester}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">วันที่แจ้ง / Submittal Date</p>
                <p className="text-base font-black text-zinc-900 uppercase">
                  {new Date(requestData?.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">เหตุผล / Reason</p>
              <div className="p-6 rounded-3xl bg-zinc-50 border border-dashed border-zinc-100 italic font-medium text-zinc-600 text-sm leading-relaxed">
                "{requestData?.reason || "ไม่มีข้อมูลเพิ่มเติม..."}"
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[2.5rem] border-zinc-100 bg-white space-y-6 ">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-[#0F1059] flex items-center justify-center text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0F1059] uppercase tracking-tight leading-none">ส่วนการพิจารณา</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Approval Decision</p>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">ความคิดเห็นผู้อนุมัติ (ไม่บังคับ) / Comment</label>
              <textarea
                className="w-full bg-[#F8F9FA] border border-zinc-100 rounded-3xl px-6 py-4 text-[13px] font-medium outline-none focus:border-[#0F1059]/20 transition-all min-h-[120px]"
                placeholder="ระบุความเห็นเพิ่มเติมหากต้องการ... / Add response notes..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Button
                onClick={() => handleAction("APPROVED")}
                disabled={isSubmitting}
                className="h-16 rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 group transition-all"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform" /> อนุมัติ / Approve Request</>}
              </Button>
              <Button
                onClick={() => handleAction("REJECTED")}
                disabled={isSubmitting}
                variant="ghost"
                className="h-16 rounded-3xl border-2 border-zinc-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <XCircle className="h-6 w-6" /> ไม่อนุมัติ / Reject
              </Button>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/50 flex items-start gap-4 mx-2">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest">
                * ทราบ: เมื่อท่านกดดำเนินการแล้ว การตัดสินใจจะไม่สามารถแก้ไขได้ผ่านลิงก์นี้ และลิงก์จะหมดสภาพการใช้งานทันที
              </p>
            </div>
          </Card>
        </section>

        <footer className="text-center space-y-2 opacity-50">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">IT Solutions Center</p>
          <p className="text-[8px] font-bold text-zinc-300">© 2026 NDC GROUP. ALL RIGHTS RESERVED.</p>
        </footer>
      </div>
    </div>
  );
}
