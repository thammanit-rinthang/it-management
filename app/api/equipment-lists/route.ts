import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const equipmentLists = await prisma.equipmentList.findMany({
      include: {
        equipmentEntry: {
          include: {
            purchaseOrder: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(equipmentLists);
  } catch (error) {
    console.error("GET Equipment Lists Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
