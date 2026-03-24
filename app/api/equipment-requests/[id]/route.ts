import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipmentRequest = await prisma.equipmentRequest.findUnique({
      where: { id: id },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
        equipmentList: {
          include: {
            equipmentEntry: {
              include: {
                purchaseOrder: true,
              },
            },
          },
        },
      },
    });

    if (!equipmentRequest) {
      return NextResponse.json({ error: "Equipment request not found" }, { status: 404 });
    }

    return NextResponse.json(equipmentRequest);
  } catch (error) {
    console.error("GET /api/equipment-requests/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();
    const { 
      approval_status, 
      approval_comment,
      approval,
      it_approval_status,
      it_approval_comment,
      it_approval
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      const currentRequest = await tx.equipmentRequest.findUnique({
        where: { id },
        include: { equipmentList: true }
      });

      if (!currentRequest) throw new Error("Request not found");

      // Logic: Transitioning IT_APPROVAL_STATUS TO Approved from anything else
      if (it_approval_status === "APPROVED" && (currentRequest as any).it_approval_status !== "APPROVED") {
        if (currentRequest.equipmentList.remaining < currentRequest.quantity) {
          throw new Error("Insufficient stock to approve this request");
        }
        await tx.equipmentList.update({
          where: { id: currentRequest.equipment_list_id },
          data: { remaining: { decrement: currentRequest.quantity } }
        });
      } 
      // Logic: Transitioning IT_APPROVAL_STATUS FROM Approved to anything else
      else if (it_approval_status !== "APPROVED" && (currentRequest as any).it_approval_status === "APPROVED") {
        await tx.equipmentList.update({
          where: { id: currentRequest.equipment_list_id },
          data: { remaining: { increment: currentRequest.quantity } }
        });
      }

      return await tx.equipmentRequest.update({
        where: { id },
        data: {
          approval_status,
          approval_comment,
          approval,
          approval_date: (approval_status === "APPROVED" || approval_status === "REJECTED") ? new Date() : undefined,
          it_approval_status,
          it_approval_comment,
          it_approval,
          it_approval_date: (it_approval_status === "APPROVED" || it_approval_status === "REJECTED") ? new Date() : undefined,
        },
        include: {
          equipmentList: {
            include: { equipmentEntry: true }
          }
        }
      });
    });

    const isApprovalAction = (body.approval_status && body.approval_status !== "PENDING") || (body.it_approval_status && body.it_approval_status !== "PENDING");
    
    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: session?.user?.id,
      userName: (session?.user as any)?.name,
      action: isApprovalAction ? "APPROVE_ACTION" : "UPDATE_BORROW_REQUEST",
      module: "EQUIPMENT_BORROW",
      details: { 
        requestId: id, 
        approvalStatus: result.approval_status,
        itApprovalStatus: result.it_approval_status
      },
      ipAddress: ip,
      userAgent: ua
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PATCH /api/equipment-requests/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update equipment request" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const requestToDelete = await tx.equipmentRequest.findUnique({
        where: { id: id },
      });

      if (requestToDelete && (requestToDelete as any).it_approval_status === "APPROVED") {
        // Restore inventory only if it was already deducted (IT APPROVED)
        await tx.equipmentList.update({
          where: { id: requestToDelete.equipment_list_id },
          data: {
            remaining: {
              increment: requestToDelete.quantity
            }
          }
        });
      }

      await tx.equipmentRequest.delete({
        where: { id: id },
      });
    });

    const session = await auth();
    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: (session?.user as any)?.id,
      userName: (session?.user as any)?.name,
      action: "DELETE_BORROW_REQUEST",
      module: "EQUIPMENT_BORROW",
      details: { requestId: id },
      ipAddress: ip,
      userAgent: ua
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/equipment-requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete equipment request" }, { status: 500 });
  }
}
