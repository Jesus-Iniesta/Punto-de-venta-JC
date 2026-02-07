import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import '../styles/components/ProductsSection.css';
import ProductCard from './ProductCard';
import AuthRequiredModal from './AuthRequiredModal';

const ProductsSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      // Filtrar solo productos activos
      const activeProducts = data.filter(product => product.is_active);
      setProducts(activeProducts);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    if (isAuthenticated()) {
      navigate(`/product/${product.id}`);
    } else {
      setShowAuthModal(true);
    }
  };

  if (loading) {
    return (
      <section className="products-section" id="productos">
        <div className="products-container">
          <div className="products-loading">Cargando productos...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="products-section" id="productos">
        <div className="products-container">
          <div className="products-error">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-section" id="productos">
      <div className="products-container">
        <div className="products-header">
          <h2 className="products-title">Nuestra Colección</h2>
          <p className="products-subtitle">
            Cada pieza es única, hecha a mano con dedicación
          </p>
        </div>
        
        {products.length === 0 ? (
          <div className="products-empty">
            <p>No hay productos disponibles en este momento</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={handleProductClick}
              />
            ))}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthRequiredModal onClose={() => setShowAuthModal(false)} />
      )}
    </section>
  );
};

export default ProductsSection;
