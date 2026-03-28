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
      const doc = new PDFDocument({ size: "A4", margin: 30 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header with shop info (left) and title (right)
      doc.fontSize(10).font("Helvetica-Bold").text(data.shopName || "Patel Electricals", 40, 40);
      doc.fontSize(8).font("Helvetica").text(data.shopPhone || "8780657095", 40, 52);
      doc.text(data.shopEmail || "burhanghiya26@gmail.com", 40, 62);

      // Title on right
      doc.fontSize(24).font("Helvetica-Bold").text("SHIPPING LABEL", 350, 45, { align: "right" });
      doc.fontSize(11).font("Helvetica").text(`Order #${data.orderNumber}`, 350, 75, { align: "right" });

      doc.moveDown(3);

      // Address Box
      const boxX = 40;
      const boxY = doc.y;
      const boxWidth = 515;
      const boxHeight = 130;

      doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

      // SHIP TO header
      doc.fontSize(12).font("Helvetica-Bold").text("SHIP TO:", boxX + 12, boxY + 12);

      // Address lines with proper spacing
      let addressY = boxY + 35;
      doc.fontSize(11).font("Helvetica-Bold").text(data.customerName, boxX + 12, addressY);

      addressY += 20;
      doc.fontSize(10).font("Helvetica").text(data.shippingAddress, boxX + 12, addressY);

      addressY += 18;
      const cityLine = `${data.shippingCity}, ${data.shippingState} ${data.shippingZip}`;
      doc.text(cityLine, boxX + 12, addressY);

      addressY += 18;
      doc.text(`Phone: ${data.customerPhone}`, boxX + 12, addressY);

      doc.moveDown(8);

      // Order Details Section
      doc.fontSize(12).font("Helvetica-Bold").text("ORDER DETAILS", 40, doc.y);
      doc.moveDown(0.8);

      // Table Header
      const tableY = doc.y;
      const col1X = 40;
      const col2X = 280;
      const col3X = 420;
      const col4X = 480;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Item", col1X, tableY);
      doc.text("Part #", col2X, tableY);
      doc.text("Qty", col3X, tableY);
      doc.text("Amount", col4X, tableY);

      // Separator line
      doc.moveTo(40, tableY + 18).lineTo(555, tableY + 18).stroke();

      // Items
      let itemY = tableY + 25;
      doc.fontSize(9).font("Helvetica");

      data.items.forEach((item) => {
        doc.text(item.name.substring(0, 35), col1X, itemY);
        doc.text(item.partNumber || "-", col2X, itemY);
        doc.text(item.quantity.toString(), col3X, itemY);
        itemY += 18;
      });

      // Total line
      doc.moveTo(40, itemY).lineTo(555, itemY).stroke();
      itemY += 12;

      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("TOTAL AMOUNT:", col1X, itemY);
      doc.text(`₹${data.totalAmount}`, col4X, itemY);

      doc.moveDown(4);

      // Footer
      doc.fontSize(8).font("Helvetica").text("Please keep this label safe. Do not fold or damage.", 40, doc.y, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 40, doc.y, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
