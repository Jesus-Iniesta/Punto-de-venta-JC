import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateProduct from './pages/CreateProduct';
import SellersPage from './pages/SellersPage';
import SalesPage from './pages/SalesPage';
import EarningsPage from './pages/EarningsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/admin/products/create" 
            element={
              <ProtectedRoute adminOnly={true}>
                <CreateProduct />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sellers" 
            element={
              <ProtectedRoute>
                <SellersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/earnings" 
            element={
              <ProtectedRoute adminOnly={true}>
                <EarningsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
