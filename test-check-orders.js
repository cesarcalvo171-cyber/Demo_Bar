import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: categories, error } = await supabase.from('categories').select('*');
  console.log("Categories in Supabase:", categories);
  console.log("Error if any:", error);
  const { data: products } = await supabase.from('products').select('id, name, category_id');
  const distinctCategories = [...new Set(products?.map(p => p.category_id))];
  console.log("Distinct product category_ids:", distinctCategories);
}
check();
