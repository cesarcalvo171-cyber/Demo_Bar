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
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Botones de Categorías Dinámicas */}
      {search.trim() === "" && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-200 pt-1">
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900"
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
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 overflow-y-auto flex-1 min-h-0 touch-pan-y pr-2 custom-scrollbar pb-6 p-1"
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
              className={`rounded-2xl border text-left transition-all flex flex-col overflow-hidden relative h-full min-h-[250px] shadow-xs hover:shadow-md ${
                isOutOfStock
                  ? "bg-red-50 border-red-200 opacity-60 cursor-not-allowed"
                  : "bg-white border-slate-200 hover:border-blue-400 cursor-pointer"
              }`}
            >
              {/* Imagen y Precio */}
              <div className="relative h-[130px] md:h-[150px] w-full shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-200"
                  />
                )}
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-xs font-black tracking-wide shadow-sm">
                  C${Number(product.price || 0).toFixed(2)}
                </div>
              </div>

              {/* Información y Acción */}
              <div className="p-3 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {hasStock ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          product.stock < 10
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Preparado
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    className={`w-full text-xs font-bold px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      isOutOfStock
                        ? "bg-slate-200 text-slate-400"
                        : qty > 0
                        ? "bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
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
