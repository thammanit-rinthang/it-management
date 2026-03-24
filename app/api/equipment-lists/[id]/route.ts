import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { remaining, status, payout_amount } = await req.json();

    const updated = await prisma.equipmentList.update({
      where: { id },
      data: {
        remaining: remaining !== undefined ? parseInt(remaining) : undefined,
        status: status || undefined,
        payout_amount: payout_amount !== undefined ? parseFloat(payout_amount) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Equipment List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
