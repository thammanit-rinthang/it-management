import { z } from "zod";

export const assetSchema = z.object({
  id: z.string().optional(),
  asset_code: z.string().optional(), // Can be auto-generated
  serial_number: z.string().min(1, "Serial number is required"),
  type: z.string().min(1, "Type is required"),
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional().nullish(),
  model: z.string().optional().nullish(),
  specs: z.string().optional().nullish(),
  purchase_date: z.string().optional().nullish(),
  warranty_expire: z.string().optional().nullish(),
  price: z.number().optional().default(0),
  status: z.string().default("AVAILABLE"),
  location: z.string().optional().nullish(),
  employeeId: z.string().optional().nullish(),
});

export type AssetInput = z.infer<typeof assetSchema>;
