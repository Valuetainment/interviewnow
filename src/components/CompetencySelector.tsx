
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define types
type Competency = {
  id: string;
  name: string;
  description: string;
};

type CompetencySelectorProps = {
  availableCompetencies: Competency[];
  onAddCompetency: (competencyId: string) => void;
  onAddCustomCompetency: (name: string, description: string) => void;
  selectedCompetencies: string[];
};

const CompetencySelector: React.FC<CompetencySelectorProps> = ({
  availableCompetencies,
  onAddCompetency,
  onAddCustomCompetency,
  selectedCompetencies
}) => {
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const availableForSelection = availableCompetencies.filter(
    comp => !selectedCompetencies.includes(comp.id)
  );

  const handleAddCustom = () => {
    if (customName.trim()) {
      onAddCustomCompetency(customName, customDescription);
      setCustomName('');
      setCustomDescription('');
      setIsAddingCustom(false);
    }
  };

  if (isAddingCustom) {
    return (
      <div className="space-y-3 p-3 border rounded-md">
        <h4 className="font-medium">Add Custom Competency</h4>
        <div className="space-y-2">
          <Input 
            placeholder="Competency name" 
            value={customName} 
            onChange={(e) => setCustomName(e.target.value)}
          />
          <Input 
            placeholder="Short description" 
            value={customDescription} 
            onChange={(e) => setCustomDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleAddCustom} size="sm">Add</Button>
            <Button onClick={() => setIsAddingCustom(false)} variant="outline" size="sm">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(value) => onAddCompetency(value)}
        disabled={availableForSelection.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a competency" />
        </SelectTrigger>
        <SelectContent>
          {availableForSelection.map((comp) => (
            <SelectItem key={comp.id} value={comp.id}>
              {comp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        type="button" 
        variant="outline" 
        size="icon"
        onClick={() => setIsAddingCustom(true)}
        title="Add custom competency"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CompetencySelector;
