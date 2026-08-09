import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Search, Edit2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES } from '../../mock/initialData';

export const Inventory = () => {
  const { products, updateStock, categories } = useBar();
  const activeCategories = categories && categories.length > 0 ? categories : CATEGORIES;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Excluir comidas de la gestión de inventario
  const inventoryProducts = products.filter(p => String(p.category).toLowerCase() !== 'comida');

  // Filtrado
  const filteredProducts = inventoryProducts.filter(p => {
    const matchCat = selectedCategory === 'all' || String(p.category).toLowerCase() === String(selectedCategory).toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Conteos
  const categoryCounts = activeCategories.filter(c => String(c.id).toLowerCase() !== 'comida').reduce((acc, cat) => {
    acc[cat.id] = inventoryProducts.filter(p => String(p.category).toLowerCase() === String(cat.id).toLowerCase()).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      
      {/* Barra de Búsqueda */}
      <div className="w-full max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium text-slate-700 placeholder-slate-400"
          placeholder="Buscar por nombre ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Categorías (Horizontal en móviles, Sidebar en desktop) */}
        <div className="w-full lg:w-64 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Categorías</h3>
          <div className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all' ? 'bg-slate-900 text-yellow-500 shadow-sm' : 'bg-white lg:bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200 lg:border-transparent'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
                {inventoryProducts.length}
              </span>
            </button>

            {activeCategories.filter(c => String(c.id).toLowerCase() !== 'comida').map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-between gap-2 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id ? 'bg-slate-900 text-yellow-500 shadow-sm' : 'bg-white lg:bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200 lg:border-transparent'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${selectedCategory === cat.id ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Tarjetas */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 items-start content-start">
          {filteredProducts.map(product => {
            const isLow = product.stock !== null && product.stock <= 20; // umbral de prueba
            
            return (
              <div key={product.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between h-[180px]">
                
                {/* Top Section */}
                <div className="flex justify-between items-start">
                  <span className="bg-black text-yellow-500 text-[9px] font-extrabold uppercase px-2 py-1 rounded">
                    {product.category}
                  </span>
                  {isLow && (
                    <span className="bg-red-50 text-red-600 text-[9px] font-extrabold uppercase px-2 py-1 rounded">
                      Stock Bajo
                    </span>
                  )}
                </div>

                {/* Middle Section */}
                <div className="mt-3">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-2 m-0">{product.name}</h4>
                    <span className="font-extrabold text-yellow-500 text-[15px]">C${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-snug">
                    Producto disponible en almacén principal.
                  </p>
                </div>

                {/* Bottom Section */}
                <div className="mt-auto pt-4 flex justify-between items-end">
                  <div>
                    <span className={`text-[9px] font-extrabold uppercase block mb-0.5 ${isLow ? 'text-red-600' : 'text-slate-500'}`}>
                      {isLow ? 'Crítico' : 'Disponible'}
                    </span>
                    <span className={`text-xl font-black leading-none ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                      {product.stock} <span className="text-[11px] font-bold">u.</span>
                    </span>
                  </div>
                  
                  {isLow ? (
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="bg-black text-white text-[10px] font-extrabold px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      REABASTECER
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-black text-[11px] font-extrabold flex items-center gap-1.5  cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> AJUSTAR
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal con Formik para Ajuste de Stock */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={`Ajustar Stock: ${selectedProduct.name}`}
          maxWidth="max-w-sm"
        >
          <Formik
            initialValues={{ stockToAdd: '' }}
            validate={values => {
              const errors = {};
              if (values.stockToAdd === '' || isNaN(values.stockToAdd)) {
                errors.stockToAdd = 'Debes ingresar una cantidad';
              } else {
                const newTotal = selectedProduct.stock + parseInt(values.stockToAdd, 10);
                if (newTotal < 0) {
                  errors.stockToAdd = `No puedes restar más del stock actual (Máx: -${selectedProduct.stock})`;
                }
              }
              return errors;
            }}
            onSubmit={(values) => {
              const newTotal = selectedProduct.stock + parseInt(values.stockToAdd, 10);
              updateStock(selectedProduct.id, newTotal);
              setSelectedProduct(null);
            }}
          >
            {({ isSubmitting, values }) => {
              const parsedVal = parseInt(values.stockToAdd, 10) || 0;
              const newTotal = selectedProduct.stock + parsedVal;
              
              return (
                <Form className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm flex justify-between items-center">
                    <span className="text-black font-semibold">Stock actual:</span>
                    <span className="text-xl font-black text-slate-800">{selectedProduct.stock}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Cantidad a Sumar o Restar:</label>
                    <Field
                      type="number"
                      name="stockToAdd"
                      placeholder="Ej: 10 (sumar) o -5 (restar)"
                      className="w-full p-4 border-2 border-slate-300 rounded-xl text-lg text-slate-900 bg-white font-black focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-medium placeholder:text-sm"
                    />
                    <ErrorMessage name="stockToAdd" component="div" className="text-red-500 text-[11px] mt-1.5 font-bold" />
                  </div>

                  {values.stockToAdd !== '' && !isNaN(parsedVal) && newTotal >= 0 && (
                    <div className="text-center bg-emerald-50 text-emerald-800 font-bold p-2 rounded-lg border border-emerald-200 text-sm">
                      El nuevo stock será: {newTotal}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm hover:bg-slate-300 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-black border-2 border-white text-yellow-500 font-black py-3 rounded-xl text-sm hover:bg-slate-800 cursor-pointer shadow-lg transition-colors"
                    >
                      Aplicar Ajuste
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </Modal>
      )}
    </div>
  );
};
