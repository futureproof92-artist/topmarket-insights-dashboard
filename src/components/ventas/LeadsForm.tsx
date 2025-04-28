
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LeadsData {
  leads_pub_em: number;
  leads_pub_cl: number;
  leads_frio_em: number;
  leads_frio_cl: number;
  ventas_cerradas: number;
}

interface LeadsFormProps {
  leadsData: LeadsData;
  onLeadsChange: (data: LeadsData) => void;
}

export const LeadsForm = ({ leadsData, onLeadsChange }: LeadsFormProps) => {
  const handleInputChange = (field: keyof LeadsData, value: string) => {
    // Convertir a número y asegurarse de que sea positivo
    const numValue = Math.max(0, parseInt(value) || 0);
    
    onLeadsChange({
      ...leadsData,
      [field]: numValue
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="leads_pub_em">LEADS PUB EM</Label>
            <Input 
              id="leads_pub_em"
              type="number"
              min="0"
              value={leadsData.leads_pub_em}
              onChange={(e) => handleInputChange('leads_pub_em', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="leads_pub_cl">LEADS PUB CL</Label>
            <Input 
              id="leads_pub_cl"
              type="number"
              min="0"
              value={leadsData.leads_pub_cl}
              onChange={(e) => handleInputChange('leads_pub_cl', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="leads_frio_em">LEADS FRIO EM</Label>
            <Input 
              id="leads_frio_em"
              type="number"
              min="0"
              value={leadsData.leads_frio_em}
              onChange={(e) => handleInputChange('leads_frio_em', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="leads_frio_cl">LEADS FRIO CL</Label>
            <Input 
              id="leads_frio_cl"
              type="number"
              min="0"
              value={leadsData.leads_frio_cl}
              onChange={(e) => handleInputChange('leads_frio_cl', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="ventas_cerradas">VENTAS CERRADAS</Label>
            <Input 
              id="ventas_cerradas"
              type="number"
              min="0"
              value={leadsData.ventas_cerradas}
              onChange={(e) => handleInputChange('ventas_cerradas', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
