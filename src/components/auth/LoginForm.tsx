
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

    // Credenciales de acceso seguras
    const credentials = {
      'dcomercial@topmarket.com.mx': 'jeifnAHE3HSB3',
      'reclutamiento@topmarket.com.mx': 'TMkc73ndj2b',
      'rys_cdmx@topmarket.com.mx': 'iHFUnd838nx',
      'rlaboral@topmarket.com.com.mx': 'Th8F82Nbd',
      'sergio.t@topmarket.com.mx': 'fk_2024_254_satg_280324',
      'administracion@topmarket.com.mx': 'iE74nuy!jd'
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
                  placeholder="tu@topmarket.com.mx"
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
