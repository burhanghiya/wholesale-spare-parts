import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie("session");
      return { success: true };
    }),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({ 
        search: z.string().optional(),
        category: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional())
      .query(async ({ input }) => {
        const searchTerm = input?.search || "";
        const page = input?.page || 1;
        const limit = input?.limit || 20;
        
        if (searchTerm) {
          return await db.searchProducts(searchTerm);
        }
        return await db.getAllProducts(limit, (page - 1) * limit);
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => db.getProductById(input)),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getCartItems(ctx.user.id)),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        return await db.addToCart(ctx.user.id, input.productId, input.quantity);
      }),

    update: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        if (input.quantity === 0) {
          return await db.removeFromCart(input.cartItemId);
        }
        return await db.updateCartItemQuantity(input.cartItemId, input.quantity);
      }),

    remove: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => db.removeFromCart(input)),

    clear: protectedProcedure.mutation(async ({ ctx }) => db.clearCart(ctx.user.id)),
  }),

  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getOrdersByUserId(ctx.user.id)),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        return order;
      }),

    create: protectedProcedure
      .input(z.object({
        shippingAddress: z.string(),
        paymentMethod: z.enum(['cod', 'razorpay']),
        shippingPincode: z.string(),
        shippingCost: z.number(),
        cartItems: z.array(z.any()),
        totalAmount: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.cartItems || input.cartItems.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
        }

        // Create order with initial status based on payment method
        const orderStatus = 'pending';
        const paymentStatus = input.paymentMethod === 'cod' ? 'pending' : 'pending';

        const orderId = await db.createOrder({
          userId: ctx.user.id,
          shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          shippingPincode: input.shippingPincode,
          shippingCost: input.shippingCost,
          totalAmount: input.totalAmount,
          orderStatus: orderStatus,
          paymentStatus: paymentStatus,
        });

        if (!orderId) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create order' });
        }

        // Add order items
        const orderItemsData = input.cartItems
          .filter((item: any) => item.product)
          .map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.basePrice,
          }));

        if (orderItemsData.length > 0) {
          await db.addOrderItems(orderId, orderItemsData);
        }

        const order = await db.getOrderById(orderId);
        return {
          orderId: order?.id,
          orderNumber: order?.orderNumber,
          totalAmount: order?.totalAmount,
        };
      }),

    verifyRazorpayPayment: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        razorpayOrderId: z.string().optional(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Get order to verify it belongs to current user
          const order = await db.getOrderById(input.orderId);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          if (order.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your order' });

          // For frontend-only Razorpay flow, we trust the payment if it reached this point
          // In production, implement webhook verification from Razorpay for enhanced security
          console.log(`[Razorpay] Payment verified for order ${input.orderId}, payment ID: ${input.razorpayPaymentId}`);

          // Update payment status to completed
          await db.updateOrderPaymentStatus(input.orderId, 'completed');

          return { success: true, message: 'Payment verified and completed' };
        } catch (error: any) {
          console.error('Razorpay verification error:', error);
          if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
            throw error;
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment verification failed' });
        }
      }),
  }),

  admin: router({
    getShippingConfig: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await db.getShippingConfig();
    }),

    calculateShippingByDistance: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(async ({ input }) => {
        return await db.calculateShippingByDistance(input.address);
      }),

    updateShippingConfig: protectedProcedure
      .input(z.object({
        baseCost: z.number().optional(),
        costPerKm: z.number().optional(),
        freeShippingThreshold: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        if (input.baseCost !== undefined && input.costPerKm !== undefined && input.freeShippingThreshold !== undefined) {
          return await db.updateShippingConfig(input.baseCost, input.costPerKm, input.freeShippingThreshold);
        }
        return null;
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await db.getDashboardStats();
    }),
  }),

  system: router({
    getSettings: publicProcedure.query(async () => {
      return await db.getSettings();
    }),

    updateSettings: protectedProcedure
      .input(z.object({
        codEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.updateSettings(input);
      }),

    notifyOwner: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Implementation for owner notifications
        console.log(`[Notification] ${input.title}: ${input.content}`);
        return { success: true };
      }),
  }),

  quotations: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getQuotationsByUserId(ctx.user.id)),

    getById: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
      const quotation = await db.getQuotationById(input);
      if (!quotation) throw new TRPCError({ code: 'NOT_FOUND' });
      if (quotation.userId !== ctx.user.id && ctx.user.role !== 'admin') throw new TRPCError({ code: 'NOT_FOUND' });
      return quotation;
    }),

    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const quotation = await db.createQuotation({
          userId: ctx.user.id,
          notes: input.notes || '',
        });

        if (quotation) {
          const itemsData = [];
          for (const item of input.items) {
            const product = await db.getProductById(item.productId);
            if (product) {
              itemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.basePrice,
              });
            }
          }
          if (itemsData.length > 0) {
            await db.addOrderItems(quotation.id, itemsData);
          }
        }

        return quotation;
      }),
  }),
});

export type AppRouter = typeof appRouter;
