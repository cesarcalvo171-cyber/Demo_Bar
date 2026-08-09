import React from "react";
import { useBar } from "../../context/BarContext";
import {
  Utensils,
  Coffee,
  Beer,
  Wine,
  GlassWater,
  Plus,
  Check,
} from "lucide-react";
import { RiDrinks2Fill } from "react-icons/ri";
import { CATEGORIES } from "../../mock/initialData";
import { MdLocalOffer } from "react-icons/md";

export const ProductCatalog = ({
  selectedCategory,
  setSelectedCategory,
  onSelectProduct,
  currentOrderItems,
  search,
}) => {
  const { products, categories } = useBar();
  const activeCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  const normalize = (text = "") =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "todos" ||
      String(product.category).toLowerCase() === String(selectedCategory).toLowerCase();

    const matchesSearch = normalize(product.name).includes(normalize(search));

    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "Utensils":
        return <Utensils className="w-4 h-4" />;
      case "Coffee":
        return <Coffee className="w-4 h-4" />;
      case "Beer":
        return <Beer className="w-4 h-4" />;
      case "GlassWater":
        return <GlassWater className="w-4 h-4" />;
      case "RiDrinks2Fill":
        return <RiDrinks2Fill className="w-4 h-4" />;
      case "MdLocalOffer":
        return <MdLocalOffer className="w-4 h-4" />;
      default:
        return <MdLocalOffer className="w-4 h-4" />;
    }
  };

  const getItemQuantity = (productId) => {
    const item = currentOrderItems.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#1a1d27]">
      {/* Botones de Categorías Dinámicas */}
      {search.trim() === "" && (
        <div className="flex flex-wrap gap-2.5 mb-5 pb-4 border-b border-slate-700/50 pt-2">
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs md:text-sm transition-colors cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-orange-300 text-[#1a1d24] border-orange-300 shadow-sm"
                  : "bg-[#222533] text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {getCategoryIcon(cat.icon)}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Productos de la Categoría */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 min-h-0 touch-pan-y pr-2 custom-scrollbar pb-4 p-4 lg:p-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {filteredProducts.map((product) => {
          const qty = getItemQuantity(product.id);
          const hasStock = product.stock !== null;
          const isOutOfStock = hasStock && product.stock <= 0;

          return (
            <div
              key={product.id}
              onClick={() => !isOutOfStock && onSelectProduct(product)}
              className={`rounded-xl border text-left transition-all flex flex-col overflow-hidden relative h-full min-h-[260px] ${
                isOutOfStock
                  ? "bg-red-900/50 border-red-900/50 opacity-60 cursor-not-allowed"
                  : "bg-[#191c25] border-slate-700/50 hover:border-slate-600 cursor-pointer shadow-sm"
              }`}
            >
              {/* Imagen y Precio */}
              <div className="relative h-[130px] md:h-[160px] w-full shrink-0 bg-[#222533]">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 bg-[#1a1d27]/80 backdrop-blur-md text-orange-200 px-2 py-0.5 rounded text-xs font-bold tracking-wide border border-slate-600/50">
                  C${product.price.toFixed(2)}
                </div>
              </div>

              {/* Información y Acción */}
              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100 text-[13px] leading-tight line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {hasStock ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          product.stock < 10
                            ? "bg-orange-900/40 text-orange-400"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-sm font-bold bg-[#183a31] text-[#4ade80] border border-[#166534]">
                        Preparado
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    disabled={isOutOfStock}
                    className={`w-full text-xs font-semibold px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                      isOutOfStock
                        ? "bg-slate-800 text-slate-500"
                        : "bg-[#2a2e40] text-slate-200 hover:bg-[#34394f]"
                    }`}
                  >
                    {qty > 0 ? (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Agregar ({qty})
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
