
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';

const getUserInfo = (role: string) => {
  const userInfo = {
    evelyn: {
      name: "Evelyn Matheus",
      description: "Ventas y Prospecciones"
    },
    davila: {
      name: "Gaby Davila",
      description: "PXR Cerrados"
    },
    lilia: {
      name: "Lilia Morales",
      description: "HH Cerrados"
    },
    nataly: {
      name: "Karla Casillas",
      description: "Cobranza"
    },
    admin: {
      name: "Sergio Tellez",
      description: "Administrador"
    }
  };
  return userInfo[role as keyof typeof userInfo];
};

const UserLoginPage = () => {
  const { role } = useParams();
  const userInfo = role ? getUserInfo(role) : null;

  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">TopMarket</h2>
          <p className="text-muted-foreground mt-2">Acceso para {userInfo.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión - {userInfo.description}</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={(email) => console.log('Login attempt:', email, role)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserLoginPage;
