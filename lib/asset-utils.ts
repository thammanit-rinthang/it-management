import { prisma } from "@/lib/prisma";

export type AssetType = "PC" | "NOTEBOOK" | "SCREEN" | "PRINTER";

export const assetPrefixes: Record<string, string> = {
  PC: "NDCPC",
  NOTEBOOK: "NDCNB",
  SCREEN: "NDCSC",
  PRINTER: "NDCPT", // Defaulting to NDCPT for Printer
};

export async function generateAssetCode(type: string): Promise<string> {
  const prefix = assetPrefixes[type] || "ASSET";
  
  // Find the last asset of this type
  const lastAsset = await prisma.asset.findFirst({
    where: {
      asset_code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      asset_code: "desc",
    },
  });

  let nextNumber = 1;
  if (lastAsset) {
    const lastNumberStr = lastAsset.asset_code.replace(prefix, "");
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format with leading zeros (e.g., 0001)
  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}
