
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
}

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<LoginFormValues>();

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);

    // Verificación de credenciales (simulada por ahora)
    const credentials = {
      'evelyn@topmarket.com': 'TM#Evelyn2024',
      'davila@topmarket.com': 'TM#Davila2024',
      'lilia@topmarket.com': 'TM#Lilia2024',
      'nataly@topmarket.com': 'TM#Karla2024',
      'admin@topmarket.com': 'TM#Admin2024'
    };

    if (credentials[values.email as keyof typeof credentials] === values.password) {
      toast({
        title: "Acceso exitoso",
        description: "Bienvenido/a a TopMarket",
      });
      onLogin(values.email, values.password);
    } else {
      toast({
        title: "Error de acceso",
        description: "Credenciales incorrectas",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="tu@topmarket.com"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-topmarket hover:bg-topmarket/90" 
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>
    </Form>
  );
};
