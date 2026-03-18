import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

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
        return { product, inventory };
      }),

    getByCategory: publicProcedure
      .input(z.number())
      .query(async ({ input }) => db.getProductsByCategory(input)),

    getCategories: publicProcedure.query(async () => db.getAllCategories()),

    getInventory: publicProcedure.query(async () => db.getAllInventory()),

    create: adminProcedure
      .input(z.object({
        partNumber: z.string(), name: z.string(), description: z.string().optional(),
        categoryName: z.string().default("General"),
        basePrice: z.number(),
        compatibleModels: z.array(z.string()).optional(),
        compatibleBrands: z.array(z.string()).optional(),
        alternatePartNumbers: z.array(z.string()).optional(),
        imageUrl: z.string().optional(), explodedViewUrl: z.string().optional(),
        productImages: z.array(z.string()).optional(),
        colorOptions: z.array(z.string()).optional(),
        sizeOptions: z.array(z.string()).optional(),
        stock: z.number().optional(), moq: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { stock, moq, categoryName, productImages, colorOptions, sizeOptions, ...rest } = input;
        // Find or create category by name
        const categoryId = await db.findOrCreateCategory(categoryName);
        const productData = {
          ...rest,
          categoryId,
          basePrice: String(input.basePrice),
          compatibleModels: input.compatibleModels ? JSON.stringify(input.compatibleModels) : null,
          compatibleBrands: input.compatibleBrands ? JSON.stringify(input.compatibleBrands) : null,
          alternatePartNumbers: input.alternatePartNumbers ? JSON.stringify(input.alternatePartNumbers) : null,
          productImages: productImages ? JSON.stringify(productImages) : null,
          colorOptions: colorOptions ? JSON.stringify(colorOptions) : null,
          sizeOptions: sizeOptions ? JSON.stringify(sizeOptions) : null,
        };
        await db.createProduct(productData);
        const productResult = await db.getProductByPartNumber(input.partNumber);
        if (productResult) {
          await db.upsertInventory(productResult.id, {
            quantityInStock: stock || 0,
            minimumOrderQuantity: moq || 1,
            reorderLevel: 10,
          });
        }
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(), description: z.string().optional(),
          basePrice: z.number().optional(), isActive: z.boolean().optional(),
          partNumber: z.string().optional(), categoryName: z.string().optional(),
          imageUrl: z.string().optional(), productImages: z.array(z.string()).optional(),
          colorOptions: z.array(z.string()).optional(),
          sizeOptions: z.array(z.string()).optional(),
          stock: z.number().optional(), moq: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { categoryName, stock, moq, productImages, colorOptions, sizeOptions, ...restData } = input.data;
        const updateData: any = { ...restData };
        if (updateData.basePrice) updateData.basePrice = String(updateData.basePrice);
        if (productImages) updateData.productImages = JSON.stringify(productImages);
        if (colorOptions) updateData.colorOptions = JSON.stringify(colorOptions);
        if (sizeOptions) updateData.sizeOptions = JSON.stringify(sizeOptions);
        if (categoryName) {
          updateData.categoryId = await db.findOrCreateCategory(categoryName);
        }
        await db.updateProduct(input.id, updateData);
        // Update inventory if stock/moq provided
        if (stock !== undefined || moq !== undefined) {
          const invData: any = {};
          if (stock !== undefined) invData.quantityInStock = stock;
          if (moq !== undefined) invData.minimumOrderQuantity = moq;
          await db.upsertInventory(input.id, invData);
        }
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
      .query(async ({ input }) => {
        const prods = await db.getAllProductsAdmin(input.limit, input.offset);
        // Attach inventory info to each product
        const result = await Promise.all(prods.map(async (p) => {
          const inv = await db.getInventoryByProductId(p.id);
          const cat = await db.getCategoryById(p.categoryId);
          return { ...p, inventory: inv, categoryName: cat?.name || "General" };
        }));
        return result;
      }),

    getAll: adminProcedure
      .input(z.object({ limit: z.number().default(1000), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const prods = await db.getAllProductsAdmin(input?.limit || 1000, input?.offset || 0);
        const result = await Promise.all(prods.map(async (p) => {
          const inv = await db.getInventoryByProductId(p.id);
          const cat = await db.getCategoryById(p.categoryId);
          return { ...p, inventory: inv, categoryName: cat?.name || "General", stock: inv?.quantityInStock || 0 };
        }));
        return result;
      })
  }),

  // Image upload endpoint
  upload: router({
    image: adminProcedure
      .input(z.object({ base64: z.string(), filename: z.string(), contentType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, 'base64');
        const ext = input.filename.split('.').pop() || 'jpg';
        const key = `products/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      return await Promise.all(items.map(async (item) => {
        const product = await db.getProductById(item.productId);
        const inv = await db.getInventoryByProductId(item.productId);
        return { ...item, product, inventory: inv };
      }));
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
        return await db.addToCart(ctx.user.id, input.productId, input.quantity, Number(product.basePrice));
      }),

    updateQuantity: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ input }) => {
        await db.updateCartItemQuantity(input.cartItemId, input.quantity);
        return { success: true };
      }),

    remove: protectedProcedure.input(z.number()).mutation(async ({ input }) => db.removeFromCart(input)),
    clear: protectedProcedure.mutation(async ({ ctx }) => db.clearCart(ctx.user.id)),
  }),

  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getOrdersByUserId(ctx.user.id)),

    getById: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
      if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const items = await db.getOrderItems(input);
      // Attach product info to each item
      const itemsWithProduct = await Promise.all(items.map(async (item) => {
        const product = await db.getProductById(item.productId);
        return { ...item, product };
      }));
      return { order, items: itemsWithProduct };
    }),

    create: protectedProcedure
      .input(z.object({
        shippingAddress: z.string(),
        paymentMethod: z.enum(['upi', 'bank_transfer', 'card', 'cod', 'razorpay']),
        shippingPincode: z.string().optional(),
        shippingCost: z.number().optional().default(0),
        totalAmount: z.number().optional(),
        cartItems: z.array(z.object({
          id: z.number(),
          productId: z.number(),
          quantity: z.number(),
          addedPrice: z.string().optional(),
          product: z.object({
            id: z.number(),
            name: z.string(),
            basePrice: z.string(),
          }).optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Use provided cartItems or fetch from DB
        let cartItemsList = input.cartItems || await db.getCartItems(ctx.user.id);
        console.log('[DEBUG] Cart items for user', ctx.user.id, ':', cartItemsList.length, cartItemsList);
        if (cartItemsList.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });

        // Use totalAmount from client if provided, otherwise calculate from cartItems
        let totalAmount = input.totalAmount || 0;
        const orderItemsData = [];
        
        // If totalAmount not provided, calculate from cartItems
        if (!input.totalAmount && cartItemsList.length > 0) {
          for (const item of cartItemsList) {
            let product = (item as any).product;
            if (!product) {
              product = await db.getProductById(item.productId);
            }
            if (!product) continue;
            
            const inventory = await db.getInventoryByProductId(item.productId);
            const availableStock = inventory?.quantityInStock || 0;
            if (availableStock < item.quantity) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: `${product.name} has only ${availableStock} units available, but you requested ${item.quantity}` });
            }
            const itemTotal = Number(product.basePrice) * item.quantity;
            totalAmount += itemTotal;
            orderItemsData.push({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: String(Number(product.basePrice)),
              totalPrice: String(itemTotal),
            });
          }
        } else if (input.totalAmount && cartItemsList.length > 0) {
          // Still validate stock even if using client totalAmount
          for (const item of cartItemsList) {
            const inventory = await db.getInventoryByProductId(item.productId);
            const availableStock = inventory?.quantityInStock || 0;
            if (availableStock < item.quantity) {
              const product = (item as any).product || await db.getProductById(item.productId);
              throw new TRPCError({ code: 'BAD_REQUEST', message: `${product?.name} has only ${availableStock} units available, but you requested ${item.quantity}` });
            }
            orderItemsData.push({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: String(item.addedPrice || '0'),
              totalPrice: String(Number(item.addedPrice || 0) * item.quantity),
            });
          }
        }

        const orderNumber = `ORD-${Date.now()}`;
        const totalWithShipping = totalAmount + (input.shippingCost || 0);

        // Create order for all payment methods
        const orderId = await db.createOrder({
          orderNumber, userId: ctx.user.id,
          totalAmount: String(totalAmount), gstAmount: String(0),
          shippingCost: String(input.shippingCost || 0), shippingAddress: input.shippingAddress,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          orderStatus: 'pending',
          notes: null,
        });

        // Add order items
        if (orderId) {
          await db.addOrderItems(orderId, orderItemsData);
        }

        // For COD: Order is created, payment happens later
        // For Razorpay/UPI: Order exists but customer must complete payment
        const paymentRequired = input.paymentMethod !== 'cod';
        return { orderNumber, totalAmount: totalWithShipping, orderId, paymentRequired };
      }),

    confirmPayment: protectedProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get order to verify it belongs to current user
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your order' });
        
        // Update payment status to completed
        await db.updateOrderPaymentStatus(input.orderId, 'completed');
        
        // Clear cart for this user
        await db.clearCart(ctx.user.id);
        
        return { success: true, message: 'Payment completed' };
      }),

    getAllOrders: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const ordersList = await db.getAllOrders(input.limit, input.offset);
        // Attach user info
        const result = await Promise.all(ordersList.map(async (order) => {
          const user = await db.getUserById(order.userId);
          return { ...order, userName: user?.name || user?.email || 'Unknown' };
        }));
        return result;
      }),

    getAll: adminProcedure
      .input(z.object({ limit: z.number().default(1000), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const ordersList = await db.getAllOrders(input?.limit || 1000, input?.offset || 0);
        // Attach user info
        const result = await Promise.all(ordersList.map(async (order) => {
          const user = await db.getUserById(order.userId);
          return { ...order, userName: user?.name || user?.email || 'Unknown' };
        }));
        return result;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
        trackingNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status, input.trackingNumber);
        
        // Automatically deduct inventory when order is confirmed or delivered
        if (input.status === 'confirmed' || input.status === 'delivered') {
          await db.deductInventoryForOrder(input.orderId);
        }
        
        // Restore inventory when order is cancelled
        if (input.status === 'cancelled') {
          await db.restoreInventoryForOrder(input.orderId);
        }
        
        return { success: true };
      }),



    verifyRazorpayPayment: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const crypto = require('crypto');
        const { ENV } = require('./_core/env');

        try {
          // Verify signature
          const body = input.razorpayOrderId + '|' + input.razorpayPaymentId;
          const expectedSignature = crypto
            .createHmac('sha256', ENV.razorpayKeySecret)
            .update(body)
            .digest('hex');

          if (expectedSignature !== input.razorpaySignature) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid payment signature' });
          }

          // Get order to verify it belongs to current user
          const order = await db.getOrderById(input.orderId);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          if (order.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your order' });

          // Update payment status to completed
          await db.updateOrderPaymentStatus(input.orderId, 'completed');

          // Clear cart for this user
          await db.clearCart(ctx.user.id);

          return { success: true, message: 'Payment verified and completed' };
        } catch (error: any) {
          console.error('Razorpay verification error:', error);
          if (error.code === 'BAD_REQUEST' || error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
            throw error;
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment verification failed' });
        }
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
        items: z.array(z.object({ productId: z.number(), quantity: z.number(), requestedPrice: z.number().optional() })),
        notes: z.string().optional(),
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
          adminNotes: input.notes || null,
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
        adminNotes: z.string().optional(),
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

    deleteCategory: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteCategory(input);
        return { success: true };
      }),



    // Shipping configuration
    getShippingRates: adminProcedure.query(async () => db.getShippingRates()),

    updateShippingRate: adminProcedure
      .input(z.object({
        id: z.number(),
        minDistance: z.number().optional(),
        maxDistance: z.number().optional(),
        baseCost: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const updated = await db.updateShippingRate(input.id, {
          minDistance: input.minDistance,
          maxDistance: input.maxDistance,
          baseCost: input.baseCost,
          isActive: input.isActive,
        });
        return updated || { success: false };
      }),

    calculateShipping: publicProcedure
      .input(z.object({ distanceKm: z.number() }))
      .query(async ({ input }) => {
        const cost = await db.calculateShippingCost(input.distanceKm);
        return { shippingCost: cost };
      }),

    calculateShippingByDistance: publicProcedure
      .input(z.object({ address: z.string().min(1) }))
      .query(async ({ input }) => {
        const cost = await db.calculateShippingByDistance(input.address);
        return { shippingCost: cost };
      }),

    setManualShippingCharge: adminProcedure
      .input(z.object({
        orderId: z.number(),
        shippingCharge: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const success = await db.setManualShippingCharge(input.orderId, input.shippingCharge);
        return { success };
      }),

    getShippingConfig: adminProcedure.query(async () => db.getShippingConfig()),

    updateShippingConfig: adminProcedure
      .input(z.object({
        baseCost: z.number().min(0),
        costPerKm: z.number().min(0),
        freeShippingThreshold: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const success = await db.updateShippingConfig(input.baseCost, input.costPerKm, input.freeShippingThreshold);
        return { success };
      }),
  }),
});

export type AppRouter = typeof appRouter;
