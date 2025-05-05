export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cobranza: {
        Row: {
          cobrado_total: number
          created_at: string | null
          id: string
          pagos_no_confirmados: number
          semana: string
          semana_fin: string
          semana_inicio: string
          updated_at: string | null
        }
        Insert: {
          cobrado_total?: number
          created_at?: string | null
          id?: string
          pagos_no_confirmados?: number
          semana: string
          semana_fin: string
          semana_inicio: string
          updated_at?: string | null
        }
        Update: {
          cobrado_total?: number
          created_at?: string | null
          id?: string
          pagos_no_confirmados?: number
          semana?: string
          semana_fin?: string
          semana_inicio?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hh_cerrados: {
        Row: {
          created_at: string | null
          id: string
          semana: string
          semana_fin: string
          semana_inicio: string
          total_cuentas: number
          total_hh: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          semana: string
          semana_fin: string
          semana_inicio: string
          total_cuentas?: number
          total_hh?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          semana?: string
          semana_fin?: string
          semana_inicio?: string
          total_cuentas?: number
          total_hh?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      historial_semanal: {
        Row: {
          created_at: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          leads_frio_cl: number | null
          leads_frio_em: number | null
          leads_pub_cl: number | null
          leads_pub_em: number | null
          semana: string
          updated_at: string | null
          ventas_cerradas: number | null
        }
        Insert: {
          created_at?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          leads_frio_cl?: number | null
          leads_frio_em?: number | null
          leads_pub_cl?: number | null
          leads_pub_em?: number | null
          semana: string
          updated_at?: string | null
          ventas_cerradas?: number | null
        }
        Update: {
          created_at?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          leads_frio_cl?: number | null
          leads_frio_em?: number | null
          leads_pub_cl?: number | null
          leads_pub_em?: number | null
          semana?: string
          updated_at?: string | null
          ventas_cerradas?: number | null
        }
        Relationships: []
      }
      pxr_cerrados: {
        Row: {
          created_at: string | null
          id: string
          mejores_cuentas: string | null
          semana: string
          semana_fin: string
          semana_inicio: string
          total_pxr: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mejores_cuentas?: string | null
          semana: string
          semana_fin: string
          semana_inicio: string
          total_pxr?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mejores_cuentas?: string | null
          semana?: string
          semana_fin?: string
          semana_inicio?: string
          total_pxr?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      reclutamiento: {
        Row: {
          created_at: string | null
          freelancers_confirmados: number
          id: string
          reclutamientos_confirmados: number
          semana: string
          semana_fin: string
          semana_inicio: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          freelancers_confirmados?: number
          id?: string
          reclutamientos_confirmados?: number
          semana: string
          semana_fin: string
          semana_inicio: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          freelancers_confirmados?: number
          id?: string
          reclutamientos_confirmados?: number
          semana?: string
          semana_fin?: string
          semana_inicio?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios_roles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nombre: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ventas_detalle: {
        Row: {
          cliente: string
          costo_unitario: number
          created_at: string | null
          historial_id: string | null
          id: string
          tipo_servicio: string
          total_vacs: number
          ubicacion: string
          updated_at: string | null
        }
        Insert: {
          cliente: string
          costo_unitario: number
          created_at?: string | null
          historial_id?: string | null
          id?: string
          tipo_servicio: string
          total_vacs: number
          ubicacion: string
          updated_at?: string | null
        }
        Update: {
          cliente?: string
          costo_unitario?: number
          created_at?: string | null
          historial_id?: string | null
          id?: string
          tipo_servicio?: string
          total_vacs?: number
          ubicacion?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_detalle_historial_id_fkey"
            columns: ["historial_id"]
            isOneToOne: false
            referencedRelation: "historial_semanal"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_email: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
