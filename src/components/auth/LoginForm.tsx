
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
}

// Esquema de validación para el formulario
const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    console.log("[AUTH_DEBUG] Intentando acceder con:", values.email);

    try {
      console.log("[AUTH_DEBUG] Iniciando proceso de autenticación");
      const { error, data, source } = await signIn(values.email, values.password);
      
      if (error) {
        console.log("[AUTH_DEBUG] Error de autenticación:", error.message, "Fuente:", source);
        toast({
          title: "Error de acceso",
          description: "Credenciales incorrectas. Por favor verifica tu correo y contraseña.",
          variant: "destructive",
        });
      } else if (!data) {
        console.log("[AUTH_DEBUG] No hay error pero tampoco datos de sesión");
        toast({
          title: "Error de acceso",
          description: "No se pudo iniciar sesión (sin datos de sesión)",
          variant: "destructive",
        });
      } else {
        console.log("[AUTH_DEBUG] Autenticación exitosa a través de:", source);
        console.log("[AUTH_DEBUG] Datos de usuario:", data?.user?.email);
        toast({
          title: "Acceso exitoso",
          description: `Bienvenido/a a TopMarket (via ${source})`,
        });
        onLogin(values.email, values.password);
      }
    } catch (error) {
      console.error("[AUTH_DEBUG] Error inesperado:", error);
      toast({
        title: "Error de acceso",
        description: "Ha ocurrido un error inesperado. Por favor intenta más tarde.",
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
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="tu@topmarket.com.mx"
                  disabled={isLoading}
                  {...field}
                  className={fieldState.error ? "border-red-500" : ""}
                />
              </FormControl>
              {fieldState.error && (
                <p className="text-sm text-red-500">{fieldState.error.message}</p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...field}
                  className={fieldState.error ? "border-red-500" : ""}
                />
              </FormControl>
              {fieldState.error && (
                <p className="text-sm text-red-500">{fieldState.error.message}</p>
              )}
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-topmarket hover:bg-topmarket/90" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : "Iniciar sesión"}
        </Button>
      </form>
    </Form>
  );
};
