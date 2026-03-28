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
      const doc = new PDFDocument({ size: "A4", margin: 20 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("SHIPPING LABEL", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").text("Order #" + data.orderNumber, { align: "center" });
      doc.moveDown(0.5);

      // Shipping Address Box
      doc
        .rect(20, doc.y, 555, 120)
        .stroke();
      doc.fontSize(12).font("Helvetica-Bold").text("SHIP TO:", 30, doc.y + 10);
      doc.fontSize(11).font("Helvetica");
      doc.text(data.customerName, 30, doc.y + 5);
      doc.text(data.shippingAddress, 30, doc.y);
      doc.text(
        `${data.shippingCity}, ${data.shippingState} ${data.shippingZip}`,
        30,
        doc.y
      );
      doc.text(`Phone: ${data.customerPhone}`, 30, doc.y);
      doc.moveDown(1.5);

      // Order Details Section
      doc.fontSize(11).font("Helvetica-Bold").text("ORDER DETAILS", 30, doc.y);
      doc.moveDown(0.3);

      // Items Table Header
      const tableTop = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Item", 30, tableTop);
      doc.text("Part #", 250, tableTop);
      doc.text("Qty", 380, tableTop);
      doc.text("Total", 450, tableTop);

      // Table line
      doc.moveTo(30, tableTop + 15).lineTo(555, tableTop + 15).stroke();

      // Items
      let itemY = tableTop + 20;
      doc.font("Helvetica").fontSize(9);
      data.items.forEach((item) => {
        doc.text(item.name.substring(0, 25), 30, itemY);
        doc.text(item.partNumber || "-", 250, itemY);
        doc.text(item.quantity.toString(), 380, itemY);
        itemY += 20;
      });

      // Total
      doc.moveTo(30, itemY).lineTo(555, itemY).stroke();
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("TOTAL AMOUNT:", 380, itemY + 5);
      doc.text("₹" + data.totalAmount, 450, itemY + 5);
      doc.moveDown(1);

      // Footer
      doc.fontSize(8).font("Helvetica").text("Please keep this label safe. Do not fold or damage the barcode.", 30, doc.y, { align: "center" });
      doc.text("Generated on: " + new Date().toLocaleDateString("en-IN"), 30, doc.y, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
