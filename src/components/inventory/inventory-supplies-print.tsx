"use client";

import { useEffect } from "react";

interface PrintRow {
  id: string;
  label: string;
  qty: number;
  unit: string;
  checked: boolean;
  category: string;
}

interface InventorySuppliesPrintProps {
  active: boolean;
  onDone: () => void;
  title: string;
  household: string;
  locale: string;
  rows: PrintRow[];
}

export function InventorySuppliesPrint({
  active,
  onDone,
  title,
  household,
  locale,
  rows,
}: InventorySuppliesPrintProps) {
  useEffect(() => {
    if (!active) return;
    requestAnimationFrame(() => {
      window.print();
      onDone();
    });
  }, [active, onDone]);

  if (!active) return null;

  const grouped = rows.reduce<Record<string, PrintRow[]>>((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});

  return (
    <div id="inventory-supplies-print" className="hidden print:block">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #inventory-supplies-print, #inventory-supplies-print * { visibility: visible; }
          #inventory-supplies-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="p-8 text-black">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">{household}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date().toLocaleDateString(locale === "es" ? "es-ES" : "en-US")}
        </p>
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-bold uppercase tracking-wide border-b pb-1 mb-2">
                {category}
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                    <span className="inline-block h-4 w-4 border border-gray-400 rounded-sm shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-gray-600 shrink-0">
                      {item.qty} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
