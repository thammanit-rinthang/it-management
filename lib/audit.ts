import { prisma } from "./prisma";

interface LogParams {
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  details?: string | object;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

function parseDevice(ua?: string) {
  if (!ua) return "Unknown";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android Device";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Macintosh")) return "MacBook/Mac";
  if (ua.includes("Linux")) return "Linux PC";
  return "Web Browser";
}

// ... (โค้ดส่วนบนคงเดิม)

export async function logAudit({
  userId,
  userName,
  action,
  module,
  details,
  ipAddress,
  userAgent,
  device,
}: LogParams) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
    const finalDevice = device || parseDevice(userAgent);
  
    let finalUserName = userName;
    if (!finalUserName && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true }
      });

      finalUserName = user?.employee?.employee_name_en || "Unknown System User";
    }

    await prisma.auditLog.create({
      data: {
        userId,
        userName: finalUserName, 
        action,
        module,
        details: detailsStr,
        ipAddress,
        userAgent,
        device: finalDevice,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
