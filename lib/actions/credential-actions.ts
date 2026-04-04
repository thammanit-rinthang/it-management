"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { credentialSchema, CredentialInput } from "@/lib/validations/credential";
import { encrypt, decrypt } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

export async function getCredentials() {
  try {
    const credentials = await prisma.userCredential.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employee_name_th: true,
            employee_name_en: true,
            employee_code: true,
            department: true,
            status: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return { success: true, data: JSON.parse(JSON.stringify(credentials)) };
  } catch (error) {
    console.error("Failed to fetch credentials:", error);
    return { success: false, error: "Failed to fetch credentials" };
  }
}

export async function getCredentialDetails(id: string, userId?: string) {
  try {
    const cred = await prisma.userCredential.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!cred) return { success: false, error: "Credential not found" };

    // Decrypt password
    const decrypted = {
      ...cred,
      password: decrypt(cred.password),
    };

    await logAudit({
      userId,
      action: "VIEW_PASSWORD",
      module: "CREDENTIALS",
      details: { credentialId: id, accountType: cred.account_type, employeeId: cred.employeeId },
    });

    return { success: true, data: JSON.parse(JSON.stringify(decrypted)) };
  } catch (error) {
    console.error("Failed to fetch credential details:", error);
    return { success: false, error: "Failed to fetch credential details" };
  }
}

export async function upsertCredential(input: CredentialInput, userId?: string) {
  try {
    const validated = credentialSchema.parse(input);
    const { id, password, ...data } = validated;

    // Build update object
    const updateData: any = {
      ...data,
      email_address: data.email_address || null,
    };

    // Only encrypt and update password if it's not the masked placeholder or empty
    if (password && password !== "••••••••") {
      updateData.password = encrypt(password);
    } else if (!id) {
      // If it's a new record, password is required
      return { success: false, error: "Password is required for new credentials" };
    }

    let credential;
    if (id) {
      credential = await prisma.userCredential.update({
        where: { id },
        data: updateData,
      });

      await logAudit({
        userId,
        action: "UPDATE",
        module: "CREDENTIALS",
        details: { credentialId: credential.id, employeeId: credential.employeeId },
      });
    } else {
      credential = await prisma.userCredential.create({
        data: updateData,
      });

      await logAudit({
        userId,
        action: "CREATE",
        module: "CREDENTIALS",
        details: { credentialId: credential.id, employeeId: credential.employeeId },
      });
    }

    revalidatePath("/admin/credentials");
    return { success: true, data: JSON.parse(JSON.stringify(credential)) };
  } catch (error: any) {
    console.error("Failed to upsert credential:", error);
    return { success: false, error: error.message || "Failed to save credential" };
  }
}

export async function deleteCredential(id: string, userId?: string) {
  try {
    const cred = await prisma.userCredential.delete({
      where: { id },
    });

    await logAudit({
      userId,
      action: "DELETE",
      module: "CREDENTIALS",
      details: { credentialId: id, accountType: cred.account_type, employeeId: cred.employeeId },
    });

    revalidatePath("/admin/credentials");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete credential:", error);
    return { success: false, error: "Failed to delete credential" };
  }
}
