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
  const { products } = useBar();

  const normalize = (text = "") =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "todos" || product.category === selectedCategory;

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
        return <Utensils className="w-4 h-4" />;
    }
  };

  const getItemQuantity = (productId) => {
    const item = currentOrderItems.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Botones de Categorías */}
      {search.trim() === "" && (
        <div className="flex flex-wrap gap-2.5 mb-5 pb-4 border-b border-slate-200 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs md:text-sm transition-colors cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {getCategoryIcon(cat.icon)}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Productos de la Categoría */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-4">
        {filteredProducts.map((product) => {
          const qty = getItemQuantity(product.id);
          const hasStock = product.stock !== null;
          const isOutOfStock = hasStock && product.stock <= 0;

          return (
            <div
              key={product.id}
              onClick={() => !isOutOfStock && onSelectProduct(product)}
              className={`rounded-xl border text-left transition-all flex flex-col overflow-hidden relative h-48 sm:h-56 ${
                isOutOfStock
                  ? "bg-red-50 border-red-200 opacity-60 cursor-not-allowed"
                  : "bg-white border-slate-200 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-md"
              }`}
            >
              {/* Imagen y Precio */}
              <div className="relative h-[160px] w-full shrink-0 bg-[#222533]">
              <div className="relative h-[160px] w-full shrink-0 bg-slate-100">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm z-10">
                  C${product.price.toFixed(2)}
                </div>
              </div>

              {/* Información y Acción */}
              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-[13px] leading-tight line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {hasStock ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          product.stock < 10
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
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
                        ? "bg-slate-100 text-slate-400"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
