import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = [
  { id: "cervezas", name: "Cervezas", icon: "Beer" },
  { id: "licores", name: "Licores", icon: "GlassWater" },
  { id: "comida", name: "Comidas", icon: "Utensils" },
  { id: "Bebida sin alcohol", name: "Bebida sin alcohol", icon: "RiDrinks2Fill" },
  { id: "promociones", name: "promociones", icon: "MdLocalOffer" }
];

// Recreamos los usuarios iniciales
const USERS = [
  { name: 'Administrador Principal', username: 'admin', password_hash: '123456', role: 'admin', is_active: true },
  { name: 'Mesero 1', username: 'mesero1', password_hash: '123456', role: 'mesero', is_active: true },
];

async function seed() {
  console.log("Iniciando Seed de la base de datos...");
  
  // 1. Settings (Tasa de cambio)
  console.log("Insertando Settings...");
  await supabase.from('settings').upsert({ key: 'exchange_rate', value: 36.62 }, { onConflict: 'key' });

  // 2. Usuarios
  console.log("Insertando Usuarios...");
  for (const user of USERS) {
    const { data, error } = await supabase.from('users').select('username').eq('username', user.username);
    if (data.length === 0) {
      await supabase.from('users').insert(user);
    }
  }

  // 3. Categorías
  console.log("Insertando Categorías...");
  for (const cat of CATEGORIES) {
    await supabase.from('categories').upsert(cat, { onConflict: 'id' });
  }

  console.log("Seed completado. (Los productos los insertaremos desde la interfaz o en una pasada manual futura, pero con esto ya arranca la app)");
}

seed().catch(console.error);
