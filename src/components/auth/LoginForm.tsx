
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onLogin: (email: string) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Error",
        description: "Por favor ingresa un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulamos el envío del Magic Link
    setTimeout(() => {
      toast({
        title: "Magic Link enviado",
        description: "Revisa tu correo electrónico para iniciar sesión",
      });
      
      // Simulamos un login exitoso para desarrollo
      onLogin(email);
      
      setIsLoading(false);
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@topmarket.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-topmarket hover:bg-topmarket/90" 
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : "Recibir Magic Link"}
      </Button>
    </form>
  );
};
