import React, { useState } from 'react';
import { useBar } from '../../context/BarContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Wallet, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ExpensesManager = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useBar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const categories = [
    { id: 'compras', label: 'Compras / Mercadería' },
    { id: 'servicios', label: 'Servicios (Luz, Agua, etc.)' },
    { id: 'planilla', label: 'Pagos de Trabajadores (Planilla)' },
    { id: 'otros', label: 'Otros Gastos' }
  ];

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = filteredExpenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este gasto?")) {
      deleteExpense(id);
    }
  };

  const togglePaidStatus = (expense) => {
    updateExpense({ ...expense, isPaid: !expense.isPaid });
  };

  return (
    <div className="space-y-6">
      {/* Header y Resumen */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 m-0">Control de Gastos</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">Registra compras y configura alertas para pago de servicios.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-yellow-500 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Gastos (Mes)</p>
          <h3 className="text-2xl font-black text-slate-900 m-0 mt-1">C${totalExpenses.toFixed(2)}</h3>
        </div>
        <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 shadow-sm">
          <p className="text-xs font-bold text-rose-700 uppercase">Pendientes de Pago</p>
          <h3 className="text-2xl font-black text-rose-900 m-0 mt-1">C${pendingExpenses.toFixed(2)}</h3>
        </div>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 m-0 text-sm">Historial de Gastos</h3>
          <div className="flex gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value={0}>Enero</option>
              <option value={1}>Febrero</option>
              <option value={2}>Marzo</option>
              <option value={3}>Abril</option>
              <option value={4}>Mayo</option>
              <option value={5}>Junio</option>
              <option value={6}>Julio</option>
              <option value={7}>Agosto</option>
              <option value={8}>Septiembre</option>
              <option value={9}>Octubre</option>
              <option value={10}>Noviembre</option>
              <option value={11}>Diciembre</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold">
                <th className="p-3 pl-4">Fecha</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No hay gastos registrados en este mes.
                  </td>
                </tr>
              ) : (
                filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 pl-4 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{expense.description}</div>
                      {expense.notificationDate && (
                        <div className="text-[10px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Aviso: {new Date(expense.notificationDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      C${expense.amount.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => togglePaidStatus(expense)}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          expense.isPaid ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {expense.isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {expense.isPaid ? 'Pagado' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Registrar Nuevo Gasto"
          maxWidth="max-w-xl"
        >
          <Formik
            initialValues={{
              description: '',
              category: 'compras',
              amount: '',
              isPaid: true,
              addNotification: false,
              notificationDate: ''
            }}
            validate={values => {
              const errors = {};
              if (!values.description.trim()) errors.description = 'Requerido';
              if (!values.amount || values.amount <= 0) errors.amount = 'Monto inválido';
              if (values.addNotification && !values.notificationDate) {
                errors.notificationDate = 'Selecciona una fecha de aviso';
              }
              return errors;
            }}
            onSubmit={(values) => {
              const newExpense = {
                description: values.description,
                category: values.category,
                amount: parseFloat(values.amount),
                isPaid: values.isPaid,
                notificationDate: values.addNotification ? values.notificationDate : null
              };
              addExpense(newExpense);
              setIsModalOpen(false);
            }}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-1">Descripción:</label>
                  <Field
                    type="text"
                    name="description"
                    placeholder="Ej. Compra de 5 Cajas de Cerveza, Recibo de Luz..."
                    className="w-full p-3 border text-white rounded-xl text-sm focus:ring-2 "
                  />
                  <ErrorMessage name="description" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Monto (C$):</label>
                    <Field
                      type="number"
                      step="0.01"
                      name="amount"
                      placeholder="0.00"
                      className="w-full p-3 border border-slate-300 text-white rounded-xl text-sm font-bold focus:ring-2 "
                    />
                    <ErrorMessage name="amount" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-1">Categoría:</label>
                    <Field
                      as="select"
                      name="category"
                      className="w-full p-3 border text-white bg-slate-950 border-slate-300 rounded-xl text-sm focus:ring-2  "
                      onChange={(e) => {
                        setFieldValue('category', e.target.value);
                        // Auto check isPaid to false for services usually
                        if (e.target.value === 'servicios') {
                          setFieldValue('isPaid', false);
                        } else {
                          setFieldValue('addNotification', false);
                          setFieldValue('isPaid', true);
                        }
                      }}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </Field>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Field type="checkbox" name="isPaid" id="isPaid" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <label htmlFor="isPaid" className="text-sm font-semibold text-white cursor-pointer">
                    Este gasto ya fue pagado
                  </label>
                </div>

                {values.category === 'servicios' && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-amber-900 cursor-pointer flex items-center gap-2">
                        <Field type="checkbox" name="addNotification" className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                        Agregar Notificación (Aviso 5 días antes)
                      </label>
                    </div>
                    
                    {values.addNotification && (
                      <div className="animate-in fade-in">
                        <label className="block text-xs font-bold text-amber-800 mb-1">Fecha límite / Fecha de aviso:</label>
                        <Field
                          type="date"
                          name="notificationDate"
                          className="w-full p-2.5 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                        />
                        <ErrorMessage name="notificationDate" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-black text-yellow-500 font-bold py-3 rounded-xl text-sm hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
                  >
                    Guardar Gasto
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
