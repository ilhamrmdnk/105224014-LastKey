import { z } from "zod";

export const recipientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama recipient minimal 3 karakter.")
    .max(80, "Nama recipient maksimal 80 karakter."),

  role: z
    .string()
    .trim()
    .min(3, "Peran/role recipient minimal 3 karakter.")
    .max(80, "Peran/role recipient maksimal 80 karakter."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format alamat email recipient tidak valid.")
    .max(120, "Alamat email maksimal 120 karakter."),
});

export type RecipientFormData = z.infer<typeof recipientSchema>;

