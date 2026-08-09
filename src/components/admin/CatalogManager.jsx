import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CATEGORIES } from '../../mock/initialData';

export const CatalogManager = () => {
  const { products, addProduct, updateProduct, deleteProduct, categories } = useBar();
  const activeCategories = categories && categories.length > 0 ? categories : CATEGORIES;
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(activeCategories[0]?.id || "cervezas");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setImageFile(null);
    setImagePreview(product.image || null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
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
              category: editingProduct ? editingProduct.category : (activeCategories[0]?.id || 'cervezas'),
              price: editingProduct ? editingProduct.price : '',
              cost: editingProduct ? (editingProduct.cost || '') : '',
              stock: editingProduct ? (editingProduct.stock === null ? '' : editingProduct.stock) : '',
              bundleProductId: editingProduct?.bundleItems?.[0]?.productId || '',
              bundleQuantity: editingProduct?.bundleItems?.[0]?.quantity || 6
            }}
            validate={values => {
              const errors = {};
              if (!values.name.trim()) errors.name = 'Requerido';
              if (!values.price || values.price <= 0) errors.price = 'Precio inválido';
              if (!values.cost || values.cost < 0) errors.cost = 'Costo inválido';
              if (values.category !== 'comida' && values.category !== 'promociones' && (values.stock === '' || values.stock < 0)) errors.stock = 'Stock inválido';
              if (values.category === 'promociones') {
                 if (!values.bundleProductId) errors.bundleProductId = 'Debe seleccionar un producto base';
                 if (!values.bundleQuantity || values.bundleQuantity <= 0) errors.bundleQuantity = 'Cantidad inválida';
              }
              return errors;
            }}
            onSubmit={(values, { resetForm }) => {
              // Convertir valores a números
              const formattedValues = {
                ...values,
                price: parseFloat(values.price),
                cost: parseFloat(values.cost),
                stock: (values.category === 'comida' || values.category === 'promociones') ? null : parseInt(values.stock, 10),
              };

              if (values.category === 'promociones') {
                formattedValues.bundleItems = [{
                  productId: parseInt(values.bundleProductId, 10),
                  quantity: parseInt(values.bundleQuantity, 10)
                }];
              } else {
                formattedValues.bundleItems = null; // Limpiar si cambia de categoría
              }

              if (editingProduct) {
                updateProduct({ ...editingProduct, ...formattedValues }, imageFile);
                setEditingProduct(null);
              } else {
                addProduct(formattedValues, imageFile);
              }
              setImageFile(null);
              setImagePreview(null);
              resetForm();
            }}
          >
            {({ isSubmitting, values }) => {
              const priceNum = parseFloat(values.price) || 0;
              const costNum = parseFloat(values.cost) || 0;
              let margin = 0;
              if (priceNum > 0) {
                margin = ((priceNum - costNum) / priceNum) * 100;
              }

              return (
                <Form className="space-y-4">
                  {/* Subida de Imagen */}
                  <div className="flex flex-col items-center gap-3">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex-shrink-0">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                        <Package className="w-8 h-8 mb-1 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Foto</span>
                      </div>
                    )}
                    
                    <div className="w-full">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Imagen del Producto (Opcional):</label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setImagePreview(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>

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
                      {activeCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Costo (C$):</label>
                      <Field
                        type="number"
                        step="0.01"
                        name="cost"
                        placeholder="0.00"
                        className="w-full p-2 border border-slate-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <ErrorMessage name="cost" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Precio Venta (C$):</label>
                      <Field
                        type="number"
                        step="0.01"
                        name="price"
                        placeholder="0.00"
                        className="w-full p-2 border border-slate-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <ErrorMessage name="price" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                    </div>
                  </div>

                  {priceNum > 0 && costNum >= 0 && (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Margen de Ganancia:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${margin >= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {margin.toFixed(1)}% (C${(priceNum - costNum).toFixed(2)})
                      </span>
                    </div>
                  )}

                  {values.category === 'promociones' ? (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-2 animate-in fade-in zoom-in duration-200">
                      <label className="block text-xs font-bold text-blue-800 mb-2">Configuración del Combo / Promoción:</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-blue-700 mb-1">Producto a descontar:</label>
                          <Field as="select" name="bundleProductId" className="w-full p-2 border border-blue-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                            <option value="">-- Seleccionar --</option>
                            {products.filter(p => p.category !== 'comida' && p.category !== 'promociones').map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="bundleProductId" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-700 mb-1">Cantidad:</label>
                          <Field type="number" name="bundleQuantity" className="w-full p-2 border border-blue-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                          <ErrorMessage name="bundleQuantity" component="div" className="text-red-500 text-[10px] mt-1 font-semibold" />
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}

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
              );
            }}
          </Formik>
        </div>
      </div>

      {/* Columna Derecha: Listado Filtrado */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        {/* Pestañas de Categorías */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {activeCategories.map(cat => (
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
