// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getTransactions, addTransaction, deleteTransaction, 
  getCategories, addCategory, deleteCategory 
} from '../api/data';
import type { Transaction, Category } from '../types/data';
import '../App.css'; // Import styles

const Dashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newCatName, setNewCatName] = useState('');
  const [newTx, setNewTx] = useState({ 
    amount: '', description: '', category: '', transaction_type: 'expense' as 'income' | 'expense' 
  });

  const fetchData = async () => {
    try {
      const [txRes, catRes] = await Promise.all([getTransactions(), getCategories()]);
      const txData = (txRes.data as any).results ? (txRes.data as any).results : txRes.data;
      const catData = (catRes.data as any).results ? (catRes.data as any).results : catRes.data;
      setTransactions(txData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      navigate('/login'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const calculateNetBalance = () => {
    return transactions.reduce((total, tx) => {
      // Simple logic: add income, subtract expense
      return tx.transaction_type === 'income' 
        ? total + Number(tx.amount) 
        : total - Number(tx.amount);
    }, 0);
  };

  // ... (Handlers for Add/Delete kept same as before, just removed for brevity in this snippet)
  // Just ensure you copy the handleAddCategory, handleDeleteCategory, handleAddTransaction, handleDeleteTransaction logic here from previous step.
  const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName) return;
      await addCategory(newCatName);
      setNewCatName('');
      fetchData();
  };
  const handleDeleteCategory = async (id: string) => {
      if(confirm("Delete category?")) { await deleteCategory(id); fetchData(); }
  };
  const handleAddTransaction = async (e: React.FormEvent) => {
      e.preventDefault();
      await addTransaction({
          amount: Number(newTx.amount),
          description: newTx.description,
          category: newTx.category,
          transaction_type: newTx.transaction_type,
          date: new Date().toISOString()
      });
      setNewTx({ amount: '', description: '', category: '', transaction_type: 'expense' });
      fetchData();
  };
  const handleDeleteTransaction = async (id: string) => {
      await deleteTransaction(id);
      fetchData();
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>My Finance Tracker</h1>
        <Link to="/logout" className="btn-danger" style={{ padding: '8px 16px', textDecoration: 'none', borderRadius: '4px' }}>
          Logout
        </Link>
      </div>
      
      {/* BALANCE CARD */}
      <div className="summary-card">
        <h2>Net Balance</h2>
        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: calculateNetBalance() >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          ${calculateNetBalance().toFixed(2)}
        </p>
      </div>

      <div className="grid-layout">
        
        {/* LEFT: CATEGORIES */}
        <div className="card">
          <h3>Categories</h3>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)} 
              placeholder="New Category..."
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>+</button>
          </form>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {categories.map(cat => (
              <div key={cat.id} className="list-item">
                <span>{cat.name}</span>
                <button onClick={() => handleDeleteCategory(cat.id)} className="btn-link">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: TRANSACTIONS */}
        <div className="card">
          <h3>Add Transaction</h3>

          {/* Transaction Form */}
          <form onSubmit={handleAddTransaction} style={{ marginBottom: '20px' }}>
            
            {/* Type Toggle */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <label style={{ cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  checked={newTx.transaction_type === 'expense'} 
                  onChange={() => setNewTx({...newTx, transaction_type: 'expense'})}
                /> Expense
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  checked={newTx.transaction_type === 'income'} 
                  onChange={() => setNewTx({...newTx, transaction_type: 'income'})}
                /> Income
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input 
                type="number" 
                placeholder="Amount" 
                value={newTx.amount}
                onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                required
              />
              <select 
                value={newTx.category} 
                onChange={(e) => setNewTx({...newTx, category: e.target.value})}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <input 
              type="text" 
              placeholder="Description" 
              value={newTx.description}
              onChange={(e) => setNewTx({...newTx, description: e.target.value})}
              style={{ marginBottom: '10px' }}
            />

            <button type="submit" className={newTx.transaction_type === 'income' ? 'btn-success' : 'btn-danger'}>
              Add {newTx.transaction_type}
            </button>
          </form>

          {/* List */}
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Desc</th>
                <th>Amt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ color: tx.transaction_type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.transaction_type}
                  </td>
                  <td>{tx.description}</td>
                  <td style={{ fontWeight: 'bold' }}>${tx.amount}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDeleteTransaction(tx.id)} className="btn-link">x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;