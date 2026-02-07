import '../styles/components/ContactButton.css';

const ContactButton = ({ phone, label = "Contactar" }) => {
  const handleClick = () => {
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  return (
    <button onClick={handleClick} className="whatsapp-button">
      {label}
    </button>
  );
};

export default ContactButton;
