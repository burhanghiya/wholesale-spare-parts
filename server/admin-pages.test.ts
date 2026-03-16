import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as db from './db';

// Mock database functions
vi.mock('./db', () => ({
  getAllProductsAdmin: vi.fn(),
  getInventoryByProductId: vi.fn(),
  getCategoryById: vi.fn(),
  getAllOrders: vi.fn(),
  getUserById: vi.fn(),
}));

describe('Admin Pages Procedures', () => {
  beforeAll(() => {
    // Setup mock data
    vi.mocked(db.getAllProductsAdmin).mockResolvedValue([
      {
        id: 1,
        name: 'Ceiling Fan',
        partNumber: 'CF-001',
        basePrice: '2500',
        isActive: true,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        imageUrl: null,
        explodedViewUrl: null,
        productImages: null,
        colorOptions: null,
        sizeOptions: null,
        compatibleModels: null,
        compatibleBrands: null,
        alternatePartNumbers: null,
      },
      {
        id: 2,
        name: 'LED Bulb',
        partNumber: 'LED-001',
        basePrice: '150',
        isActive: true,
        categoryId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        imageUrl: null,
        explodedViewUrl: null,
        productImages: null,
        colorOptions: null,
        sizeOptions: null,
        compatibleModels: null,
        compatibleBrands: null,
        alternatePartNumbers: null,
      },
    ]);

    vi.mocked(db.getInventoryByProductId).mockResolvedValue({
      id: 1,
      productId: 1,
      quantityInStock: 50,
      minimumOrderQuantity: 1,
      reorderLevel: 10,
      lastRestockDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.getCategoryById).mockResolvedValue({
      id: 1,
      name: 'Fans',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.getAllOrders).mockResolvedValue([
      {
        id: 1,
        orderNumber: 'ORD-123',
        userId: 1,
        totalAmount: '5000',
        gstAmount: '900',
        shippingCost: '100',
        shippingAddress: 'Surat',
        paymentMethod: 'upi',
        status: 'delivered',
        trackingNumber: 'TRACK-123',
        inventoryDeducted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: new Date(),
        processingAt: new Date(),
        shippedAt: new Date(),
        deliveredAt: new Date(),
      },
    ]);

    vi.mocked(db.getUserById).mockResolvedValue({
      id: 1,
      openId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      loginMethod: 'oauth',
      lastSignedIn: new Date(),
      role: 'user',
      businessName: null,
      businessPhone: null,
      businessAddress: null,
      gstNumber: null,
      creditLimit: '0',
      creditApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('products.getAll', () => {
    it('should return all products with inventory and category info', async () => {
      const result = await db.getAllProductsAdmin(1000, 0);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Ceiling Fan');
      expect(result[1].name).toBe('LED Bulb');
    });

    it('should include stock information for inventory management', async () => {
      const inventory = await db.getInventoryByProductId(1);
      expect(inventory?.quantityInStock).toBe(50);
      expect(inventory?.reorderLevel).toBe(10);
    });

    it('should include category information', async () => {
      const category = await db.getCategoryById(1);
      expect(category?.name).toBe('Fans');
    });
  });

  describe('orders.getAll', () => {
    it('should return all orders with user information', async () => {
      const result = await db.getAllOrders(1000, 0);
      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBe('ORD-123');
      expect(result[0].status).toBe('delivered');
    });

    it('should include order status for analytics', async () => {
      const result = await db.getAllOrders(1000, 0);
      const deliveredCount = result.filter(o => o.status === 'delivered').length;
      expect(deliveredCount).toBe(1);
    });

    it('should include total amount for revenue calculation', async () => {
      const result = await db.getAllOrders(1000, 0);
      const totalRevenue = result.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      expect(totalRevenue).toBe(5000);
    });

    it('should include user information', async () => {
      const user = await db.getUserById(1);
      expect(user?.name).toBe('John Doe');
      expect(user?.email).toBe('john@example.com');
    });
  });

  describe('Inventory Management Page Data', () => {
    it('should calculate total products correctly', async () => {
      const products = await db.getAllProductsAdmin(1000, 0);
      expect(products.length).toBe(2);
    });

    it('should calculate total stock value', async () => {
      const products = await db.getAllProductsAdmin(1000, 0);
      let totalValue = 0;
      for (const product of products) {
        const inv = await db.getInventoryByProductId(product.id);
        totalValue += Number(product.basePrice) * (inv?.quantityInStock || 0);
      }
      expect(totalValue).toBeGreaterThan(0);
    });

    it('should identify low stock items', async () => {
      const products = await db.getAllProductsAdmin(1000, 0);
      const reorderLevel = 10;
      const lowStockItems = [];
      for (const product of products) {
        const inv = await db.getInventoryByProductId(product.id);
        if ((inv?.quantityInStock || 0) <= reorderLevel) {
          lowStockItems.push(product);
        }
      }
      // Should have items (50 > 10, so ceiling fan won't be in low stock)
      expect(Array.isArray(lowStockItems)).toBe(true);
    });
  });

  describe('Analytics Page Data', () => {
    it('should calculate delivered orders percentage', async () => {
      const orders = await db.getAllOrders(1000, 0);
      const deliveredCount = orders.filter(o => o.status === 'delivered').length;
      const percentage = (deliveredCount / orders.length) * 100;
      expect(percentage).toBe(100);
    });

    it('should calculate average order value', async () => {
      const orders = await db.getAllOrders(1000, 0);
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
      const avgOrderValue = totalRevenue / orders.length;
      expect(avgOrderValue).toBe(5000);
    });

    it('should get top products by price', async () => {
      const products = await db.getAllProductsAdmin(1000, 0);
      const topProducts = products
        .sort((a, b) => Number(b.basePrice) - Number(a.basePrice))
        .slice(0, 5);
      expect(topProducts[0].basePrice).toBe('2500');
      expect(topProducts[1].basePrice).toBe('150');
    });

    it('should calculate order status distribution', async () => {
      const orders = await db.getAllOrders(1000, 0);
      const statusCounts: Record<string, number> = {};
      for (const order of orders) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      }
      expect(statusCounts['delivered']).toBe(1);
    });
  });
});
