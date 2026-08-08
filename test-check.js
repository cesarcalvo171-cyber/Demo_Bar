import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('products').select('*').order('name', { ascending: true });
  console.log("Total products:", data.length);
  const testProducts = data.filter(p => p.name.toLowerCase().includes('test') || !p.icon_path || p.icon_path === '');
  console.log("Newly created products:", testProducts);
}
check();
