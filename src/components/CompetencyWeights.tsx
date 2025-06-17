import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import CompetencySelector from './CompetencySelector';

// Define types
type Competency = {
  id: string;
  name: string;
  description: string;
};

type CompetencyWeightsProps = {
  competencies: Competency[];
  weights: Record<string, number>;
  onChange: (weights: Record<string, number>, isValid: boolean) => void;
};

// Define colors for the pie chart
const COLORS = [
  '#8B5CF6', // Vivid Purple
  '#7E69AB', // Secondary Purple
  '#6E59A5', // Tertiary Purple
  '#D6BCFA', // Light Purple
  '#9b87f5', // Primary Purple
  '#E5DEFF', // Soft Purple
];

export const CompetencyWeights: React.FC<CompetencyWeightsProps> = ({ 
  competencies, 
  weights, 
  onChange 
}) => {
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(weights);
  const [totalWeight, setTotalWeight] = useState(0);
  const [customCompetencies, setCustomCompetencies] = useState<Competency[]>([]);
  
  // Combine provided competencies with custom ones
  const allCompetencies = [...competencies, ...customCompetencies];

  // Initialize selected competencies if weights are provided
  useEffect(() => {
    const initialSelected = Object.keys(weights).filter(id => weights[id] > 0);
    
    // Only set selected competencies if there are already weights provided
    // Don't auto-select any competencies if starting fresh
    if (initialSelected.length > 0) {
      setSelectedCompetencies(initialSelected);
    }
  }, [competencies]);

  // Calculate total weight whenever weights change
  useEffect(() => {
    const total = Object.values(localWeights).reduce((sum, weight) => sum + weight, 0);
    setTotalWeight(total);
    onChange(localWeights, total === 100);
  }, [localWeights, onChange]);

  // Add a competency from the dropdown with smart weight redistribution
  const handleAddCompetency = (id: string) => {
    if (!selectedCompetencies.includes(id)) {
      const newSelected = [...selectedCompetencies, id];
      setSelectedCompetencies(newSelected);
      
      // Calculate new weights
      const currentTotal = Object.values(localWeights).reduce((sum, w) => sum + w, 0);
      
      if (currentTotal === 0 || selectedCompetencies.length === 0) {
        // If no weights assigned yet, distribute evenly
        const evenWeight = Math.floor(100 / newSelected.length);
        const remainder = 100 - (evenWeight * newSelected.length);
        
        const newWeights = newSelected.reduce((acc, cId, index) => {
          acc[cId] = evenWeight + (index === 0 ? remainder : 0);
          return acc;
        }, {} as Record<string, number>);
        
        setLocalWeights(newWeights);
      } else if (currentTotal === 100) {
        // If weights are already at 100%, redistribute proportionally
        const newWeights = { ...localWeights };
        
        // Calculate the weight to give to the new competency (e.g., 20% for 5 competencies)
        const targetWeight = Math.floor(100 / newSelected.length);
        
        // Scale down existing weights proportionally
        const scaleFactor = (100 - targetWeight) / 100;
        
        Object.keys(newWeights).forEach(cId => {
          newWeights[cId] = Math.round(newWeights[cId] * scaleFactor);
        });
        
        // Add the new competency with its weight
        newWeights[id] = targetWeight;
        
        // Adjust for rounding errors to ensure total is exactly 100
        const newTotal = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
        if (newTotal !== 100) {
          const diff = 100 - newTotal;
          // Add the difference to the first competency
          const firstId = Object.keys(newWeights)[0];
          newWeights[firstId] += diff;
        }
        
        setLocalWeights(newWeights);
      } else {
        // If total is less than 100%, just add with 0 weight
        setLocalWeights(prev => ({ ...prev, [id]: 0 }));
      }
    }
  };

  // Add a custom competency
  const handleAddCustomCompetency = (name: string, description: string) => {
    const newId = `custom-${Date.now()}`;
    const newCompetency = {
      id: newId,
      name,
      description
    };
    
    setCustomCompetencies(prev => [...prev, newCompetency]);
    handleAddCompetency(newId);
  };

  // Remove a competency with proportional redistribution
  const handleRemoveCompetency = (id: string) => {
    // Remove the competency
    const newSelected = selectedCompetencies.filter(cId => cId !== id);
    setSelectedCompetencies(newSelected);
    
    // Remove weight
    const newWeights = { ...localWeights };
    const removedWeight = newWeights[id] || 0;
    delete newWeights[id];
    
    // Redistribute the removed weight proportionally among remaining competencies
    if (removedWeight > 0 && newSelected.length > 0) {
      const currentTotal = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
      
      if (currentTotal > 0) {
        // Redistribute proportionally based on existing weights
        Object.keys(newWeights).forEach(cId => {
          const proportion = newWeights[cId] / currentTotal;
          newWeights[cId] = Math.round(newWeights[cId] + (removedWeight * proportion));
        });
      } else {
        // If all remaining have 0 weight, distribute evenly
        const evenShare = Math.floor(removedWeight / newSelected.length);
        const remainder = removedWeight - (evenShare * newSelected.length);
        
        newSelected.forEach((cId, index) => {
          newWeights[cId] = evenShare + (index === 0 ? remainder : 0);
        });
      }
      
      // Ensure total is exactly the same as before removal
      const newTotal = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
      const expectedTotal = currentTotal + removedWeight;
      if (newTotal !== expectedTotal && Object.keys(newWeights).length > 0) {
        const diff = expectedTotal - newTotal;
        const firstId = Object.keys(newWeights)[0];
        newWeights[firstId] += diff;
      }
    }
    
    setLocalWeights(newWeights);
  };

  // Update weight for a specific competency
  const updateWeight = (id: string, value: number) => {
    // Ensure weight doesn't make total exceed 100%
    let clampedValue = Math.max(0, Math.min(100, value));
    
    const currentTotal = Object.entries(localWeights)
      .filter(([key]) => key !== id)
      .reduce((sum, [, val]) => sum + val, 0);
    
    // If new total would exceed 100%, clamp the value
    if (currentTotal + clampedValue > 100) {
      clampedValue = 100 - currentTotal;
    }
    
    setLocalWeights(prev => ({ ...prev, [id]: clampedValue }));
  };

  // Distribute weights evenly among selected competencies
  const distributeEvenly = () => {
    if (selectedCompetencies.length === 0) return;
    
    const evenWeight = Math.floor(100 / selectedCompetencies.length);
    const remainder = 100 - (evenWeight * selectedCompetencies.length);
    
    const newWeights = selectedCompetencies.reduce((acc, id, index) => {
      acc[id] = evenWeight + (index === 0 ? remainder : 0);
      return acc;
    }, {} as Record<string, number>);
    
    setLocalWeights(newWeights);
  };

  // Reset all weights
  const resetWeights = () => {
    const newWeights = selectedCompetencies.reduce((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    setLocalWeights(newWeights);
  };

  // Prepare data for pie chart
  const chartData = selectedCompetencies.map(id => {
    const competency = allCompetencies.find(c => c.id === id);
    return {
      name: competency?.name || 'Unknown',
      value: localWeights[id] || 0
    };
  }).filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Show helpful tips when no competencies selected */}
      {selectedCompetencies.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Getting Started:</strong> Select the competencies that are most important for this position. 
            Use the dropdown below to add competencies, then adjust their weights to total 100%.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="font-medium">
          Total: <span className={totalWeight === 100 ? "text-green-600" : "text-red-600"}>
            {totalWeight}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            {totalWeight < 100 ? `(${100 - totalWeight}% remaining)` : 
             totalWeight > 100 ? `(${totalWeight - 100}% over limit)` : ''}
          </span>
        </div>
        <div className="space-x-2">
          <Button 
            type="button"
            variant="outline" 
            onClick={distributeEvenly}
            disabled={selectedCompetencies.length === 0}
          >
            Distribute Evenly
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={resetWeights}
            disabled={selectedCompetencies.length === 0}
          >
            Reset Weights
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <CompetencySelector
          availableCompetencies={allCompetencies}
          selectedCompetencies={selectedCompetencies}
          onAddCompetency={handleAddCompetency}
          onAddCustomCompetency={handleAddCustomCompetency}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {selectedCompetencies.length === 0 ? (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              <p>No competencies selected yet.</p>
              <p className="text-sm mt-2">Use the dropdown above to start adding competencies.</p>
            </div>
          ) : (
            selectedCompetencies.map((id) => {
              const competency = allCompetencies.find(c => c.id === id);
              if (!competency) return null;
              
              return (
                <div 
                  key={id} 
                  className="border rounded-md p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 w-full">
                      <div className="font-medium flex justify-between">
                        <span>{competency.name}</span>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveCompetency(id)}
                          className="h-6 px-2 flex-shrink-0"
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{competency.description}</p>
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Weight:</span>
                          <span className="text-sm font-medium">
                            {localWeights[id] || 0}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Slider 
                            value={[localWeights[id] || 0]} 
                            min={0} 
                            max={100} 
                            step={1}
                            onValueChange={(value) => updateWeight(id, value[0])}
                          />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={localWeights[id] || 0}
                            onChange={(e) => updateWeight(id, parseInt(e.target.value) || 0)}
                            className="w-16 text-right"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="h-80 md:h-auto md:min-h-[320px] flex flex-col">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Legend 
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '14px'
                  }}
                  formatter={(value) => {
                    // Truncate long names in legend if needed
                    return value.length > 20 ? value.substring(0, 17) + '...' : value;
                  }}
                />
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full border rounded-md bg-muted/20">
              <p className="text-muted-foreground text-center">
                Add competencies and assign weights to see the distribution
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
