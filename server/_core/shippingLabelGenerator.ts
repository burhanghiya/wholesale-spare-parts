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
}

export async function generateShippingLabel(data: ShippingLabelData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 30 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header
      doc.fontSize(24).font("Helvetica-Bold").text("SHIPPING LABEL", { align: "center" });
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica").text(`Order #${data.orderNumber}`, { align: "center" });
      doc.moveDown(0.8);

      // Shipping Address Box
      const boxX = 30;
      const boxY = doc.y;
      const boxWidth = 540;
      const boxHeight = 130;
      
      doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();
      
      doc.fontSize(12).font("Helvetica-Bold").text("SHIP TO:", boxX + 10, boxY + 10);
      doc.fontSize(11).font("Helvetica");
      
      let addressY = boxY + 30;
      doc.text(data.customerName, boxX + 10, addressY);
      addressY += 18;
      
      // Format address properly
      const addressLine = `${data.shippingAddress}`;
      doc.fontSize(10).text(addressLine, boxX + 10, addressY, { width: boxWidth - 20 });
      addressY += 18;
      
      const cityStateZip = `${data.shippingCity}, ${data.shippingState} ${data.shippingZip}`;
      doc.text(cityStateZip, boxX + 10, addressY);
      addressY += 18;
      
      doc.text(`Phone: ${data.customerPhone}`, boxX + 10, addressY);
      
      doc.moveDown(7);

      // Order Details Section
      doc.fontSize(12).font("Helvetica-Bold").text("ORDER DETAILS", 30, doc.y);
      doc.moveDown(0.4);

      // Table Header
      const tableTop = doc.y;
      const col1 = 30;
      const col2 = 280;
      const col3 = 420;
      const col4 = 500;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Item", col1, tableTop);
      doc.text("Part #", col2, tableTop);
      doc.text("Qty", col3, tableTop);
      doc.text("Amount", col4, tableTop);

      // Table line
      doc.moveTo(30, tableTop + 15).lineTo(570, tableTop + 15).stroke();

      // Items
      let itemY = tableTop + 20;
      doc.font("Helvetica").fontSize(10);
      
      data.items.forEach((item) => {
        doc.text(item.name.substring(0, 30), col1, itemY);
        doc.text(item.partNumber || "-", col2, itemY);
        doc.text(item.quantity.toString(), col3, itemY);
        itemY += 18;
      });

      // Total line
      doc.moveTo(30, itemY).lineTo(570, itemY).stroke();
      itemY += 10;
      
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("TOTAL AMOUNT:", col1, itemY);
      doc.text(`₹${data.totalAmount}`, col4, itemY);
      
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).font("Helvetica").text("Please keep this label safe. Do not fold or damage.", 30, doc.y, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 30, doc.y, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
