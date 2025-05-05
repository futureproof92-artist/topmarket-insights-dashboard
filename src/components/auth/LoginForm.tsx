
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [loginError, setLoginError] = useState<string | null>(null);
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
    setLoginError(null);
    console.log("[AUTH_DEBUG] Intentando acceso con JWT para:", values.email);

    try {
      console.log("[AUTH_DEBUG] Iniciando proceso de autenticación JWT con Supabase");
      const { error, data } = await signIn(values.email, values.password);
      
      if (error) {
        console.log("[AUTH_DEBUG] Error de autenticación JWT:", error.message);
        setLoginError(
          "Credenciales incorrectas. Verifica tu correo y contraseña o contacta al administrador para confirmar que tu cuenta existe en el sistema."
        );
      } else if (!data) {
        console.log("[AUTH_DEBUG] No hay error pero tampoco datos de sesión JWT");
        setLoginError("No se pudo iniciar sesión (sin datos de sesión JWT)");
      } else {
        console.log("[AUTH_DEBUG] Autenticación JWT exitosa con Supabase");
        console.log("[AUTH_DEBUG] Datos de JWT:", {
          usuario: data?.user?.email,
          expiracion: new Date(data.expires_at * 1000).toLocaleString(),
          tiempoRestante: Math.round((data.expires_at - Date.now()/1000)/60) + " minutos"
        });
        toast({
          title: "Acceso seguro exitoso",
          description: `Bienvenido/a a TopMarket. Autenticación JWT verificada.`,
          icon: <ShieldCheck className="h-5 w-5 text-green-500" />
        });
        onLogin(values.email, values.password);
      }
    } catch (error) {
      console.error("[AUTH_DEBUG] Error inesperado en autenticación JWT:", error);
      setLoginError("Ha ocurrido un error inesperado con la autenticación JWT. Por favor intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {loginError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        
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
              Verificando credenciales...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Iniciar sesión segura
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
