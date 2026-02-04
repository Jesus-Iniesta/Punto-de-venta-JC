import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import '../styles/components/ProductsSection.css';
import ProductCard from './ProductCard';

const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;
