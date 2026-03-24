import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Status } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const role = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    // Filter by user if not admin. 
    // New Requirement: Users can see all non-closed requests from others.
    const where = role === "admin" ? {} : { 
      OR: [
        { userId }, // My own requests (even closed)
        { status: { not: Status.CLOSED } } // Everyone's non-closed requests
      ]
    };

    const requests = await prisma.request.findMany({
      where,
      include: {
        employee: true,
        user: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const authUserId = (session.user as any)?.id;

  try {
    const body = await request.json();
      const { 
        employeeId, 
        type_request, 
        description, 
        reason, 
        category, 
        priority, 
        status, 
        approval, 
        approval_status,
        approval_comment,
        it_approval,
        it_approval_status,
        it_approval_comment
      } = body;
  
      // Use authUserId instead of relying on client-provided id
      if (!employeeId || !authUserId || !description || !category || !priority) {
        return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
      }
  
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });
  
      if (!employee) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }
  
      const newRequest = await prisma.request.create({
        data: {
          employeeId,
          userId: authUserId,
          type_request,
          description,
          reason,
          category,
          priority,
          status: status || "OPEN",
          approval,
          approval_status: approval_status || "PENDING",
          approval_comment,
          it_approval,
          it_approval_status: it_approval_status || "PENDING",
          it_approval_comment,
        },
      include: {
        employee: true,
        user: true,
      },
    });

    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: authUserId,
      userName: (session.user as any)?.name, 
      action: "CREATE_REQUEST",
      module: "SUPPORT_TICKET",
      details: { requestId: newRequest.id, description: newRequest.description },
      ipAddress: ip,
      userAgent: ua
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
