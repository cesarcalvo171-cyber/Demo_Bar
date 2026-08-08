import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('products').select('*');
  if (data) {
    const recent = data.slice(-5);
    console.log(recent);
  } else {
    console.log("No data");
  }
}
check();
