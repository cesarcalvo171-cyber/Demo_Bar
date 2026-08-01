import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Search, Edit2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES } from '../../mock/initialData';

export const Inventory = () => {
  const { products, updateStock } = useBar();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Excluir comidas de la gestión de inventario
  const inventoryProducts = products.filter(p => p.category !== 'comida');

  // Filtrado
  const filteredProducts = inventoryProducts.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Conteos
  const categoryCounts = CATEGORIES.filter(c => c.id !== 'comida').reduce((acc, cat) => {
    acc[cat.id] = inventoryProducts.filter(p => p.category === cat.id).length;
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Categorías */}
        <div className="w-full lg:w-64 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Categorías</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'all' ? 'bg-slate-900 text-yellow-500 shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[11px] font-bold ${selectedCategory === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
                {inventoryProducts.length}
              </span>
            </button>

            {CATEGORIES.filter(c => c.id !== 'comida').map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat.id ? 'bg-slate-900 text-yellow-500 shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[11px] font-bold ${selectedCategory === cat.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Tarjetas */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start content-start">
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
            initialValues={{ stock: selectedProduct.stock }}
            validate={values => {
              const errors = {};
              if (values.stock === '' || values.stock < 0) {
                errors.stock = 'El stock no puede ser negativo ni vacío';
              }
              return errors;
            }}
            onSubmit={(values) => {
              updateStock(selectedProduct.id, values.stock);
              setSelectedProduct(null);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                  <p className="m-0 text-slate-600">Stock actual: <strong>{selectedProduct.stock} unidades</strong></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nuevo Stock Disponible:</label>
                  <Field
                    type="number"
                    name="stock"
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <ErrorMessage name="stock" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 bg-slate-200 text-slate-700 font-semibold py-2 rounded text-xs hover:bg-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded text-xs hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    Guardar Stock
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      )}
    </div>
  );
};
