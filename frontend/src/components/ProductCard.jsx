import { BASE_URL } from '../services/productService';
import '../styles/components/ProductCard.css';

const ProductCard = ({ product, onClick }) => {
  // Construir URL completa de la imagen
  const imageUrl = product.image_url 
    ? `${BASE_URL}${product.image_url}`
    : 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=600&fit=crop';

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <article className="product-card" onClick={handleClick}>
      <div className="product-image-wrapper">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=600&fit=crop';
          }}
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">${product.price}</p>
      </div>
    </article>
  );
};

export default ProductCard;
