"use client";

import { useState } from "react";
import { Image, Plus, QrCode, Search } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { INVENTORY_BOXES } from "@/lib/mock-data";

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const filtered = INVENTORY_BOXES.filter(
    (box) =>
      box.room.toLowerCase().includes(search.toLowerCase()) ||
      box.contents.toLowerCase().includes(search.toLowerCase()) ||
      String(box.boxNumber).includes(search)
  );

  return (
    <>
      <DashboardHeader title="Inventory" description="Track boxes and contents" />
      <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
        <PageHeader
          title="Inventory Manager"
          description={`${INVENTORY_BOXES.length} boxes tracked`}
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add box
            </Button>
          }
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by box #, room, or contents..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((box) => (
            <Card key={box.id} className="overflow-hidden">
              <div className="flex h-24 items-center justify-center bg-muted/50 border-b">
                {box.hasPhoto ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Image className="h-8 w-8" />
                    <span className="text-xs">Photo placeholder</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Image className="h-8 w-8 opacity-40" />
                    <span className="text-xs">No photo</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">Box #{box.boxNumber}</p>
                    <p className="text-sm text-primary">{box.room}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted/30">
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{box.contents}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No boxes match your search.
          </div>
        )}
      </div>
    </>
  );
}
