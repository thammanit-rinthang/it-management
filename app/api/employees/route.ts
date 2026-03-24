import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { 
      employee_code, 
      employee_name_th, 
      employee_name_en, 
      gender, 
      position, 
      department, 
      work_location, 
      supervisor_name, 
      start_date, 
      end_date, 
      status 
    } = body;

    if (!employee_code || !employee_name_th) {
      return NextResponse.json({ error: "Employee code and Thai name are required" }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        employee_code,
        employee_name_th,
        employee_name_en,
        gender,
        position,
        department,
        work_location,
        supervisor_name,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
