import '../styles/components/Hero.css';
import heroImage from '../assets/Hero.png';

const Hero = () => {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('productos');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero">
      <div className="hero-image-background">
        <img 
          src={heroImage} 
          alt="Arreglo floral artesanal" 
          className="hero-image"
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Flores que<br />
            duran para siempre
          </h1>
          <p className="hero-subtitle">
            Arreglos artesanales para San Valentín
          </p>
          <button className="hero-cta" onClick={scrollToProducts}>
            Ver colección
          </button>
        </div>
      </div>
      <div className="hero-scroll-indicator" onClick={scrollToProducts}>
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
};

export default Hero;
