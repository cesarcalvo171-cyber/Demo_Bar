import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: invData } = await supabase.from("invoices").select("*");
  const { data: invItemsData } = await supabase.from("invoice_items").select("*");
  const { data: productsData } = await supabase.from("products").select("*");

  let totalSales = 0;
  let totalCost = 0;

  (invData || []).forEach(inv => {
    totalSales += Number(inv.total || 0);
    const items = (invItemsData || []).filter(i => i.invoice_id === inv.id);
    items.forEach(item => {
      let cost = Number(item.cost_at_sale || 0);
      if (!cost) {
        const p = productsData.find(prod => prod.name.trim().toLowerCase() === (item.product_name || '').trim().toLowerCase());
        cost = Number(p?.cost || 0);
      }
      totalCost += cost * Number(item.quantity || 1);
    });
  });

  console.log("Total Ventas in DB:", totalSales);
  console.log("Calculated Total COGS (Costos):", totalCost);
  console.log("Calculated Gross Profit (Ganancia Bruta):", totalSales - totalCost);
}
check();
