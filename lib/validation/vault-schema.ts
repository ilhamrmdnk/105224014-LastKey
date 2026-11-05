import { z } from "zod";

export const CHECK_IN_INTERVAL_VALUES = ["7 days", "14 days", "30 days"] as const;
export const GRACE_PERIOD_VALUES = ["24 hours", "48 hours", "72 hours"] as const;
export const VAULT_STATUS_VALUES = ["ACTIVE", "LOCKED", "PENDING"] as const;

const INTERVAL_HOURS: Record<(typeof CHECK_IN_INTERVAL_VALUES)[number], number> = {
  "7 days": 7 * 24,   // 168 jam
  "14 days": 14 * 24, // 336 jam
  "30 days": 30 * 24, // 720 jam
};

const GRACE_HOURS: Record<(typeof GRACE_PERIOD_VALUES)[number], number> = {
  "24 hours": 24,
  "48 hours": 48,
  "72 hours": 72,
};

/**
 * Evaluasi aturan semantik Dead Man's Switch:
 * 1. Grace Period harus lebih pendek daripada Check-in Interval.
 * 2. Grace Period tidak boleh melebihi 35% dari durasi Check-in Interval
 *    (pada interval "7 days" [168 jam], Grace Period "72 hours" [42.8%] ditolak
 *    karena masa tenggang 3 hari terlalu panjang untuk siklus heartbeat mingguan;
 *    maksimal "48 hours").
 */
export function isValidSwitchTiming(
  checkInInterval: (typeof CHECK_IN_INTERVAL_VALUES)[number],
  gracePeriod: (typeof GRACE_PERIOD_VALUES)[number]
): boolean {
  const intervalH = INTERVAL_HOURS[checkInInterval];
  const graceH = GRACE_HOURS[gracePeriod];
  if (!intervalH || !graceH) return false;
  return graceH < intervalH && graceH <= intervalH * 0.35;
}

export const SWITCH_TIMING_ERROR_MESSAGE =
  "Grace Period tidak proporsional: untuk Check-in Interval 7 days, Grace Period maksimal adalah 48 hours (72 hours ditolak).";

export const vaultSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Vault Name minimal 3 karakter.")
      .max(50, "Vault Name maksimal 50 karakter."),

    description: z
      .string()
      .trim()
      .max(200, "Description maksimal 200 karakter."),

    recipient: z
      .string()
      .trim()
      .min(1, "Recipient harus dipilih."),

    checkInInterval: z.enum(CHECK_IN_INTERVAL_VALUES, {
      error: "Check-in Interval harus dipilih (7 days, 14 days, atau 30 days).",
    }),

    gracePeriod: z.enum(GRACE_PERIOD_VALUES, {
      error: "Grace Period harus dipilih (24 hours, 48 hours, atau 72 hours).",
    }),

    confirmation: z
      .boolean()
      .refine((value) => value === true, {
        message: "Anda harus mengonfirmasi bahwa data vault sudah benar.",
      }),
  })
  .refine(
    (data) => isValidSwitchTiming(data.checkInInterval, data.gracePeriod),
    {
      message: SWITCH_TIMING_ERROR_MESSAGE,
      path: ["gracePeriod"],
    }
  );

export const vaultUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Vault Name minimal 3 karakter.")
      .max(50, "Vault Name maksimal 50 karakter."),

    description: z
      .string()
      .trim()
      .max(200, "Description maksimal 200 karakter."),

    status: z.enum(VAULT_STATUS_VALUES, {
      error: "Status Vault harus ACTIVE, PENDING, atau LOCKED.",
    }),

    recipientId: z
      .string()
      .trim()
      .min(1, "Recipient harus dipilih."),

    checkInInterval: z.enum(CHECK_IN_INTERVAL_VALUES, {
      error: "Check-in Interval harus dipilih (7 days, 14 days, atau 30 days).",
    }),

    gracePeriod: z.enum(GRACE_PERIOD_VALUES, {
      error: "Grace Period harus dipilih (24 hours, 48 hours, atau 72 hours).",
    }),
  })
  .refine(
    (data) => isValidSwitchTiming(data.checkInInterval, data.gracePeriod),
    {
      message: SWITCH_TIMING_ERROR_MESSAGE,
      path: ["gracePeriod"],
    }
  );

export type VaultFormData = z.infer<typeof vaultSchema>;
export type VaultUpdateFormData = z.infer<typeof vaultUpdateSchema>;
