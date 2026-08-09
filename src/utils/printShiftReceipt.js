import { INITIAL_PRODUCTS } from "../mock/initialData";

/**
 * Genera e imprime el ticket térmico de Cierre de Caja (Corte Z)
 */
export const printShiftCloseReceipt = ({
  invoices = [],
  cashierName = "Cajero Principal",
  startTime = null,
  endTime = new Date(),
  products = [],
  categories = [],
  shiftId = "",
}) => {
  const totalInvoicesCount = invoices.length;
  const totalCash = invoices
    .filter((i) => i.paymentMethod === "Efectivo")
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCard = invoices
    .filter((i) => i.paymentMethod !== "Efectivo")
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalSales = totalCash + totalCard;

  const now = endTime ? new Date(endTime) : new Date();
  const dateStr = now.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Resolver nombre de categoría exacto sin comodín General
  const resolveCategoryName = (prodName, itemCategory) => {
    const cleanName = (prodName || "").trim().toLowerCase();

    const matchedProd =
      (products || []).find((p) => p.name?.trim().toLowerCase() === cleanName) ||
      (INITIAL_PRODUCTS || []).find((p) => p.name?.trim().toLowerCase() === cleanName);

    let rawCat = matchedProd?.category || itemCategory;

    if (!rawCat || rawCat.toLowerCase() === "general") {
      if (
        cleanName.includes("toña") ||
        cleanName.includes("clasica") ||
        cleanName.includes("spark") ||
        cleanName.includes("heineken") ||
        cleanName.includes("miller") ||
        cleanName.includes("sol") ||
        cleanName.includes("bambu") ||
        cleanName.includes("smirnof") ||
        cleanName.includes("corona")
      ) {
        rawCat = "cervezas";
      } else if (
        cleanName.includes("nachos") ||
        cleanName.includes("alitas") ||
        cleanName.includes("salchipapa") ||
        cleanName.includes("hamburguesa") ||
        cleanName.includes("hot dog") ||
        cleanName.includes("consume") ||
        cleanName.includes("toston")
      ) {
        rawCat = "comida";
      } else if (
        cleanName.includes("reserva") ||
        cleanName.includes("lite") ||
        cleanName.includes("plata") ||
        cleanName.includes("ron") ||
        cleanName.includes("licor") ||
        cleanName.includes("vodka") ||
        cleanName.includes("whisky")
      ) {
        rawCat = "licores";
      } else if (
        cleanName.includes("chovi") ||
        cleanName.includes("chubby") ||
        cleanName.includes("gatorade") ||
        cleanName.includes("power") ||
        cleanName.includes("agua") ||
        cleanName.includes("pepsi") ||
        cleanName.includes("ensa") ||
        cleanName.includes("lipton")
      ) {
        rawCat = "Bebida sin alcohol";
      } else if (cleanName.includes("cubetazo") || cleanName.includes("promo")) {
        rawCat = "promociones";
      } else {
        rawCat = "General";
      }
    }

    const catObj = (categories || []).find(
      (c) => c.id?.toLowerCase() === rawCat.toLowerCase() || c.name?.toLowerCase() === rawCat.toLowerCase()
    );

    const baseName = catObj?.name || rawCat;
    const lower = baseName.toLowerCase();

    if (lower === "comida" || lower === "comidas") return "COMIDAS";
    if (lower === "cervezas" || lower === "cerveza") return "CERVEZAS";
    if (lower === "licores" || lower === "licor") return "LICORES";
    if (lower.includes("bebida")) return "BEBIDAS SIN ALCOHOL";
    if (lower === "chiveria" || lower === "chivería") return "CHIVERÍA";
    if (lower === "promociones") return "PROMOCIONES";
    return baseName.toUpperCase();
  };

  // Función para obtener unidades físicas reales (ej. 1 Cubetazo = 6 cervezas)
  const getPhysicalUnits = (prodName, qty, matchedProd) => {
    const cleanName = (prodName || "").toLowerCase();
    const numQty = Number(qty) || 1;

    if (matchedProd?.bundleItems && Array.isArray(matchedProd.bundleItems) && matchedProd.bundleItems.length > 0) {
      const totalInBundle = matchedProd.bundleItems.reduce((s, b) => s + (Number(b.quantity) || 1), 0);
      return numQty * totalInBundle;
    }

    if (cleanName.includes("cubetazo") || cleanName.includes("cubetazo toña") || cleanName.includes("cubetazo clasica") || cleanName.includes("cubetazo tona")) {
      return numQty * 6;
    }

    return numQty;
  };

  // 1. Agrupar productos vendidos y calcular totales por categoría y por producto
  const categorySummaryMap = {};
  const productAuditMap = {};

  (invoices || []).forEach((inv) => {
    (inv.items || []).forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const totalItem = price * qty;
      const prodName = (item.name || "Producto").trim();
      const catDisplayName = resolveCategoryName(prodName, item.category);

      // Encontrar producto en el catálogo
      const matchedProd =
        (products || []).find((p) => p.name?.trim().toLowerCase() === prodName.toLowerCase()) ||
        (INITIAL_PRODUCTS || []).find((p) => p.name?.trim().toLowerCase() === prodName.toLowerCase());

      const physicalUnits = getPhysicalUnits(prodName, qty, matchedProd);

      // Acumular por categoría
      if (!categorySummaryMap[catDisplayName]) {
        categorySummaryMap[catDisplayName] = {
          name: catDisplayName,
          totalAmount: 0,
          totalUnits: 0,
        };
      }
      categorySummaryMap[catDisplayName].totalAmount += totalItem;
      categorySummaryMap[catDisplayName].totalUnits += physicalUnits;

      // Calcular stock para la auditoría (incluyendo promociones/cubetazos)
      let stockDisplay = "Cocina";
      let displayName = prodName;

      if (prodName.toLowerCase().includes("cubetazo toña") || prodName.toLowerCase().includes("cubetazo tona")) {
        displayName = "CUBETAZO TOÑA (x6 bot.)";
        const tonaProd = (products || []).find(p => p.name?.toLowerCase().includes("toña 12") || p.id === 1);
        stockDisplay = tonaProd && tonaProd.stock !== null ? `${tonaProd.stock} Toña` : "110 Toña";
      } else if (prodName.toLowerCase().includes("cubetazo clasica")) {
        displayName = "CUBETAZO CLASICA (x6 bot.)";
        const clasicaProd = (products || []).find(p => p.name?.toLowerCase().includes("clasica 12") || p.id === 4);
        stockDisplay = clasicaProd && clasicaProd.stock !== null ? `${clasicaProd.stock} Clásica` : "6 Clásicas";
      } else if (matchedProd && matchedProd.stock !== null && matchedProd.category !== "comida") {
        stockDisplay = `${matchedProd.stock} unid.`;
      }

      // Acumular por producto
      if (!productAuditMap[displayName]) {
        productAuditMap[displayName] = {
          name: displayName,
          category: catDisplayName,
          quantitySold: 0,
          currentStock: stockDisplay,
        };
      }
      productAuditMap[displayName].quantitySold += physicalUnits;
      productAuditMap[displayName].currentStock = stockDisplay;
    });
  });

  const categoriesList = Object.values(categorySummaryMap).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
  const productsList = Object.values(productAuditMap).sort(
    (a, b) => b.quantitySold - a.quantitySold
  );

  // 2. Generar el contenido HTML para la impresora térmica
  const printContent = `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="font-size: 16px; font-weight: bold; letter-spacing: 1px;">MONCHOS BAR</div>
      <div style="font-size: 11px; font-weight: bold; margin-top: 2px; text-transform: uppercase;">
        CIERRE DE CAJA (CORTE Z)
      </div>
      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
      <div style="font-size: 11px; text-align: left; line-height: 1.4;">
        <div><strong>Fecha:</strong> ${dateStr}</div>
        <div><strong>Hora:</strong> ${timeStr}</div>
        <div><strong>Cajero:</strong> ${cashierName}</div>
        ${shiftId ? `<div><strong>Turno ID:</strong> <span style="font-size: 9px;">${shiftId.slice(-8)}</span></div>` : ""}
      </div>
    </div>

    <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
    <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">RESUMEN DE VENTAS</div>
    <div style="font-size: 11px; line-height: 1.5;">
      <div style="display: flex; justify-content: space-between;">
        <span>Facturas Emitidas:</span>
        <strong>${totalInvoicesCount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Total Efectivo:</span>
        <strong>C$${totalCash.toFixed(2)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Total Tarjeta / Transf:</span>
        <strong>C$${totalCard.toFixed(2)}</strong>
      </div>
      <div style="border-top: 1px solid #000; margin: 4px 0;"></div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
        <span>TOTAL VENTAS:</span>
        <span>C$${totalSales.toFixed(2)}</span>
      </div>
    </div>

    <div style="border-top: 1px dashed #000; margin: 10px 0 6px;"></div>
    <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">TOTALES POR CATEGORÍA</div>
    <div style="font-size: 11px; line-height: 1.4;">
      ${
        categoriesList.length === 0
          ? `<div style="font-style: italic; color: #666;">Sin ventas registradas</div>`
          : categoriesList
              .map(
                (cat) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>• ${cat.name} (${cat.totalUnits} unid):</span>
          <strong>C$${cat.totalAmount.toFixed(2)}</strong>
        </div>`
              )
              .join("")
      }
    </div>

    <div style="border-top: 1px dashed #000; margin: 10px 0 6px;"></div>
    <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">
      AUDITORÍA DE INVENTARIO
      <div style="font-size: 9px; font-weight: normal; color: #444;">(Vendido en Turno vs Stock Restante)</div>
    </div>
    <table style="width: 100%; font-size: 10px; border-collapse: collapse; text-align: left;">
      <thead>
        <tr style="border-bottom: 1px solid #000;">
          <th style="padding: 2px 0;">PRODUCTO</th>
          <th style="padding: 2px 0; text-align: center; width: 40px;">VEND.</th>
          <th style="padding: 2px 0; text-align: right; width: 60px;">STOCK</th>
        </tr>
      </thead>
      <tbody>
        ${
          productsList.length === 0
            ? `<tr><td colspan="3" style="text-align: center; padding: 4px;">Sin productos vendidos</td></tr>`
            : productsList
                .map(
                  (p) => `
          <tr style="border-bottom: 1px dotted #ccc;">
            <td style="padding: 3px 0; font-weight: 500;">${p.name}</td>
            <td style="padding: 3px 0; text-align: center; font-weight: bold;">${p.quantitySold}</td>
            <td style="padding: 3px 0; text-align: right; font-weight: bold;">${p.currentStock}</td>
          </tr>`
                )
                .join("")
        }
      </tbody>
    </table>

    <div style="border-top: 1px dashed #000; margin: 14px 0 10px;"></div>
    <div style="text-align: center; font-size: 10px; line-height: 1.5; color: #222;">
      <div style="font-weight: bold;">*** FIN DE CORTE Z ***</div>
      <div style="margin-top: 22px; border-top: 1px solid #444; width: 70%; margin-left: auto; margin-right: auto; padding-top: 2px;">
        Firma Responsable
      </div>
    </div>
  `;

  // 3. Abrir ventana de impresión térmica
  const printWindow = window.open("", "_blank", "width=420,height=680");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Cierre de Caja - Corte Z</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
              padding: 14px;
              width: 300px;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
