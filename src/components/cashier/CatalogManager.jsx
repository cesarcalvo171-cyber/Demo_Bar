import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES } from '../../mock/initialData';

export const CatalogManager = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useBar();
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDelete = (id, name) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${name}" del catálogo?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Columna Izquierda: Formulario (Fijo) */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-6">
          <div className="mb-4 pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 m-0">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-slate-500 m-0 mt-1">
              {editingProduct ? 'Modifica los detalles del producto seleccionado.' : 'Añade un nuevo ítem al catálogo.'}
            </p>
          </div>

          <Formik
            enableReinitialize
            initialValues={{
              name: editingProduct ? editingProduct.name : '',
              category: editingProduct ? editingProduct.category : CATEGORIES[0].id,
              price: editingProduct ? editingProduct.price : '',
              stock: editingProduct ? (editingProduct.stock === null ? '' : editingProduct.stock) : ''
            }}
            validate={values => {
              const errors = {};
              if (!values.name.trim()) errors.name = 'Requerido';
              if (!values.price || values.price <= 0) errors.price = 'Precio inválido';
              if (values.category !== 'comida' && (values.stock === '' || values.stock < 0)) errors.stock = 'Stock inválido';
              return errors;
            }}
            onSubmit={(values, { resetForm }) => {
              // Convertir valores a números
              const formattedValues = {
                ...values,
                price: parseFloat(values.price),
                stock: values.category === 'comida' ? null : parseInt(values.stock, 10)
              };

              if (editingProduct) {
                updateProduct({ ...editingProduct, ...formattedValues });
                setEditingProduct(null);
              } else {
                addProduct(formattedValues);
              }
              resetForm();
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto:</label>
                  <Field
                    type="text"
                    name="name"
                    placeholder="Ej. Cerveza IPA 500ml"
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría:</label>
                  <Field
                    as="select"
                    name="category"
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Precio (C$):</label>
                    <Field
                      type="number"
                      step="0.01"
                      name="price"
                      placeholder="0.00"
                      className="w-full p-2 border border-slate-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <ErrorMessage name="price" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual:</label>
                    <Field
                      type="number"
                      name="stock"
                      placeholder="0"
                      disabled={values.category === 'comida'}
                      className="w-full p-2 border border-slate-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <ErrorMessage name="stock" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                    {values.category === 'comida' && (
                      <span className="text-[10px] text-slate-500 mt-1 block">Comida no usa stock numérico</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 bg-slate-100 text-slate-600 font-semibold py-2 rounded-lg text-sm hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-black text-yellow-500 font-bold py-2 rounded-lg font-serif text-sm hover:bg-blue-700 cursor-pointer shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {editingProduct ? <Edit2 className="w-4 h-4"/> : <Plus className="w-4 h-4" />}
                    {editingProduct ? 'Guardar' : 'Agregar'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {/* Columna Derecha: Listado Filtrado */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        {/* Pestañas de Categorías */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-black text-yellow-500 border-t border-l border-r border-slate-200'
                  : 'bg-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-black text-yellow-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                  <th className="p-3 pl-4">Producto</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products
                  .filter(p => p.category === selectedCategory)
                  .map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      <div className="font-mono text-slate-400 text-[10px]">ID: #{product.id}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">C${product.price.toFixed(2)}</td>
                    <td className="p-3">
                      {product.stock !== null ? (
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          product.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.stock} un.
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-500 text-[10px]">
                          Prep.
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.filter(p => p.category === selectedCategory).length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-slate-500">
                      No hay productos en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
