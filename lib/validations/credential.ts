import { z } from "zod";

export const credentialSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
  account_type: z.array(z.string()).min(1, "At least one account type is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  email_address: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  remarks: z.string().optional().nullable(),
});

export type CredentialInput = z.infer<typeof credentialSchema>;
