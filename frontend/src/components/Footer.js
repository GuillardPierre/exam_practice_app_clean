import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <p>&copy; {currentYear} Application Mes Tâches</p>
    </footer>
  );
};

export default Footer;
