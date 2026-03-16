import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

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
      // In a real app, you would save these to database
      // For now, we'll just return success
      return {
        success: true,
        message: "Settings updated successfully",
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
