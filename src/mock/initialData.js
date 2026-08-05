export const CATEGORIES = [
 
  { id: 'cervezas', name: 'Cervezas', icon: 'Beer' },
  // { id: 'cocteles', name: 'Cócteles', icon: 'Wine' },
  { id: 'licores', name: 'Licores', icon: 'GlassWater' },
  { id: 'comida', name: 'Comidas', icon: 'Utensils' },
];

export const INITIAL_PRODUCTS = [
  
  // CERVEZAS (Con control de inventario)
  { id: 11, name: 'Toña', category: 'cervezas', price: 65, stock: 120, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 12, name: 'Toña Light', category: 'cervezas', price: 65, stock: 90, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 13, name: 'Victoria Clásica', category: 'cervezas', price: 65, stock: 100, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 14, name: 'Victoria Frost', category: 'cervezas', price: 70, stock: 80, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 15, name: 'Heineken', category: 'cervezas', price: 95, stock: 60, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 16, name: 'Corona Extra', category: 'cervezas', price: 100, stock: 50, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 17, name: 'Modelo Especial', category: 'cervezas', price: 110, stock: 45, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },
  { id: 18, name: 'Budweiser', category: 'cervezas', price: 95, stock: 40, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80' },

  // CÓCTELES (Con control de inventario)
 // { id: 19, name: 'Mojito', category: 'cocteles', price: 210, stock: 50, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
   //{ id: 20, name: 'Cuba Libre', category: 'cocteles', price: 180, stock: 60, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
  // { id: 21, name: 'Piña Colada', category: 'cocteles', price: 220, stock: 40, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
  // { id: 22, name: 'Margarita', category: 'cocteles', price: 240, stock: 45, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
   //{ id: 23, name: 'Daiquirí', category: 'cocteles', price: 210, stock: 35, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
   //{ id: 24, name: 'Gin Tonic', category: 'cocteles', price: 250, stock: 40, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
  // { id: 25, name: 'Tequila Sunrise', category: 'cocteles', price: 240, stock: 30, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
  // { id: 26, name: 'Long Island Iced Tea', category: 'cocteles', price: 300, stock: 25, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },

  // LICORES (Con control de inventario - precio por trago)
  { id: 27, name: 'Flor de Caña 7 Años', category: 'licores', price: 130, stock: 30, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 28, name: 'Flor de Caña 12 Años', category: 'licores', price: 190, stock: 20, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 29, name: 'Johnnie Walker Red Label', category: 'licores', price: 180, stock: 25, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 30, name: 'Johnnie Walker Black Label', category: 'licores', price: 260, stock: 15, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 31, name: 'Old Parr 12', category: 'licores', price: 280, stock: 12, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 32, name: "Buchanan's 12", category: 'licores', price: 300, stock: 10, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 33, name: "Jack Daniel's", category: 'licores', price: 220, stock: 18, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 34, name: 'Smirnoff Vodka', category: 'licores', price: 150, stock: 25, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 35, name: 'José Cuervo Especial', category: 'licores', price: 170, stock: 22, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  { id: 36, name: 'Tanqueray Gin', category: 'licores', price: 230, stock: 15, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80' },
  
  // COMIDAS (Sin control de inventario / stock: null)
  { id: 1, name: 'Cóctel de Camarón', category: 'comida', price: 320, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 2, name: 'Cóctel de Conchas', category: 'comida', price: 280, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 3, name: 'Cóctel Mixto', category: 'comida', price: 350, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 4, name: 'Tostones con Queso', category: 'comida', price: 130, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 5, name: 'Tostones con Carne', category: 'comida', price: 190, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 6, name: 'Enchiladitas con Frijoles Licuados', category: 'comida', price: 120, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 7, name: 'Nachos', category: 'comida', price: 220, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 8, name: 'Chicharrón con Yuca', category: 'comida', price: 260, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 9, name: 'Carne Asada con Gallo Pinto', category: 'comida', price: 300, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  { id: 10, name: 'Alitas BBQ', category: 'comida', price: 250, stock: null, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },

];

// Generar 10 mesas iniciales
export const INITIAL_TABLES = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: `Mesa ${index + 1}`,
  status: 'libre',
  customerName: '',
  items: [],
  createdAt: null
}));
