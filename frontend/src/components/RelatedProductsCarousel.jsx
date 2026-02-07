import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, BASE_URL } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import '../styles/components/RelatedProductsCarousel.css';

const RelatedProductsCarousel = ({ currentProductId }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [currentProductId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      // Filtrar productos activos y excluir el producto actual
      const filtered = data.filter(
        p => p.is_active && p.id !== parseInt(currentProductId)
      );
      setProducts(filtered);
    } catch (err) {
      console.error('Error loading related products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    if (isAuthenticated()) {
      navigate(`/product/${productId}`);
    } else {
      // Mostrar modal de auth (implementado en ProductCard)
      navigate('/');
    }
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <div className="related-products">
      <h2 className="related-title">También te puede interesar</h2>
      <div className="carousel-container">
        <div className="carousel-track">
          {products.map((product) => (
            <div
              key={product.id}
              className="carousel-card"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="carousel-image-container">
                <img
                  src={product.image_url ? `${BASE_URL}${product.image_url}` : 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400'}
                  alt={product.name}
                  className="carousel-image"
                />
              </div>
              <div className="carousel-info">
                <h3 className="carousel-product-name">{product.name}</h3>
                <p className="carousel-product-price">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelatedProductsCarousel;
