import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().min(0).default(0) }))
      .query(async ({ input }) => db.getAllProducts(input.limit, input.offset)),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1), categoryId: z.number().optional() }))
      .query(async ({ input }) => db.searchProducts(input.query, input.categoryId)),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const product = await db.getProductById(input);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        const inventory = await db.getInventoryByProductId(input);
        const pricing = await db.getTieredPricingForProduct(input);
        return { product, inventory, pricing };
      }),

    getByCategory: publicProcedure
      .input(z.number())
      .query(async ({ input }) => db.getProductsByCategory(input)),

    getCategories: publicProcedure.query(async () => db.getAllCategories()),

    create: adminProcedure
      .input(z.object({
        partNumber: z.string(), name: z.string(), description: z.string().optional(),
        categoryId: z.number(), basePrice: z.number(),
        compatibleModels: z.array(z.string()).optional(),
        compatibleBrands: z.array(z.string()).optional(),
        alternatePartNumbers: z.array(z.string()).optional(),
        imageUrl: z.string().optional(), explodedViewUrl: z.string().optional(),
        stock: z.number().optional(), moq: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { stock, moq, ...productData } = input;
        const result = await db.createProduct({
          ...productData,
          basePrice: String(input.basePrice),
          compatibleModels: input.compatibleModels ? JSON.stringify(input.compatibleModels) : null,
          compatibleBrands: input.compatibleBrands ? JSON.stringify(input.compatibleBrands) : null,
          alternatePartNumbers: input.alternatePartNumbers ? JSON.stringify(input.alternatePartNumbers) : null,
        });
        // Create inventory entry
        if (result) {
          const productResult = await db.getProductByPartNumber(input.partNumber);
          if (productResult) {
            await db.upsertInventory(productResult.id, {
              quantityInStock: stock || 0,
              minimumOrderQuantity: moq || 1,
              reorderLevel: 10,
            });
          }
        }
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(), description: z.string().optional(),
          basePrice: z.number().optional(), isActive: z.boolean().optional(),
          partNumber: z.string().optional(), categoryId: z.number().optional(),
          imageUrl: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input.data };
        if (updateData.basePrice) updateData.basePrice = String(updateData.basePrice);
        await db.updateProduct(input.id, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteProduct(input);
        return { success: true };
      }),

    adminList: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ input }) => db.getAllProductsAdmin(input.limit, input.offset)),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      return await Promise.all(items.map(async (item) => {
        const product = await db.getProductById(item.productId);
        return { ...item, product };
      }));
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        return await db.addToCart(ctx.user.id, input.productId, input.quantity, Number(product.basePrice));
      }),

    remove: protectedProcedure.input(z.number()).mutation(async ({ input }) => db.removeFromCart(input)),
    clear: protectedProcedure.mutation(async ({ ctx }) => db.clearCart(ctx.user.id)),
  }),

  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getOrdersByUserId(ctx.user.id)),

    getById: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
      // Admin can see all orders, users only their own
      if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const items = await db.getOrderItems(input);
      return { order, items };
    }),

    create: protectedProcedure
      .input(z.object({
        shippingAddress: z.string(),
        paymentMethod: z.enum(['upi', 'bank_transfer', 'card', 'cod', 'razorpay']),
      }))
      .mutation(async ({ ctx, input }) => {
        const cartItemsList = await db.getCartItems(ctx.user.id);
        if (cartItemsList.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });

        let totalAmount = 0;
        const orderItemsData = [];
        for (const item of cartItemsList) {
          const product = await db.getProductById(item.productId);
          if (!product) continue;
          const itemTotal = await db.calculatePrice(item.productId, item.quantity, Number(product.basePrice));
          totalAmount += itemTotal;
          orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice: String(Number(product.basePrice)), totalPrice: String(itemTotal) });
        }

        const gstAmount = totalAmount * 0.18;
        const shippingCost = totalAmount >= 5000 ? 0 : 100;
        const orderNumber = `ORD-${Date.now()}`;

        await db.createOrder({
          orderNumber, userId: ctx.user.id,
          totalAmount: String(totalAmount), gstAmount: String(gstAmount),
          shippingCost: String(shippingCost), shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending', orderStatus: 'pending',
        });

        await db.clearCart(ctx.user.id);
        return { orderNumber, totalAmount: totalAmount + gstAmount + shippingCost };
      }),

    getAllOrders: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => db.getAllOrders(input.limit, input.offset)),

    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
      }))
      .mutation(async ({ input }) => db.updateOrderStatus(input.orderId, input.status)),
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
        items: z.array(z.object({ productId: z.number(), quantity: z.number(), requestedPrice: z.number().optional() })),
      }))
      .mutation(async ({ ctx, input }) => {
        let totalAmount = 0;
        for (const item of input.items) {
          const product = await db.getProductById(item.productId);
          if (product) totalAmount += Number(product.basePrice) * item.quantity;
        }
        const quotationNumber = `QT-${Date.now()}`;
        await db.createQuotation({
          quotationNumber, userId: ctx.user.id,
          items: JSON.stringify(input.items), totalAmount: String(totalAmount),
          status: 'pending', expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return { quotationNumber };
      }),

    getAllQuotations: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => db.getAllQuotations(input.limit, input.offset)),

    update: adminProcedure
      .input(z.object({
        quotationId: z.number(),
        status: z.enum(['pending', 'quoted', 'accepted', 'rejected', 'expired']),
        quotedPrice: z.number().optional(),
      }))
      .mutation(async ({ input }) => db.updateQuotationStatus(input.quotationId, input.status, input.quotedPrice)),
  }),

  users: router({
    profile: protectedProcedure.query(async ({ ctx }) => ctx.user),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(), businessName: z.string().optional(),
        businessPhone: z.string().optional(), businessAddress: z.string().optional(),
        gstNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    getAllDealers: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => db.getAllUsers(input.limit, input.offset)),

    updateCreditLimit: adminProcedure
      .input(z.object({ userId: z.number(), creditLimit: z.number(), creditApproved: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateUserCreditLimit(input.userId, input.creditLimit, input.creditApproved);
        return { success: true };
      }),
  }),

  admin: router({
    stats: adminProcedure.query(async () => db.getDashboardStats()),

    inventory: adminProcedure.query(async () => db.getAllInventory()),

    updateInventory: adminProcedure
      .input(z.object({ productId: z.number(), quantity: z.number(), moq: z.number().optional() }))
      .mutation(async ({ input }) => {
        await db.upsertInventory(input.productId, {
          quantityInStock: input.quantity,
          ...(input.moq ? { minimumOrderQuantity: input.moq } : {}),
        });
        return { success: true };
      }),

    createCategory: adminProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.createCategory(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
