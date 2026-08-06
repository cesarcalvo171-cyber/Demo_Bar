import tona_12 from "../assets/Imagenes/tona_12.png";
import tona_lata from "../assets/Imagenes/tona_lata.png";
import tona_litro from "../assets/Imagenes/tona_litro.png";
import clasica_12 from "../assets/Imagenes/clasica_12.png";
import clasica_lata from "../assets/Imagenes/clasica_lata.png";
import clasica_litro from "../assets/Imagenes/litro_clasica.png";
import spark_triple from "../assets/Imagenes/spark_3berry.png";
import spark_rosada from "../assets/Imagenes/spark_rosada.png";
import spark_naket from "../assets/Imagenes/spark_naked.png";
import  spark_mandarina from "../assets/Imagenes/spark_mandarina.png";
import ultra_tona from "../assets/Imagenes/tona_ultra.png";
import sol from "../assets/Imagenes/sol.png";
import heineken from "../assets/Imagenes/heineken.png";
import miller from "../assets/Imagenes/miller.png";
import Smirnof from "../assets/Imagenes/smirnof_verde.png";
import SmirnoR from "../assets/Imagenes/smirnof_roja.png";
import bambu_daykiri from "../assets/Imagenes/bambo_daikiry.png";
import bambu_pina from "../assets/Imagenes/bambo_pina.png";
import granReserva from "../assets/Imagenes/granreserva.png";
import reservamedia from "../assets/Imagenes/granreserva2.png";
import ultralite from "../assets/Imagenes/ultralitro.png";
import ultralitemedio from "../assets/Imagenes/ultramedio.png";
import extraLite from "../assets/Imagenes/extralitelitro.png";
import platalitro from  "../assets/Imagenes/platalitro.png";
import platamedio from "../assets/Imagenes/platamedio.png";
import alitas6 from  "../assets/Imagenes/alitas6.png";
import alitas12 from  "../assets/Imagenes/alitas12.png";
import salichipapa from "../assets/Imagenes/salchipapa.png";
import nachos from  "../assets/Imagenes/nachos150.png";
import nachosG from  "../assets/Imagenes/nachos250.png";
import hamburguesapapa from "../assets/Imagenes/hamburguesapapa.png"; 
import hotdog from  "../assets/Imagenes/hotdog.png"; 
import hotdogpapa from  "../assets/Imagenes/hotdogpapas.png"; 
import consume from  "../assets/Imagenes/consumedepollo.png"; 
import tostonaso from "../assets/Imagenes/tostonazo.png"; 
import chubbynegra from "../assets/Imagenes/chubbynegra.png"; 
import chubbynaranja from "../assets/Imagenes/chubbynaranja.png"; 
import chubbyrojo from "../assets/Imagenes/chubbyrojo.png"; 
import chubbyfresca from "../assets/Imagenes/chubbyfresca.png"; 
import powerR from  "../assets/Imagenes/powerrojo.png";
import powerA from   "../assets/Imagenes/powerazul.png";
import gateroR from  "../assets/Imagenes/gatoraderojo.png";
import gateroA from   "../assets/Imagenes/gatoradeazul.png";
import lipton from "../assets/Imagenes/lipton.png";
import hci from "../assets/Imagenes/hci.png";
import agualitro from "../assets/Imagenes/agualitro.png";
import aguamedio from "../assets/Imagenes/aguamedio.png";
import ensap from "../assets/Imagenes/ensaplastico.png";
import ensav from "../assets/Imagenes/ensavidrio.png";
import pepsi from "../assets/Imagenes/pepsividrio.png";
import cubetazotona from  "../assets/Imagenes/cubetazo_tona.png";
import cubetazoclasica from  "../assets/Imagenes/cubetazoclasica.png";





export const CATEGORIES = [
  { id: "cervezas", name: "Cervezas", icon: "Beer" },

  { id: "licores", name: "Licores", icon: "GlassWater" },

  { id: "comida", name: "Comidas", icon: "Utensils" },
  {
    id: "Bebida sin alcohol",
    name: "Bebida sin alcohol",
    icon: "RiDrinks2Fill",
  },
   { id: "promociones", name: "promociones", icon: "MdLocalOffer" },

];

export const INITIAL_PRODUCTS = [
  // CERVEZAS (Con control de inventario)
  {
    id: 1,
    name: "TOÑA 12 ONZA",
    category: "cervezas",
    price: 65,
    stock: 120,
    image: tona_12,
  },
  {
    id: 2,
    name: "TOÑA LATA PEQUEÑA",
    category: "cervezas",
    price: 65,
    stock: 90,
    image: tona_lata,
  },
  {
    id: 3,
    name: "TOÑA LITRO",
    category: "cervezas",
    price: 65,
    stock: 100,
    image: tona_litro,
  },
  {
    id: 4,
    name: "CLASICA 12 ONZA",
    category: "cervezas",
    price: 70,
    stock: 80,
    image: clasica_12,
  },
  {
    id: 5,
    name: "CLASICA LATA PEQUEÑA",
    category: "cervezas",
    price: 95,
    stock: 60,
    image: clasica_lata,
  },
  {
    id: 6,
    name: "CLASICA LITRO",
    category: "cervezas",
    price: 95,
    stock: 50,
    image: clasica_litro,
  },
  {
    id: 7,
    name: "SPARK TRIPLE BERRY",
    category: "cervezas",
    price: 110,
    stock: 45,
    image: spark_triple,
  },
  {
    id: 8,
    name: "SPARK ROSADA",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: spark_rosada,
  },
  {
    id: 9,
    name: "SPARK NAKET",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: spark_naket,
  },
  {
    id: 10,
    name: "SPARK MANDARINA",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: spark_mandarina,
  },
  {
    id: 11,
    name: "ULTRA TOÑA",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: ultra_tona,
  },
  {
    id: 12,
    name: "SOL",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: sol,
  },
  {
    id: 13,
    name: "HEINEKEN ",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: heineken,  
  
  },
  {
    id: 14,
    name: "MILLER",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: miller,
     
  },
  {
    id: 15,
    name: "SMIRNOF VERDE",
    category: "cervezas",
    price: 95,
    stock: 40,
    image:Smirnof,
      
  },
  {
    id: 16,
    name: "SMIRNOF ROJA",
    category: "cervezas",
    price: 95,
    stock: 40,
    image:
      SmirnoR,
  },
  {
    id: 17,
    name: "BAMBU DAYKIRI",
    category: "cervezas",
    price: 95,
    stock: 40,
    image: bambu_daykiri,
    
  },

  {
    id: 18,
    name: "BAMBU PIÑA",
    category: "cervezas",
    price: 95,
    stock: 40,
    image:
      bambu_pina,
  },

  // LICORES (Con control de inventario - precio por trago)
  {
    id: 19,
    name: "RESERVA LITRO ",
    category: "licores",
    price: 130,
    stock: 30,
    image: granReserva,
  },
  {
    id: 20,
    name: "RESERVA MEDIA ",
    category: "licores",
    price: 190,
    stock: 20,
    image: reservamedia,
  },
  {
    id: 21,
    name: "EXTRA LITE LITRO",
    category: "licores",
    price: 180,
    stock: 25,
    image:
     extraLite,
  },
  {
    id: 22,
    name: "ULTRA LITRO ",
    category: "licores",
    price: 260,
    stock: 15,
    image:
      ultralite,
  },
  {
    id: 23,
    name: "ULTRA MEDIA ",
    category: "licores",
    price: 280,
    stock: 12,
    image:
   ultralitemedio,
  },
  {
    id: 24,
    name: "PLATA LITRO ",
    category: "licores",
    price: 300,
    stock: 10,
    image:
     platalitro
  },
  {
    id: 25,
    name: "PLATA MEDIA",
    category: "licores",
    price: 220,
    stock: 18,
    image:
      platamedio
  },
 

  // COMIDAS (Sin control de inventario / stock: null)
  {
    id: 26,
    name: "ALITAS DE 6",
    category: "comida",
    price: 320,
    stock: null,
    image:
    alitas6
  },
  {
    id: 27,
    name: "ALITAS DE 12",
    category: "comida",
    price: 280,
    stock: null,
    image:
      alitas12
  },
  {
    id: 28,
    name: "SALCHIPAPA",
    category: "comida",
    price: 350,
    stock: null,
    image:
     salichipapa
  },
  {
    id: 29,
    name: "NACHOS",
    category: "comida",
    price: 130,
    stock: null,
    image:
     nachos
  },
  {
    id: 30,
    name: "HAMBURGUESA CON PAPAS",
    category: "comida",
    price: 190,
    stock: null,
    image:
      hamburguesapapa
  },
  {
    id: 31,
    name: "HOT DOG SIN PAPAS",
    category: "comida",
    price: 120,
    stock: null,
    image:
      hotdog
  },
  {
    id: 32,
    name: "HOT DOG CON PAPAS",
    category: "comida",
    price: 220,
    stock: null,
    image:
      hotdogpapa
  },
  {
    id: 33,
    name: "CONSUME DE POLLO",
    category: "comida",
    price: 260,
    stock: null,
    image:
      consume
  },
  {
    id: 34,
    name: "TOSTONASO LOCO",
    category: "comida",
    price: 300,
    stock: null,
    image:
      tostonaso,
  },
  
  // Bebidas sin alchol (Con control de inventario)
  {
    id: 35,
    name: "CHOVI NEGRA ",
    category: "Bebida sin alcohol",
    price: 210,
    stock: 50,
    image:
      chubbynegra,
  },
  {
    id: 36,
    name: "CHOVI ROJA ",
    category: "Bebida sin alcohol",
    price: 180,
    stock: 60,
    image:
      chubbyrojo,
  },
  {
    id: 37,
    name: "CHOVI NARANJA ",
    category: "Bebida sin alcohol",
    price: 220,
    stock: 40,
    image:
     chubbynaranja,
  },
  {
    id: 38,
    name: "CHOVI FRESCA ",
    category: "Bebida sin alcohol",
    price: 240,
    stock: 45,
    image:
     chubbyfresca
  },
  {
    id: 39,
    name: "POWER ROJO ",
    category: "Bebida sin alcohol",
    price: 210,
    stock: 35,
    image:
      powerR
  },
  {
    id: 40,
    name: "POWER AZÚL ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 40,
    image:
     powerA
  },
  {
    id: 41,
    name: "GATORADE ROJO",
    category: "Bebida sin alcohol",
    price: 240,
    stock: 30,
    image:
     gateroR
  },
  {
    id: 42,
    name: "GATORADE AZÚL ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
      gateroA
  },
  {
    id: 43,
    name: "LIPTON LIMON",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
     lipton
  },
  {
    id: 44,
    name: "HICT MANZANA ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
      hci
  },

  {
    id: 45,
    name: "AGUA LITRO  ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
      agualitro
  },
  {
    id: 46,
    name: "AGUA MEDIO LITRO  ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
      aguamedio
  },
  {
    id: 47,
    name: "ENSA PLASTICO  ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
     ensap
  },
  {
    id: 48,
    name: "ENSA VIDRIO ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
      ensav
  },
  {
    id: 49,
    name: "PEPSI VIDRIO ",
    category: "Bebida sin alcohol",
    price: 250,
    stock: 25,
    image:
     pepsi
  },
   {
    id: 50,
    name: "NACHOS GRANDE",
   category: "comida",
    price: 250,
    stock: null,
    image:
     nachosG
  },
   {
    id: 51,
    name: "CUBETAZO TOÑA",
   category: "promociones",
    price: 250,
    stock: null,
    bundleItems: [{ productId: 1, quantity: 6 }],
    image:
     cubetazotona
  },
  {
    id: 52,
    name: "CUBETAZO clasica",
   category: "promociones",
    price: 250,
    stock: null,
    bundleItems: [{ productId: 4, quantity: 6 }],
    image:
     cubetazoclasica
  },
  
];

// Generar 10 mesas iniciales
export const INITIAL_TABLES = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: `Mesa ${index + 1}`,
  status: "libre",
  customerName: "",
  items: [],
  createdAt: null,
}));
