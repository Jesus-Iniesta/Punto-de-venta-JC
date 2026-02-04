import '../styles/components/ProductCard.css';

const ProductCard = ({ product }) => {
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  
  // Construir URL completa de la imagen
  const imageUrl = product.image_url 
    ? `${API_URL}${product.image_url}`
    : 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=600&fit=crop';

  return (
    <article className="product-card">
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
