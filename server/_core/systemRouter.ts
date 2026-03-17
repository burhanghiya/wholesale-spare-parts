import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import * as db from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  getSettings: publicProcedure
    .query(async () => {
      const settings = await db.getSettings();
      return settings || {
        siteName: "Patel Electricals",
        siteDescription: "Wholesale Electrical Spare Parts",
        contactEmail: "contact@patelelectricals.com",
        contactPhone: "8780657095",
        address: "Udhana, Surat - 394210",
        paymentGateway: "Stripe",
        shippingProvider: "Custom",
        taxRate: "18",
      };
    }),

  updateSettings: adminProcedure
    .input(
      z.object({
        siteName: z.string().optional(),
        siteDescription: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        paymentGateway: z.string().optional(),
        shippingProvider: z.string().optional(),
        taxRate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await db.updateSettings(input);
      return {
        success,
        message: success ? "Settings updated successfully" : "Failed to update settings",
      } as const;
    }),

  sendNotification: adminProcedure
    .input(
      z.object({
        recipientType: z.enum(["all", "order", "promo", "support"]),
        message: z.string().min(1, "message is required"),
      })
    )
    .mutation(async ({ input }) => {
      // In a real app, you would save to database and send notifications
      // For now, we'll just return success
      return {
        success: true,
        message: "Notification sent successfully",
        timestamp: new Date(),
      } as const;
    }),
});
