import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log("Subscribing to Realtime changes on 'tables' and 'orders'...");

const channel = supabase.channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
    console.log("🔔 REALTIME EVENT ON TABLES:", payload);
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    console.log("🔔 REALTIME EVENT ON ORDERS:", payload);
  })
  .subscribe((status) => {
    console.log("Subscription status:", status);
    if (status === 'SUBSCRIBED') {
      console.log("Successfully connected. I will now trigger a manual update to test...");
      // trigger an update on table 1 to test
      setTimeout(async () => {
         console.log("Triggering update on id 1...");
         const { data, error } = await supabase.from('tables').update({ status: 'ocupada' }).eq('id', '1').select();
         console.log("Update sent to DB.", data, error);
      }, 2000);
    }
  });

// Keep process alive for 10 seconds
setTimeout(() => {
  console.log("Test finished.");
  process.exit(0);
}, 10000);
