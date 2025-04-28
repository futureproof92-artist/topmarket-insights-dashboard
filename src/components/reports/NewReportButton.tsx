import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import { NewReportForm } from './NewReportForm';
interface NewReportButtonProps {
  userRole: string;
}
export const NewReportButton = ({
  userRole
}: NewReportButtonProps) => {
  return <Dialog>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo reporte</DialogTitle>
        </DialogHeader>
        <NewReportForm userRole={userRole} />
      </DialogContent>
    </Dialog>;
};