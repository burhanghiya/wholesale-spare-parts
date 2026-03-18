import { eq, and, like, desc, asc, sql, or, lte, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, products, inventory, cartItems, orders, orderItems,
  quotations, categories, gstConfiguration, shippingRates, settings
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    if (!ENV.databaseUrl) {
      console.warn("[Database] DATABASE_URL not configured");
      return null;
    }
    try {
      _db = drizzle(ENV.databaseUrl);
      console.log("[Database] Connected successfully to", ENV.databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ========================
// USER FUNCTIONS
// ========================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function updateUserProfile(userId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ ...data, updatedAt: new Date() } as any).where(eq(users.id, userId));
  return true;
}

export async function updateUserCreditLimit(userId: number, creditLimit: number, creditApproved: boolean) {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({
    creditLimit: String(creditLimit),
    creditApproved,
    updatedAt: new Date()
  } as any).where(eq(users.id, userId));
  return true;
}

// ========================
// PRODUCT FUNCTIONS
// ========================

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));
}

export async function searchProducts(query: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  const conditions = [
    eq(products.isActive, true),
    or(
      like(products.partNumber, searchPattern),
      like(products.name, searchPattern),
      like(products.description, searchPattern)
    )
  ];
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  return await db.select().from(products).where(and(...conditions));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductByPartNumber(partNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.partNumber, partNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProducts(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.isActive, true)).limit(limit).offset(offset);
}

export async function getAllProductsAdmin(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).orderBy(desc(products.createdAt)).limit(limit).offset(offset);
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(products).set({ ...data, updatedAt: new Date() } as any).where(eq(products.id, id));
  return true;
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(products).set({ isActive: false, updatedAt: new Date() } as any).where(eq(products.id, id));
  return true;
}

// ========================
// CATEGORY FUNCTIONS
// ========================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories);
}

export async function createCategory(data: any) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(categories).values(data);
}

// ========================
// INVENTORY FUNCTIONS
// ========================

export async function getInventoryByProductId(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllInventory() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventory);
}

export async function upsertInventory(productId: number, data: any) {
  const db = await getDb();
  if (!db) return false;
  const existing = await getInventoryByProductId(productId);
  if (existing) {
    await db.update(inventory).set({ ...data, updatedAt: new Date() } as any).where(eq(inventory.id, existing.id));
  } else {
    await db.insert(inventory).values({ productId, ...data } as any);
  }
  return true;
}

// ========================
// CART FUNCTIONS
// ========================

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
}

export async function addToCart(userId: number, productId: number, quantity: number, price?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(cartItems).where(
    and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
  ).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity, updatedAt: new Date() }).where(eq(cartItems.id, existing[0].id));
    return existing[0];
  }
  return await db.insert(cartItems).values({ productId, quantity, userId, addedPrice: price ? String(price) : undefined } as any);
}

export async function removeFromCart(cartItemId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  return true;
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  return true;
}

// ========================
// ORDER FUNCTIONS
// ========================

export async function createOrder(orderData: any): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(orders).values(orderData);
  // MySQL returns insertId in the result
  return (result as any)[0]?.insertId || (result as any).insertId || undefined;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const orderList = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
  
  // Fetch items for each order with product names
  const ordersWithItems = await Promise.all(orderList.map(async (order) => {
    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      productName: products.name,
      partNumber: products.partNumber,
      basePrice: products.basePrice,
      price: orderItems.unitPrice,
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  }));
  
  return ordersWithItems;
}

export async function updateOrderStatus(orderId: number, status: string, trackingNumber?: string) {
  const db = await getDb();
  if (!db) return false;
  const updateData: any = { orderStatus: status as any, updatedAt: new Date() };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  
  // Record timestamp for each status change
  const now = new Date();
  if (status === 'confirmed') updateData.confirmedAt = now;
  else if (status === 'processing') updateData.processingAt = now;
  else if (status === 'shipped') updateData.shippedAt = now;
  else if (status === 'delivered') updateData.deliveredAt = now;
  
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
  return true;
}

export async function updateOrderPaymentStatus(orderId: number, paymentStatus: string) {
  const db = await getDb();
  if (!db) return false;
  await db.update(orders).set({ paymentStatus: paymentStatus as any, updatedAt: new Date() }).where(eq(orders.id, orderId));
  return true;
}

export async function addOrderItems(orderId: number, items: any[]) {
  const db = await getDb();
  if (!db) return false;
  for (const item of items) {
    // Calculate totalPrice from unitPrice and quantity
    const unitPrice = parseFloat(String(item.price || item.unitPrice || 0));
    const quantity = parseInt(String(item.quantity || 1));
    const totalPrice = unitPrice * quantity;
    
    const insertData: any = {
      orderId: orderId,
      productId: parseInt(String(item.productId)),
      quantity: quantity,
      unitPrice: unitPrice.toString(),
      totalPrice: totalPrice.toString(),
    };
    
    if (item.selectedColor) insertData.selectedColor = item.selectedColor;
    if (item.selectedSize) insertData.selectedSize = item.selectedSize;
    
    await db.insert(orderItems).values(insertData as any);
  }
  return true;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function setManualShippingCharge(orderId: number, shippingCharge: number) {
  const database = await getDb();
  if (!database) return false;
  await database.update(orders).set({ manualShippingCharge: shippingCharge as any, updatedAt: new Date() }).where(eq(orders.id, orderId));
  return true;
}

// ========================
// QUOTATION FUNCTIONS
// ========================

export async function createQuotation(quotationData: any) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(quotations).values(quotationData);
}

export async function getQuotationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getQuotationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quotations).where(eq(quotations.userId, userId)).orderBy(desc(quotations.createdAt));
}

export async function getAllQuotations(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quotations).orderBy(desc(quotations.createdAt)).limit(limit).offset(offset);
}

export async function updateQuotationStatus(quotationId: number, status: string, quotedPrice?: number) {
  const db = await getDb();
  if (!db) return false;
  const updateData: any = { status: status as any, updatedAt: new Date() };
  if (quotedPrice) updateData.quotedPrice = quotedPrice;
  await db.update(quotations).set(updateData).where(eq(quotations.id, quotationId));
  return true;
}

// ========================
// TIERED PRICING
// ========================



// ========================
// GST CONFIGURATION
// ========================

export async function getGstConfiguration() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gstConfiguration).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGstConfiguration(data: any) {
  const db = await getDb();
  if (!db) return false;
  const existing = await getGstConfiguration();
  if (existing) {
    await db.update(gstConfiguration).set({ ...data, updatedAt: new Date() }).where(eq(gstConfiguration.id, existing.id));
  } else {
    await db.insert(gstConfiguration).values({ ...data, createdAt: new Date(), updatedAt: new Date() });
  }
  return true;
}

// ========================
// ADMIN DASHBOARD STATS
// ========================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalUsers: 0, pendingOrders: 0, pendingQuotations: 0 };

  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(totalAmount), 0)` }).from(orders).where(eq(orders.paymentStatus, 'completed'));
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [pendingOrderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.orderStatus, 'pending'));
  const [pendingQuoteCount] = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(eq(quotations.status, 'pending'));

  return {
    totalProducts: productCount?.count || 0,
    totalOrders: orderCount?.count || 0,
    totalRevenue: Number(revenueResult?.total || 0),
    totalUsers: userCount?.count || 0,
    pendingOrders: pendingOrderCount?.count || 0,
    pendingQuotations: pendingQuoteCount?.count || 0,
  };
}


// ========================
// ADDITIONAL HELPER FUNCTIONS
// ========================

export async function findOrCreateCategory(name: string): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const existing = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(categories).values({ name, createdAt: new Date(), updatedAt: new Date() });
  // Get the newly created category
  const newCat = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  return newCat.length > 0 ? newCat[0].id : 1;
}

export async function getCategoryById(id: number | null) {
  if (!id) return undefined;
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}

export async function getShippingRates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(shippingRates);
}

export async function updateShippingRate(id: number, data: { minDistance?: number, maxDistance?: number, baseCost?: number, isActive?: boolean }) {
  const database = await getDb();
  if (!database) return null;
  const updateData: any = { updatedAt: new Date() };
  if (data.minDistance !== undefined) updateData.minDistance = data.minDistance;
  if (data.maxDistance !== undefined) updateData.maxDistance = data.maxDistance;
  if (data.baseCost !== undefined) updateData.baseCost = data.baseCost;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await database.update(shippingRates).set(updateData).where(eq(shippingRates.id, id));
  return await database.select().from(shippingRates).where(eq(shippingRates.id, id)).then(rows => rows[0]);
}

export async function calculateShippingCost(distanceKm: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const rates = await db.select().from(shippingRates).where(eq(shippingRates.isActive, true));
  if (rates.length === 0) return 0;
  
  const rate = rates[0];
  const baseCost = Number(rate.baseCost) || 0;
  const costPerKm = Number(rate.costPerKm) || 0;
  
  return baseCost + (distanceKm * costPerKm);
}


export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(cartItems).set({ quantity, updatedAt: new Date() }).where(eq(cartItems.id, cartItemId));
  return true;
}


// Distance-based shipping calculation using Google Maps
// Calculates distance from warehouse to customer address and applies per-km charge
export async function calculateShippingByDistance(customerAddress: string) {
  try {
    // Fixed shipping cost for Surat delivery
    // Base Cost: ₹45, Free shipping on orders above ₹500
    const FIXED_SHIPPING_COST = 45;
    
    console.log(`[Shipping] Calculated shipping cost for address: ${customerAddress}`);
    return FIXED_SHIPPING_COST;
  } catch (error) {
    console.error("Error calculating shipping distance:", error);
    return 45; // Default to ₹45
  }
}

// Per-kilometer shipping configuration
export async function getShippingConfig() {
  // Return fixed shipping configuration for Surat
  return {
    baseCost: 45,
    costPerKm: 0,
    freeShippingThreshold: 500,
  };
}

export async function updateShippingConfig(baseCost: number, costPerKm: number, freeShippingThreshold: number) {
  const db = await getDb();
  if (!db) return false;
  
  // Update first record with new config
  const existing = await db.select().from(shippingRates).limit(1);
  
  if (existing.length > 0) {
    await db.update(shippingRates)
      .set({ baseCost: String(baseCost), costPerKm: String(costPerKm), minDistance: freeShippingThreshold, updatedAt: new Date() })
      .where(eq(shippingRates.id, existing[0].id));
  } else {
    // Create first config if doesn't exist
    await db.insert(shippingRates).values({
      minDistance: freeShippingThreshold,
      maxDistance: 1000,
      baseCost: String(baseCost),
      costPerKm: String(costPerKm),
      isActive: true,
    });
  }
  
  return true;
}


// ========================
// INVENTORY DEDUCTION
// ========================

export async function deductInventoryForOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot deduct inventory: database not available"); return false; }

  try {
    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    
    if (items.length === 0) {
      console.warn("[Inventory] No items found for order", orderId);
      return false;
    }

    // Deduct inventory for each item
    for (const item of items) {
      const currentInventory = await db.select().from(inventory).where(eq(inventory.productId, item.productId));
      
      if (currentInventory.length > 0) {
        const inv = currentInventory[0];
        const newQuantity = Math.max(0, inv.quantityInStock - item.quantity);
        
        await db.update(inventory)
          .set({ quantityInStock: newQuantity, updatedAt: new Date() })
          .where(eq(inventory.id, inv.id));
      }
    }

    // Mark order as inventory deducted
    await db.update(orders)
      .set({ inventoryDeducted: true, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return true;
  } catch (error) {
    console.error("[Inventory] Error deducting inventory:", error);
    return false;
  }
}

export async function restoreInventoryForOrder(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot restore inventory: database not available"); return false; }

  try {
    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    
    if (items.length === 0) {
      console.warn("[Inventory] No items found for order", orderId);
      return false;
    }

    // Restore inventory for each item
    for (const item of items) {
      const currentInventory = await db.select().from(inventory).where(eq(inventory.productId, item.productId));
      
      if (currentInventory.length > 0) {
        const inv = currentInventory[0];
        const newQuantity = inv.quantityInStock + item.quantity;
        
        await db.update(inventory)
          .set({ quantityInStock: newQuantity, updatedAt: new Date() })
          .where(eq(inventory.id, inv.id));
      }
    }

    // Mark order as inventory not deducted
    await db.update(orders)
      .set({ inventoryDeducted: false, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return true;
  } catch (error) {
    console.error("[Inventory] Error restoring inventory:", error);
    return false;
  }
}


// ========================
// SETTINGS FUNCTIONS
// ========================

export async function getSettings() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(settings).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSettings(data: {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  paymentGateway?: string;
  shippingProvider?: string;
  taxRate?: string;
  codEnabled?: boolean;
}) {
  const db = await getDb();
  if (!db) return false;
  
  const updateData: any = { updatedAt: new Date() };
  if (data.siteName !== undefined) updateData.siteName = data.siteName;
  if (data.siteDescription !== undefined) updateData.siteDescription = data.siteDescription;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.paymentGateway !== undefined) updateData.paymentGateway = data.paymentGateway;
  if (data.shippingProvider !== undefined) updateData.shippingProvider = data.shippingProvider;
  if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
  if (data.codEnabled !== undefined) updateData.codEnabled = data.codEnabled;
  
  const existing = await db.select().from(settings).limit(1);
  
  if (existing.length > 0) {
    await db.update(settings).set(updateData).where(eq(settings.id, existing[0].id));
  } else {
    await db.insert(settings).values({ ...updateData, siteName: data.siteName || 'Patel Electricals' });
  }
  
  return true;
}
