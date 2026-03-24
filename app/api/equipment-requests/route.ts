import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const requests = await prisma.equipmentRequest.findMany({
      include: {
        user: { include: { employee: true } },
        equipmentList: {
          include: {
            equipmentEntry: {
              include: {
                purchaseOrder: true
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/equipment-requests error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { 
      equipment_list_id, 
      quantity,
      reason,
      approval_comment,
      approval, 
      approval_status, 
      userId,
      it_approval,
      it_approval_status,
      it_approval_comment
    } = body;

    const finalUserId = userId || session?.user?.id;

    if (!equipment_list_id || !finalUserId) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const inventoryItem = await prisma.equipmentList.findUnique({
      where: { id: equipment_list_id },
      include: { equipmentEntry: true }
    });

    if (!inventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    if (inventoryItem.remaining < (quantity || 1)) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    let finalDeptStatus = approval_status || "PENDING";
    let finalITStatus = it_approval_status || "PENDING";
    let finalDeptApprover = approval;
    let finalITApprover = it_approval;
    let finalDeptDate: Date | null = null;
    let finalITDate: Date | null = null;

    if (inventoryItem?.equipmentEntry?.item_type === "PERIPHERAL") {
      finalDeptStatus = "APPROVED";
      finalITStatus = "APPROVED";
      finalDeptApprover = "SYSTEM (Auto)";
      finalITApprover = "SYSTEM (Auto)";
      finalDeptDate = new Date();
      finalITDate = new Date();
    }

    const equipmentRequest = await prisma.$transaction(async (tx) => {
      const requestCreate = await tx.equipmentRequest.create({
        data: {
          equipment_list_id,
          userId: finalUserId,
          quantity: quantity || 1,
          reason,
          approval: finalDeptApprover,
          approval_status: finalDeptStatus,
          approval_comment: approval_comment,
          approval_date: finalDeptDate,
          it_approval: finalITApprover,
          it_approval_status: finalITStatus,
          it_approval_comment: it_approval_comment,
          it_approval_date: finalITDate,
        },
        include: {
          equipmentList: true,
        },
      });

      // Deduct from inventory ONLY IF IT_APPROVED (e.g. for peripherals or auto-approved)
      if (finalITStatus === "APPROVED") {
        await tx.equipmentList.update({
          where: { id: equipment_list_id },
          data: {
            remaining: {
              decrement: quantity || 1
            }
          }
        });
      }

      return requestCreate;
    });

    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: finalUserId,
      userName: (session?.user as any)?.name,
      action: "CREATE_BORROW_REQUEST",
      module: "EQUIPMENT_BORROW",
      details: { requestId: equipmentRequest.id, itemId: equipment_list_id, quantity },
      ipAddress: ip,
      userAgent: ua
    });

    return NextResponse.json(equipmentRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment-requests error:", error);
    return NextResponse.json({ error: "Failed to create equipment request" }, { status: 500 });
  }
}
