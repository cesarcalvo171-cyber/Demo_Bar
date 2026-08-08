import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testStorage() {
  console.log("Checking buckets...");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) console.error("Error listing buckets:", bErr);
  else console.log("Buckets:", buckets.map(b => b.name));

  console.log("Attempting to upload a dummy file...");
  const blob = new Blob(['hello world'], { type: 'text/plain' });
  const file = new File([blob], 'hello.txt', { type: 'text/plain' });
  
  const { data, error } = await supabase.storage
      .from('products')
      .upload(`product_images/test_${Date.now()}.txt`, file);

  if (error) {
    console.error("UPLOAD ERROR:", error.message);
  } else {
    console.log("UPLOAD SUCCESS:", data);
  }
}
testStorage();
