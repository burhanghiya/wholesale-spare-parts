import PDFDocument from "pdfkit";

export interface ShippingLabelData {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  items: Array<{ name: string; quantity: number; partNumber?: string }>;
  totalAmount: string;
  shopName?: string;
  shopPhone?: string;
  shopEmail?: string;
  shopAddress?: string;
}

export async function generateShippingLabel(data: ShippingLabelData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Shop Details (Top Right)
      const shopX = 350;
      const shopY = 40;
      doc.fontSize(9).font("Helvetica-Bold").text(data.shopName || "Patel Electricals", shopX, shopY);
      doc.fontSize(8).font("Helvetica");
      doc.text(data.shopPhone || "8780657095", shopX, shopY + 15);
      doc.text(data.shopEmail || "burhanghiya26@gmail.com", shopX, shopY + 28);
      
      // Title
      doc.fontSize(28).font("Helvetica-Bold").text("SHIPPING LABEL", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(12).font("Helvetica").text(`Order #${data.orderNumber}`, { align: "center" });
      doc.moveDown(1);

      // Address Box
      const boxX = 40;
      const boxY = doc.y;
      const boxWidth = 515;
      const boxHeight = 140;
      
      doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();
      
      // SHIP TO header
      doc.fontSize(13).font("Helvetica-Bold").text("SHIP TO:", boxX + 15, boxY + 12);
      
      // Address content
      let contentY = boxY + 35;
      doc.fontSize(12).font("Helvetica-Bold").text(data.customerName, boxX + 15, contentY);
      
      contentY += 22;
      doc.fontSize(11).font("Helvetica").text(data.shippingAddress, boxX + 15, contentY);
      
      contentY += 22;
      const cityLine = `${data.shippingCity}, ${data.shippingState} ${data.shippingZip}`;
      doc.text(cityLine, boxX + 15, contentY);
      
      contentY += 22;
      doc.text(`Phone: ${data.customerPhone}`, boxX + 15, contentY);
      
      doc.moveDown(8);

      // Order Details
      doc.fontSize(13).font("Helvetica-Bold").text("ORDER DETAILS", 40, doc.y);
      doc.moveDown(0.5);

      // Table Header
      const tableY = doc.y;
      const col1X = 40;
      const col2X = 280;
      const col3X = 420;
      const col4X = 480;

      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Item", col1X, tableY);
      doc.text("Part #", col2X, tableY);
      doc.text("Qty", col3X, tableY);
      doc.text("Amount", col4X, tableY);

      // Separator line
      doc.moveTo(40, tableY + 18).lineTo(555, tableY + 18).stroke();

      // Items
      let itemY = tableY + 25;
      doc.fontSize(10).font("Helvetica");
      
      data.items.forEach((item) => {
        doc.text(item.name.substring(0, 35), col1X, itemY);
        doc.text(item.partNumber || "-", col2X, itemY);
        doc.text(item.quantity.toString(), col3X, itemY);
        itemY += 20;
      });

      // Total line
      doc.moveTo(40, itemY).lineTo(555, itemY).stroke();
      itemY += 12;
      
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("TOTAL AMOUNT:", col1X, itemY);
      doc.text(`₹${data.totalAmount}`, col4X, itemY);
      
      doc.moveDown(3);

      // Footer
      doc.fontSize(9).font("Helvetica").text("Please keep this label safe. Do not fold or damage.", 40, doc.y, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 40, doc.y, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
