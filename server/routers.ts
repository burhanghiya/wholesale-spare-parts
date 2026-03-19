import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import Razorpay from "razorpay";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie("session");
      return { success: true };
    }),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      const enriched = await Promise.all(
        items.map(async (item: any) => ({
          ...item,
          product: await db.getProductById(item.productId),
        }))
      );
      return enriched;
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        return await db.addToCart(ctx.user.id, input.productId, input.quantity);
      }),

    updateQuantity: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateCartItemQuantity(input.cartItemId, input.quantity);
      }),

    remove: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => db.removeFromCart(input)),

    clear: protectedProcedure.mutation(async ({ ctx }) => db.clearCart(ctx.user.id)),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({ 
        search: z.string().optional(),
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

    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return await db.getAllProducts(input?.limit || 50, input?.offset || 0);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) return null;
        const inventory = await db.getInventoryByProductId(input.id);
        return { product, inventory };
      }),

    getCategories: publicProcedure
      .query(async () => await db.getAllCategories()),

    addCategory: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.createCategory({
          name: input.name,
          description: input.description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),

    deleteCategory: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.deleteCategory(input);
      }),

    getInventory: publicProcedure
      .query(async () => await db.getAllInventory()),

    search: publicProcedure
      .input(z.object({ query: z.string(), categoryId: z.number().optional() }))
      .query(async ({ input }) => await db.searchProducts(input.query, input.categoryId)),

    adminList: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.getAllProductsAdmin(input?.limit || 50, input?.offset || 0);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        basePrice: z.number(),
        partNumber: z.string(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.createProduct(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          basePrice: z.number().optional(),
          categoryName: z.string().optional(),
          imageUrl: z.string().optional(),
          productImages: z.array(z.string()).optional(),
          stock: z.number().optional(),
          moq: z.number().optional(),
          colorOptions: z.array(z.string()).optional(),
          sizeOptions: z.array(z.string()).optional(),
        })
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.updateProduct(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.deleteProduct(input);
      }),
  }),

  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getOrdersByUserId(ctx.user.id)),

    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.getAllOrders(input?.limit || 50, input?.offset || 0);
      }),

    getAllOrders: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.getAllOrders(input?.limit || 50, input?.offset || 0);
      }),

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

        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const orderStatus = 'pending';
        const paymentStatus = input.paymentMethod === 'cod' ? 'pending' : 'pending';

        const orderId = await db.createOrder({
          orderNumber: orderNumber,
          userId: ctx.user.id,
          shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          shippingCost: input.shippingCost,
          totalAmount: input.totalAmount,
          gstAmount: 0,
          discountAmount: 0,
          shippingMethod: 'standard',
          orderStatus: orderStatus,
          paymentStatus: paymentStatus,
          inventoryDeducted: false,
        });

        if (!orderId) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create order' });
        }

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

    createRazorpayOrder: protectedProcedure
      .input(z.object({
        amount: z.number(),
        orderId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_SSPEidW3JH1fgj",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "",
          });

          const razorpayOrder = await razorpay.orders.create({
            amount: input.amount * 100,
            currency: "INR",
            receipt: `order_${input.orderId}`,
            notes: {
              orderId: input.orderId.toString(),
              userId: ctx.user.id.toString(),
            },
          });

          console.log(`[Razorpay] Created order: ${razorpayOrder.id}`);

          return {
            razorpayOrderId: razorpayOrder.id,
            amount: input.amount,
            currency: "INR",
          };
        } catch (error: any) {
          console.error('Razorpay order creation error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create Razorpay order' });
        }
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
          const order = await db.getOrderById(input.orderId);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          if (order.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your order' });

          console.log(`[Razorpay] Payment verified for order ${input.orderId}, payment ID: ${input.razorpayPaymentId}`);

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

    updateStatus: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.string(),
        trackingNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.updateOrderStatus(input.orderId, input.status, input.trackingNumber);
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

    sendNotification: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[Notification] ${input.title}: ${input.content}`);
        return { success: true };
      }),

    notifyOwner: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[Notification] ${input.title}: ${input.content}`);
        return { success: true };
      }),
  }),

  quotations: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getQuotationsByUserId(ctx.user.id)),

    getAllQuotations: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.getAllQuotations(input?.limit || 50, input?.offset || 0);
      }),

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

    update: protectedProcedure
      .input(z.object({
        quotationId: z.number(),
        status: z.string().optional(),
        quotedPrice: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.updateQuotationStatus(input.quotationId, input.status || 'pending', input.quotedPrice);
      }),
  }),

  users: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateUserProfile(ctx.user.id, input);
      }),

    updateCreditLimit: protectedProcedure
      .input(z.object({
        userId: z.number(),
        creditLimit: z.number(),
        creditApproved: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.updateUserCreditLimit(input.userId, input.creditLimit, input.creditApproved);
      }),

    getAllDealers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return await db.getAllUsers(100, 0);
      }),
  }),

  upload: router({
    image: protectedProcedure
      .input(z.object({
        filename: z.string(),
        data: z.string(),
      }))
      .mutation(async ({ input }) => {
        return { success: true, url: '/uploaded-image' };
      }),
  }),

  chat: router({
    loadMessages: publicProcedure
      .input(z.object({ conversationId: z.string() }).optional())
      .query(async () => {
        return [];
      }),
  }),
});

export type AppRouter = typeof appRouter;
