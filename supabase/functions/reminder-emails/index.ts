
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Inicializar cliente de Resend con la API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Inicializar cliente de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://wpsaktihetvpbykawvxl.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plantillas de correo personalizadas por rol
const emailTemplates: Record<string, { subject: string; body: (nombre: string) => string }> = {
  evelyn: {
    subject: "TopMarket: Recordatorio de registro de Ventas y Prospecciones",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #004d99;">¡Hola ${nombre}!</h2>
        
        <p>Espero que hayas tenido una excelente semana llena de éxitos y buenos resultados. 😊</p>
        
        <p>Este es un recordatorio amistoso para que actualices tu <strong>reporte semanal de ventas y prospecciones</strong> en el sistema. Tus datos son fundamentales para medir nuestro avance como equipo y tomar decisiones informadas.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #004d99; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>¿Qué necesitas registrar?</strong></p>
          <ul>
            <li>Leads generados (PUB EM, PUB CL, FRIO EM, FRIO CL)</li>
            <li>Ventas cerradas</li>
            <li>Detalles de cada venta (cliente, ubicación, tipo, costo, etc.)</li>
          </ul>
        </div>
        
        <p>Tus reportes semanales nos ayudan a visualizar tendencias y mejorar nuestras estrategias comerciales.</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/ventas" style="display: inline-block; background-color: #004d99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Actualizar mi reporte ahora</a>
        
        <p>¡Gracias por tu dedicación y compromiso con TopMarket!</p>
        
        <p style="margin-bottom: 5px;">Saludos cordiales,</p>
        <p style="font-weight: bold; margin-top: 0;">El equipo de TopMarket</p>
      </div>
    `
  },
  davila: {
    subject: "TopMarket: Recordatorio de actualización de PXR Cerrados",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #009966;">¡Hola ${nombre}!</h2>
        
        <p>Espero que tu semana esté yendo genial. 🌟</p>
        
        <p>Es viernes y ya sabes lo que eso significa - ¡es momento de actualizar tus <strong>PXR Cerrados</strong> en el sistema! Esta información es crucial para nuestro seguimiento y para asegurar que todos nuestros procesos operativos estén alineados.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #009966; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Por favor recuerda incluir:</strong></p>
          <ul>
            <li>Todos los PXR cerrados esta semana</li>
            <li>Detalles de cada proyecto</li>
            <li>Estatus actual y próximos pasos</li>
          </ul>
        </div>
        
        <p>Tu consistencia en el registro de esta información nos ayuda enormemente a mantener una visión clara del negocio.</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/pxr-cerrados" style="display: inline-block; background-color: #009966; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Ir a mi sección de PXR</a>
        
        <p>¡Gracias por tu excelente trabajo y por mantener actualizada esta información tan valiosa!</p>
        
        <p style="margin-bottom: 5px;">Un cordial saludo,</p>
        <p style="font-weight: bold; margin-top: 0;">El equipo de TopMarket</p>
      </div>
    `
  },
  lilia: {
    subject: "TopMarket: Recordatorio de actualización de HH Cerrados",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #663399;">¡Hola ${nombre}!</h2>
        
        <p>Espero que hayas tenido una semana productiva. ✨</p>
        
        <p>Te escribo para recordarte que es momento de actualizar tus <strong>HH Cerrados</strong> de la semana en el sistema. Esta información es fundamental para nuestro análisis de rendimiento y para la coordinación con el resto de equipos.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #663399; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Es importante que actualices:</strong></p>
          <ul>
            <li>Todos los proyectos HH cerrados esta semana</li>
            <li>Horas facturables por cliente</li>
            <li>Estatus de cada proyecto</li>
          </ul>
        </div>
        
        <p>Tu contribución al mantener esta información al día es esencial para nuestra operación y planificación estratégica.</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/hh-cerrados" style="display: inline-block; background-color: #663399; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Actualizar HH Cerrados</a>
        
        <p>¡Muchas gracias por tu dedicación y precisión en el registro de esta información!</p>
        
        <p style="margin-bottom: 5px;">Saludos cordiales,</p>
        <p style="font-weight: bold; margin-top: 0;">El equipo de TopMarket</p>
      </div>
    `
  },
  karla: {
    subject: "TopMarket: Recordatorio de actualización de Reclutamiento Interno",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #e67e22;">¡Hola ${nombre}!</h2>
        
        <p>Feliz viernes! 🎉</p>
        
        <p>Es momento de actualizar la información de <strong>Reclutamiento Interno</strong> en nuestro sistema. Tus datos son esenciales para poder mantener una visión clara de nuestro pipeline de talento y planificar adecuadamente.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Por favor, asegúrate de actualizar:</strong></p>
          <ul>
            <li>Candidatos en proceso</li>
            <li>Posiciones cubiertas esta semana</li>
            <li>Vacantes activas y requisitos</li>
            <li>Estado de las entrevistas programadas</li>
          </ul>
        </div>
        
        <p>Tu trabajo es fundamental para asegurar que TopMarket cuente con el mejor talento posible. ¡Gracias por mantener esta información actualizada!</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/reclutamiento" style="display: inline-block; background-color: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Ir a Reclutamiento</a>
        
        <p>Agradecemos tu dedicación y compromiso con nuestros procesos de reclutamiento.</p>
        
        <p style="margin-bottom: 5px;">Saludos cordiales,</p>
        <p style="font-weight: bold; margin-top: 0;">El equipo de TopMarket</p>
      </div>
    `
  },
  nataly: {
    subject: "TopMarket: Recordatorio de actualización de Cobranza",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #c0392b;">¡Hola ${nombre}!</h2>
        
        <p>Espero que hayas tenido una excelente semana. 💼</p>
        
        <p>Es viernes y necesitamos que actualices la información de <strong>Cobranza</strong> en nuestro sistema. Estos datos son críticos para nuestra salud financiera y la planificación de flujo de caja de la empresa.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #c0392b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Por favor actualiza:</strong></p>
          <ul>
            <li>Pagos recibidos esta semana</li>
            <li>Facturas pendientes y su antigüedad</li>
            <li>Comunicaciones con clientes sobre pagos</li>
            <li>Proyecciones de cobro para la próxima semana</li>
          </ul>
        </div>
        
        <p>Tu meticulosidad en el seguimiento de la cobranza es fundamental para que TopMarket pueda operar con eficiencia y cumplir con todos nuestros compromisos.</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/cobranza" style="display: inline-block; background-color: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Actualizar Cobranza</a>
        
        <p>¡Muchas gracias por tu invaluable labor en la gestión de nuestras finanzas!</p>
        
        <p style="margin-bottom: 5px;">Un cordial saludo,</p>
        <p style="font-weight: bold; margin-top: 0;">El equipo de TopMarket</p>
      </div>
    `
  },
  admin: {
    subject: "TopMarket: Resumen semanal del Dashboard",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">¡Hola ${nombre}!</h2>
        
        <p>Espero que hayas tenido una semana productiva. 📊</p>
        
        <p>Es momento de revisar el <strong>Dashboard Maestro</strong> para analizar el progreso de la semana. Como administrador, tu visión general es crucial para guiar a todos los equipos.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #2c3e50; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Puntos a revisar:</strong></p>
          <ul>
            <li>Cumplimiento de actualizaciones por cada equipo</li>
            <li>Tendencias en ventas y leads</li>
            <li>Procesos de reclutamiento activos</li>
            <li>Estado de cobranza y finanzas</li>
            <li>Proyectos PXR y HH en curso</li>
          </ul>
        </div>
        
        <p>Tu liderazgo en el análisis de estos datos es fundamental para identificar áreas de oportunidad y tomar decisiones estratégicas para TopMarket.</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/admin" style="display: inline-block; background-color: #2c3e50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Ver Dashboard Maestro</a>
        
        <p>¡Gracias por tu compromiso con la excelencia operativa de TopMarket!</p>
        
        <p style="margin-bottom: 5px;">Saludos cordiales,</p>
        <p style="font-weight: bold; margin-top: 0;">El sistema de TopMarket</p>
      </div>
    `
  },
  default: {
    subject: "TopMarket: Recordatorio de actualización semanal",
    body: (nombre) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #3498db;">¡Hola ${nombre}!</h2>
        
        <p>Espero que hayas tenido una gran semana. 👋</p>
        
        <p>Este es un recordatorio amistoso para que actualices tu información semanal en el dashboard de TopMarket. Tu contribución es esencial para mantener nuestros sistemas actualizados.</p>
        
        <div style="background-color: #f5f5f5; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Recuerda actualizar:</strong></p>
          <ul>
            <li>Datos relevantes de tu área</li>
            <li>Métricas semanales</li>
            <li>Información pendiente en el sistema</li>
          </ul>
        </div>
        
        <p>Mantener esta información al día nos ayuda a todos a trabajar mejor como equipo.</p>
        
        <a href="https://topmarket-dashboard.lovable.dev/" style="display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; margin-bottom: 15px;">Ir al Dashboard</a>
        
        <p>¡Gracias por tu colaboración!</p>
        
        <p style="margin-bottom: 5px;">Saludos cordiales,</p>
        <p style="font-weight: bold; margin-top: 0;">El equipo de TopMarket</p>
      </div>
    `
  }
};

// Función para enviar correos electrónicos a todos los usuarios
async function enviarRecordatorios(): Promise<{ exito: number; fallidos: number }> {
  try {
    // Obtener todos los usuarios desde la tabla de usuarios_roles
    const { data: usuarios, error } = await supabase
      .from("usuarios_roles")
      .select("*");

    if (error) {
      console.error("Error al obtener usuarios:", error);
      throw new Error(error.message);
    }

    console.log(`Enviando recordatorios a ${usuarios.length} usuarios`);

    let exito = 0;
    let fallidos = 0;

    // Enviar correo a cada usuario
    for (const usuario of usuarios) {
      try {
        const template = emailTemplates[usuario.role] || emailTemplates.default;
        
        const { data: emailResponse, error: emailError } = await resend.emails.send({
          from: "TopMarket Dashboard <no-reply@resend.dev>",
          to: [usuario.email],
          subject: template.subject,
          html: template.body(usuario.nombre),
        });

        if (emailError) {
          console.error(`Error al enviar correo a ${usuario.email}:`, emailError);
          fallidos++;
        } else {
          console.log(`Correo enviado exitosamente a ${usuario.email}`);
          exito++;
        }
      } catch (err) {
        console.error(`Error inesperado al enviar correo a ${usuario.email}:`, err);
        fallidos++;
      }
    }

    return { exito, fallidos };
  } catch (error) {
    console.error("Error general en el proceso de envío:", error);
    throw error;
  }
}

// Manejador principal para la función
serve(async (req) => {
  // Manejar solicitudes OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar si es una solicitud programada o manual
    const isScheduled = req.headers.get("Authorization") === "Bearer CRON";
    
    // Si es manual, verificar el método
    if (!isScheduled && req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método no permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enviar los recordatorios
    const resultado = await enviarRecordatorios();

    return new Response(
      JSON.stringify({
        mensaje: "Proceso de envío de recordatorios completado",
        resultado,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en la función:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
