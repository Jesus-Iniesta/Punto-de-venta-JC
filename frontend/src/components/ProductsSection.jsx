import './ProductsSection.css';
import ProductCard from './ProductCard';

const ProductsSection = () => {
  const products = [
    {
      id: 1,
      name: 'Ramo Rosa Clásico',
      price: 350,
      image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=600&fit=crop'
    },
    {
      id: 2,
      name: 'Bouquet Romántico',
      price: 450,
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=600&fit=crop'
    },
    {
      id: 3,
      name: 'Arreglo Delicado',
      price: 400,
      image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=600&fit=crop'
    },
    {
      id: 4,
      name: 'Ramo Elegante',
      price: 500,
      image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=600&fit=crop'
    },
    {
      id: 5,
      name: 'Bouquet Premium',
      price: 550,
      image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&h=600&fit=crop'
    },
    {
      id: 6,
      name: 'Arreglo Especial',
      price: 600,
      image: 'https://images.unsplash.com/photo-1502977249166-824b3a8a4d6d?w=400&h=600&fit=crop'
    }
  ];

  return (
    <section className="products-section" id="productos">
      <div className="products-container">
        <div className="products-header">
          <h2 className="products-title">Nuestra Colección</h2>
          <p className="products-subtitle">
            Cada pieza es única, hecha a mano con dedicación
          </p>
        </div>
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
