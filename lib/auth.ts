import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit } from "./audit";
import { headers } from "next/headers";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { username, password } = credentials;

        if (!username || !password) return null;

        let user = await prisma.user.findUnique({
          where: { username: username as string },
          include: {
            employee: true
          }
        });

        if (!user) {
          await logAudit({
            action: "LOGIN_FAILURE",
            module: "AUTH",
            details: { username, reason: "User not found" },
          });
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password as string, user.password);
        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.employee?.employee_name_en || user.username,
            username: user.username,
            role: user.role,
            employeeId: user.employeeId,
          };
        }

        await logAudit({
          action: "LOGIN_FAILURE",
          module: "AUTH",
          details: { username, reason: "Invalid password" },
          userId: user.id
        });
        return null;
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      const { username, name } = user as any;
      
      const headList = await headers();
      const ip = headList.get("x-forwarded-for") || "unknown";
      const ua = headList.get("user-agent") || "unknown";

      await logAudit({
        userId: user.id,
        userName: name || "Unknown",
        action: "LOGIN_SUCCESS",
        module: "AUTH",
        details: { username },
        ipAddress: ip,
        userAgent: ua
      });
    },
  }
});
