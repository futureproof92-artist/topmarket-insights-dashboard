
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

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
  const { signIn } = useAuth();
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    console.log("Intentando acceder con:", values.email);

    try {
      console.log("Iniciando proceso de autenticación con Supabase");
      const { error, data } = await signIn(values.email, values.password);
      
      console.log("Respuesta de autenticación:", { error: error ? "Error presente" : "Sin error", data: data ? "Datos presentes" : "Sin datos" });
      
      if (error) {
        console.log("Error de autenticación detallado:", error.message, error);
        toast({
          title: "Error de acceso",
          description: `Credenciales incorrectas: ${error.message}`,
          variant: "destructive",
        });
      } else if (!data) {
        console.log("No hay error pero tampoco datos de sesión");
        toast({
          title: "Error de acceso",
          description: "No se pudo iniciar sesión (sin datos de sesión)",
          variant: "destructive",
        });
      } else {
        console.log("Autenticación exitosa:", data?.user?.email);
        toast({
          title: "Acceso exitoso",
          description: "Bienvenido/a a TopMarket",
        });
        onLogin(values.email, values.password);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      toast({
        title: "Error de acceso",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
