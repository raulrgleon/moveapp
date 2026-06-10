"use client";

import { Plus, Trash2 } from "lucide-react";
import { VehicleSelector } from "@/components/vehicles/vehicle-selector";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { createEmptyVehicle } from "@/lib/vehicles/types";

const MAX_VEHICLES = 5;

interface VehicleListEditorProps {
  vehicles: VehicleInfo[];
  onChange: (vehicles: VehicleInfo[]) => void;
  showTips?: boolean;
}

export function VehicleListEditor({
  vehicles,
  onChange,
  showTips = true,
}: VehicleListEditorProps) {
  const t = useT();

  const updateAt = (index: number, vehicle: VehicleInfo) => {
    const next = [...vehicles];
    next[index] = vehicle;
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (vehicles.length <= 1) return;
    onChange(vehicles.filter((_, i) => i !== index));
  };

  const addVehicle = () => {
    if (vehicles.length >= MAX_VEHICLES) return;
    onChange([...vehicles, createEmptyVehicle()]);
  };

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <Card key={vehicle.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">
                {index === 0
                  ? t("vehicleList.primary")
                  : t("vehicleList.vehicleN", { n: index + 1 })}
              </CardTitle>
              {vehicles.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeAt(index)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("vehicleList.remove")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <VehicleSelector
              value={vehicle}
              onChange={(updated) => updateAt(index, { ...updated, id: vehicle.id })}
              showTips={showTips && index === 0}
            />
          </CardContent>
        </Card>
      ))}

      {vehicles.length < MAX_VEHICLES && (
        <Button type="button" variant="outline" className="w-full" onClick={addVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          {t("vehicleList.addAnother")}
        </Button>
      )}

      {vehicles.length >= MAX_VEHICLES && (
        <p className="text-xs text-muted-foreground text-center">
          {t("vehicleList.maxVehicles", { max: MAX_VEHICLES })}
        </p>
      )}
    </div>
  );
}
