
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.2";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;

// Inicialización del cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

function getWeekRange() {
  // Obtener el lunes de la semana siguiente
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 es domingo, 1 es lunes, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  // Calcular fecha inicial (lunes próximo)
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  // Calcular fecha final (viernes de la próxima semana)
  const nextFriday = new Date(nextMonday);
  nextFriday.setDate(nextMonday.getDate() + 4);
  
  // Formatear fechas para display
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  
  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} ${year}`;
  };
  
  return {
    fromDate: nextMonday,
    toDate: nextFriday,
    displayText: `Lun ${formatDate(nextMonday)} – Vie ${formatDate(nextFriday)}`
  };
}

// Función para enviar correos con Resend
async function sendReminder(recipient: { email: string; nombre: string; role: string; }) {
  if (!resendApiKey) {
    console.error("Error: RESEND_API_KEY no está configurado");
    return { error: "API key no configurada" };
  }

  const weekRange = getWeekRange();

  // Personalización del mensaje según el rol
  let subject = "";
  let messageContent = "";

  switch (recipient.role) {
    case "evelyn":
      subject = "⚠️ Recordatorio: Registrar ventas de la próxima semana";
      messageContent = `
        <p>Hola Evelyn,</p>
        <p>Te recordamos que debes registrar tus ventas para la semana del ${weekRange.displayText}.</p>
        <p>No olvides incluir:</p>
        <ul>
          <li>Leads públicos (email y cliente)</li>
          <li>Leads en frío (email y cliente)</li>
          <li>Ventas cerradas</li>
          <li>Detalles de cada venta (cliente, ubicación, tipo de servicio, etc.)</li>
        </ul>
        <p>Por favor, mantén esta información actualizada para que podamos tener un seguimiento preciso de nuestro funnel de ventas.</p>
        <p>¡Gracias por tu colaboración!</p>
        <p>Saludos,<br>El equipo de TopMarket</p>
      `;
      break;
    case "davila":
      subject = "📊 Recordatorio: Actualización de PXR cerrados semanal";
      messageContent = `
        <p>Hola Gaby,</p>
        <p>Es importante que actualices el registro de PXR cerrados para la semana del ${weekRange.displayText}.</p>
        <p>Recuerda ingresar:</p>
        <ul>
          <li>El monto total cerrado</li>
          <li>Las mejores cuentas de la semana</li>
        </ul>
        <p>Esta información es crucial para el seguimiento de los KPIs del equipo.</p>
        <p>¡Gracias por tu apoyo!</p>
        <p>Saludos,<br>El equipo de TopMarket</p>
      `;
      break;
    default: // Para admin u otros roles
      subject = "🔔 Recordatorio: Actualización de datos semanal";
      messageContent = `
        <p>Hola ${recipient.nombre},</p>
        <p>Te recordamos que debes actualizar la información de tu área para la próxima semana (${weekRange.displayText}).</p>
        <p>Por favor, asegúrate de que todos los datos relevantes estén correctamente registrados en el sistema.</p>
        <p>¡Gracias por tu colaboración!</p>
        <p>Saludos,<br>El equipo de TopMarket</p>
      `;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "TopMarket <notificaciones@topmarket.com.mx>",
        to: recipient.email,
        subject: subject,
        html: messageContent
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error al enviar correo a ${recipient.email}:`, errorText);
      return { error: errorText };
    }

    const data = await res.json();
    return { data };
  } catch (error) {
    console.error(`Error al enviar correo a ${recipient.email}:`, error);
    return { error };
  }
}

serve(async (req) => {
  // Verificar autorización
  // Solo permitir cuando viene de CRON o con una clave válida
  const authHeader = req.headers.get("Authorization");
  
  if (authHeader !== "Bearer CRON" && authHeader !== `Bearer ${supabaseKey}`) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Buscar todos los usuarios
    const { data: usuarios, error } = await supabase
      .from("usuarios_roles")
      .select("*");

    if (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }

    if (!usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ message: "No se encontraron usuarios para notificar" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Filtrar usuarios para enviar recordatorios a roles específicos: evelyn, davila, admin
    const usuariosParaNotificar = usuarios.filter(
      u => ["evelyn", "davila", "admin", "sergio"].includes(u.role)
    );

    // Enviar recordatorios
    const resultados = await Promise.all(
      usuariosParaNotificar.map(usuario => sendReminder(usuario))
    );

    // Resumen de resultados
    const summary = {
      total: usuariosParaNotificar.length,
      enviados: resultados.filter(r => !r.error).length,
      errores: resultados.filter(r => r.error).length,
      detalles: usuariosParaNotificar.map((u, i) => ({
        email: u.email,
        exito: !resultados[i].error,
        error: resultados[i].error || null
      }))
    };

    return new Response(
      JSON.stringify({ 
        message: "Recordatorios de registro semanal enviados", 
        resultados: summary 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error al procesar recordatorios:", error);
    
    return new Response(
      JSON.stringify({ error: "Error al procesar los recordatorios", detalles: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
