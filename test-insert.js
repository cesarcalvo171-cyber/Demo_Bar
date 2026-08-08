import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert into products table...");
  const { data, error } = await supabase.from('products').insert({
    name: 'Cerveza Test ' + Date.now(),
    category_id: 'cervezas',
    price: 150,
    cost: 50,
    stock: 100,
    icon_path: null
  });

  if (error) {
    console.error("ERROR INSERTING:", error);
  } else {
    console.log("SUCCESSFULLY INSERTED. Fetching products to confirm...");
    const { data: fetch, error: fetchErr } = await supabase.from('products').select('*').order('name', { ascending: false }).limit(3);
    console.log(fetch);
  }
}

testInsert();
