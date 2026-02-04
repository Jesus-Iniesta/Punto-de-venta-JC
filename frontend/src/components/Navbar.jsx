import './Navbar.css';

const Navbar = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={scrollToTop}>
          Flores Artesanales
        </div>
        <div className="navbar-menu">
          <button className="navbar-link" onClick={scrollToTop}>
            Inicio
          </button>
          <button className="navbar-link">
            Iniciar sesión
          </button>
          <button className="navbar-link navbar-contact">
            Contáctanos
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
