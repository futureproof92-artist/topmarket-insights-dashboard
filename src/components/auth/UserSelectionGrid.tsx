
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Lock } from 'lucide-react';

interface UserOption {
  name: string;
  role: string;
  description: string;
  path: string;
}

const users: UserOption[] = [
  {
    name: "Evelyn Matheus",
    role: "evelyn",
    description: "Ventas y Prospecciones",
    path: "/login/evelyn"
  },
  {
    name: "Karla Casillas",
    role: "nataly",
    description: "Nuevo Personal Reclutamiento",
    path: "/login/nataly"
  },
  {
    name: "Gaby Davila",
    role: "davila",
    description: "PXR Cerrados",
    path: "/login/davila"
  },
  {
    name: "Lilia Morales",
    role: "lilia",
    description: "HH Cerrados",
    path: "/login/lilia"
  },
  {
    name: "Nataly Zarate",
    role: "cobranza",
    description: "Cobranza",
    path: "/login/cobranza"
  },
  {
    name: "Sergio Tellez",
    role: "admin",
    description: "Administrador",
    path: "/login/admin"
  }
];

export const UserSelectionGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Link key={user.role} to={user.path} className="transform transition-all hover:scale-105">
          <Card className="h-full bg-card hover:bg-accent/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="w-5 h-5" />
                {user.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {user.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acceso seguro al módulo de {user.description.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
