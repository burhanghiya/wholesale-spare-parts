import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Admin procedure - only for admin users
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

  // Products Router
  products: router({
    // Get all products with pagination
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await db.getAllProducts(input.limit, input.offset);
      }),

    // Search products by part number, name, or brand
    search: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        categoryId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchProducts(input.query, input.categoryId);
      }),

    // Get product by ID
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const product = await db.getProductById(input);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const inventory = await db.getInventoryByProductId(input);
        const pricing = await db.getTieredPricingForProduct(input);
        
        return { product, inventory, pricing };
      }),

    // Get products by category
    getByCategory: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input);
      }),

    // Get all categories
    getCategories: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    // Admin: Create product
    create: adminProcedure
      .input(z.object({
        partNumber: z.string(),
        name: z.string(),
        description: z.string().optional(),
        categoryId: z.number(),
        basePrice: z.number(),
        compatibleModels: z.array(z.string()).optional(),
        compatibleBrands: z.array(z.string()).optional(),
        alternatePartNumbers: z.array(z.string()).optional(),
        imageUrl: z.string().optional(),
        explodedViewUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Implementation would go here
        return { success: true };
      }),

    // Admin: Update product
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          basePrice: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Implementation would go here
        return { success: true };
      }),
  }),

  // Cart Router
  cart: router({
    // Get cart items for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      
      // Enrich with product details
      const enriched = await Promise.all(
        items.map(async (item) => {
          const product = await db.getProductById(item.productId);
          return { ...item, product };
        })
      );
      
      return enriched;
    }),

    // Add item to cart
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const inventory = await db.getInventoryByProductId(input.productId);
        if (!inventory || inventory.quantityInStock < input.quantity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient stock' });
        }
        
        const price = Number(product.basePrice);
        return await db.addToCart(ctx.user.id, input.productId, input.quantity, price);
      }),

    // Remove item from cart
    remove: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return await db.removeFromCart(input);
      }),

    // Clear cart
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.clearCart(ctx.user.id);
    }),
  }),

  // Orders Router
  orders: router({
    // Get user's orders
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByUserId(ctx.user.id);
    }),

    // Get order details
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input);
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        const items = await db.getOrderItems(input);
        return { order, items };
      }),

    // Create order from cart
    create: protectedProcedure
      .input(z.object({
        shippingAddress: z.string(),
        paymentMethod: z.enum(['upi', 'bank_transfer', 'card', 'cod', 'razorpay']),
      }))
      .mutation(async ({ ctx, input }) => {
        const cartItems = await db.getCartItems(ctx.user.id);
        if (cartItems.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
        }

        // Calculate total
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of cartItems) {
          const product = await db.getProductById(item.productId);
          if (!product) continue;
          
          const itemTotal = await db.calculatePrice(item.productId, item.quantity, Number(product.basePrice));
          totalAmount += itemTotal;
          
          orderItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(product.basePrice),
            totalPrice: itemTotal,
          });
        }

        // Calculate GST (18%)
        const gstAmount = totalAmount * 0.18;
        const shippingCost = 100; // Default shipping cost
        const finalTotal = totalAmount + gstAmount + shippingCost;

        // Create order
        const orderNumber = `ORD-${Date.now()}`;
        const orderData = {
          orderNumber,
          userId: ctx.user.id,
          totalAmount: String(totalAmount),
          gstAmount: String(gstAmount),
          shippingCost: String(shippingCost),
          shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'pending',
          orderStatus: 'pending',
        };

        const result = await db.createOrder(orderData);
        
        // Add order items
        if (result) {
          // await db.addOrderItems(result.insertId, orderItems);
          // Clear cart
          await db.clearCart(ctx.user.id);
        }

        return { orderNumber, totalAmount: finalTotal };
      }),

    // Admin: Get all orders
    getAllOrders: adminProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getAllOrders(input.limit, input.offset);
      }),

    // Admin: Update order status
    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
      }))
      .mutation(async ({ input }) => {
        return await db.updateOrderStatus(input.orderId, input.status);
      }),
  }),

  // Quotations Router
  quotations: router({
    // Get user's quotations
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getQuotationsByUserId(ctx.user.id);
    }),

    // Get quotation details
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const quotation = await db.getQuotationById(input);
        if (!quotation || quotation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return quotation;
      }),

    // Create quotation request
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          requestedPrice: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        let totalAmount = 0;
        
        for (const item of input.items) {
          const product = await db.getProductById(item.productId);
          if (!product) continue;
          totalAmount += Number(product.basePrice) * item.quantity;
        }

        const quotationNumber = `QT-${Date.now()}`;
        const quotationData = {
          quotationNumber,
          userId: ctx.user.id,
          items: JSON.stringify(input.items),
          totalAmount: String(totalAmount),
          status: 'pending' as const,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        return await db.createQuotation(quotationData);
      }),

    // Admin: Get all quotations
    getAllQuotations: adminProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getAllQuotations(input.limit, input.offset);
      }),

    // Admin: Update quotation
    update: adminProcedure
      .input(z.object({
        quotationId: z.number(),
        status: z.enum(['pending', 'quoted', 'accepted', 'rejected', 'expired']),
        quotedPrice: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateQuotationStatus(input.quotationId, input.status, input.quotedPrice);
      }),
  }),

  // User/Dealer Router
  users: router({
    // Get current user profile
    profile: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),

    // Update user profile
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        businessName: z.string().optional(),
        businessPhone: z.string().optional(),
        businessAddress: z.string().optional(),
        gstNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Implementation would update user in database
        return { success: true };
      }),

    // Admin: Get all dealers
    getAllDealers: adminProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async () => {
        // Implementation would fetch dealers
        return [];
      }),

    // Admin: Update dealer credit limit
    updateCreditLimit: adminProcedure
      .input(z.object({
        userId: z.number(),
        creditLimit: z.number(),
        creditApproved: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        // Implementation would update credit
        return { success: true };
      }),
  }),

  // Admin Dashboard Router
  admin: router({
    // Get dashboard stats
    stats: adminProcedure.query(async () => {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalDealers: 0,
        pendingQuotations: 0,
      };
    }),

    // Get inventory status
    inventory: adminProcedure.query(async () => {
      return [];
    }),

    // Update product inventory
    updateInventory: adminProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number(),
      }))
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
