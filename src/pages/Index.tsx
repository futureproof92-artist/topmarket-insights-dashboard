
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificamos si hay un usuario guardado en localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      
      // Redirección basada en rol
      switch(user.role) {
        case 'evelyn':
          navigate('/ventas');
          break;
        case 'davila':
          navigate('/pxr-cerrados');
          break;
        case 'lilia':
          navigate('/hh-cerrados');
          break;
        case 'nataly':
          navigate('/cobranza');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          // Si no hay rol válido, se queda en la página de login
          break;
      }
    }
  }, [navigate]);

  return <LoginPage />;
};

export default Index;
