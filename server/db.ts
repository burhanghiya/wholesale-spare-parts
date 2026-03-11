import { eq, and, gte, lte, like, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, inventory, cartItems, orders, orderItems, quotations, categories, tieredPricing, gstConfiguration } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));
}

export async function searchProducts(query: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(products.isActive, true),
    ...(categoryId ? [eq(products.categoryId, categoryId)] : [])
  ];
  
  return await db.select().from(products).where(
    and(
      ...conditions,
      like(products.partNumber, `%${query}%`)
    )
  );
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

// Inventory queries
export async function getInventoryByProductId(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Cart queries
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
    await db.update(cartItems).set({
      quantity: existing[0].quantity + quantity,
      updatedAt: new Date()
    }).where(eq(cartItems.id, existing[0].id));
    return existing[0];
  }
  
  const result = await db.insert(cartItems).values({
    productId,
    quantity,
    userId,
    addedPrice: price ? String(price) : undefined
  } as any);
  
  return result;
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

// Order queries
export async function createOrder(orderData: any) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(orders).values(orderData);
  return result;
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
  return await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) return false;
  await db.update(orders).set({
    orderStatus: status as any,
    updatedAt: new Date()
  }).where(eq(orders.id, orderId));
  return true;
}

// Order items queries
export async function addOrderItems(orderId: number, items: any[]) {
  const db = await getDb();
  if (!db) return false;
  
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId,
      ...item
    });
  }
  return true;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// Quotation queries
export async function createQuotation(quotationData: any) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(quotations).values(quotationData);
  return result;
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
  
  const updateData: any = {
    status: status as any,
    updatedAt: new Date()
  };
  
  if (quotedPrice) {
    updateData.quotedPrice = quotedPrice;
  }
  
  await db.update(quotations).set(updateData).where(eq(quotations.id, quotationId));
  return true;
}

// Category queries
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories);
}

// Tiered pricing queries
export async function getTieredPricingForProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tieredPricing).where(eq(tieredPricing.productId, productId)).orderBy(asc(tieredPricing.minQuantity));
}

export async function calculatePrice(productId: number, quantity: number, basePrice: number) {
  const db = await getDb();
  if (!db) return basePrice * quantity;
  
  const pricing = await getTieredPricingForProduct(productId);
  
  let discountPercentage = 0;
  for (const tier of pricing) {
    if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
      if (tier.specialPrice) {
        return Number(tier.specialPrice) * quantity;
      }
      discountPercentage = Number(tier.discountPercentage);
      break;
    }
  }
  
  const discountedPrice = basePrice * (1 - discountPercentage / 100);
  return discountedPrice * quantity;
}

// GST Configuration
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
    await db.update(gstConfiguration).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(gstConfiguration.id, existing.id));
  } else {
    await db.insert(gstConfiguration).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return true;
}
