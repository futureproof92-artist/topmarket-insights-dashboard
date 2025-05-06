
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
interface LeadsData {
  leads_pub_em: number;
  leads_pub_cl: number;
  leads_frio_em: number;
  leads_frio_cl: number;
  ventas_cerradas: number;
  leads_google_ads: number;
  contactos_frio_cl: number;
  contactos_frio_em: number;
}
interface LeadsFormProps {
  leadsData: LeadsData;
  onLeadsChange: (data: LeadsData) => void;
}
export const LeadsForm = ({
  leadsData,
  onLeadsChange
}: LeadsFormProps) => {
  const handleInputChange = (field: keyof LeadsData, value: string) => {
    // Convertir a número y asegurarse de que sea positivo
    const numValue = Math.max(0, parseInt(value) || 0);
    onLeadsChange({
      ...leadsData,
      [field]: numValue
    });
  };

  // Calcular el total de leads de publicidad
  const totalLeadsPub = useMemo(() => {
    return leadsData.leads_pub_em + leadsData.leads_pub_cl;
  }, [leadsData.leads_pub_em, leadsData.leads_pub_cl]);
  return <Card>
      <CardHeader>
        <CardTitle>Leads Semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="leads_pub_em">LEADS PUB EM</Label>
            <Input id="leads_pub_em" type="number" min="0" value={leadsData.leads_pub_em} onChange={e => handleInputChange('leads_pub_em', e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="leads_pub_cl">LEADS PUB CL</Label>
            <Input id="leads_pub_cl" type="number" min="0" value={leadsData.leads_pub_cl} onChange={e => handleInputChange('leads_pub_cl', e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="leads_frio_em">LEADS FRIO EM</Label>
            <Input id="leads_frio_em" type="number" min="0" value={leadsData.leads_frio_em} onChange={e => handleInputChange('leads_frio_em', e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="leads_frio_cl">LEADS FRIO CL</Label>
            <Input id="leads_frio_cl" type="number" min="0" value={leadsData.leads_frio_cl} onChange={e => handleInputChange('leads_frio_cl', e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="leads_google_ads">TOTAL DE LEADS de GOOGLE ADS</Label>
            <Input id="leads_google_ads" type="number" min="0" value={leadsData.leads_google_ads || 0} onChange={e => handleInputChange('leads_google_ads', e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="ventas_cerradas">VENTAS CERRADAS</Label>
            <Input id="ventas_cerradas" type="number" min="0" value={leadsData.ventas_cerradas} onChange={e => handleInputChange('ventas_cerradas', e.target.value)} className="mt-1" />
          </div>
        </div>
        
        {/* Nueva línea para los campos de contactos en frío */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="contactos_frio_cl">TOTAL DE CONTACTOS EN FRIO CL</Label>
            <Input 
              id="contactos_frio_cl" 
              type="number" 
              min="0" 
              value={leadsData.contactos_frio_cl || 0} 
              onChange={e => handleInputChange('contactos_frio_cl', e.target.value)} 
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label htmlFor="contactos_frio_em">TOTAL DE CONTACTOS EN FRIO EM</Label>
            <Input 
              id="contactos_frio_em" 
              type="number" 
              min="0" 
              value={leadsData.contactos_frio_em || 0} 
              onChange={e => handleInputChange('contactos_frio_em', e.target.value)} 
              className="mt-1" 
            />
          </div>
        </div>
      </CardContent>
    </Card>;
};
