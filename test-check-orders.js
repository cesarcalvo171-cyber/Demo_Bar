import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: tables } = await supabase.from('tables').select('*');
  console.log("Orders count:", orders?.length);
  console.log("Tables count:", tables?.length);
  console.log("Occupied tables:", tables?.filter(t => t.status === 'ocupada'));
  console.log("All orders:", orders);
}
check();
