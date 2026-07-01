"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, ShoppingCart } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import {
  MOVING_PRODUCTS,
  PRESET_LABELS,
  PRESET_QUANTITIES,
  type MovingPresetKey,
} from "@/lib/amazon/moving-shopping";
import { buildAmazonCartUrl, buildAmazonSearchUrl } from "@/lib/amazon/links";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShoppingItemState {
  id: string;
  name: string;
  description: string;
  estimatedPrice: number;
  quantity: number;
  selected: boolean;
  asin: string;
}

interface AmazonSettingsResponse {
  associateTag: string;
  marketplaceDomain: string;
  defaultProducts: Record<string, string>;
  hasAssociateTag: boolean;
}

const STORAGE_KEY = "movepilot_shopping_list_v1";

function clampQty(input: number): number {
  if (!Number.isFinite(input)) return 1;
  return Math.max(1, Math.floor(input));
}

function baseItems(defaultProducts: Record<string, string>): ShoppingItemState[] {
  return MOVING_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    estimatedPrice: product.estimatedPrice,
    quantity: 1,
    selected: true,
    asin: defaultProducts[product.id] ?? "",
  }));
}

export default function ShoppingListPage() {
  const t = useT();
  const [settings, setSettings] = useState<AmazonSettingsResponse | null>(null);
  const [items, setItems] = useState<ShoppingItemState[]>([]);
  const [preset, setPreset] = useState<MovingPresetKey>("studio");
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/amazon/settings");
        const json = (await res.json()) as AmazonSettingsResponse;
        setSettings(json);
        const fromDefaults = baseItems(json.defaultProducts);
        const savedRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (!savedRaw) {
          setItems(fromDefaults);
          return;
        }

        const parsed = JSON.parse(savedRaw) as Partial<ShoppingItemState>[];
        const merged = fromDefaults.map((item) => {
          const saved = parsed.find((p) => p.id === item.id);
          if (!saved) return item;
          return {
            ...item,
            quantity: clampQty(Number(saved.quantity ?? item.quantity)),
            selected: saved.selected ?? item.selected,
            asin: typeof saved.asin === "string" ? saved.asin : item.asin,
          };
        });
        setItems(merged);
      } catch {
        setSettings({
          associateTag: "",
          marketplaceDomain: "www.amazon.com",
          defaultProducts: {},
          hasAssociateTag: false,
        });
        setItems(baseItems({}));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (!items.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totalEstimate = useMemo(
    () =>
      items
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + item.estimatedPrice * clampQty(item.quantity), 0),
    [items]
  );

  const selectedMissingAsin = useMemo(
    () => items.filter((item) => item.selected && !item.asin.trim()),
    [items]
  );

  const validCartSelection = useMemo(
    () => items.filter((item) => item.selected && item.asin.trim() && item.quantity >= 1),
    [items]
  );

  const cartUrl = useMemo(() => {
    if (!settings) return null;
    return buildAmazonCartUrl(validCartSelection, settings.associateTag, settings.marketplaceDomain);
  }, [validCartSelection, settings]);

  const canOpenCart = Boolean(
    settings &&
      settings.marketplaceDomain.trim().length > 0 &&
      cartUrl
  );

  const applyPreset = (nextPreset: MovingPresetKey) => {
    setPreset(nextPreset);
    const qtys = PRESET_QUANTITIES[nextPreset];
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantity: clampQty(qtys[item.id] ?? item.quantity),
      }))
    );
  };

  const updateItem = (id: string, patch: Partial<ShoppingItemState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const openAmazonCart = () => {
    if (!cartUrl) return;
    setWarning(
      selectedMissingAsin.length
        ? "Some items need an Amazon product selected before they can be added."
        : null
    );
    window.open(cartUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <DashboardHeader
        title="Moving Shopping List"
        description="Build your moving-supplies list and open Amazon cart for checkout."
      />
      <PageContainer>
        <PageHeader />

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm space-y-1 text-muted-foreground">
            <p>
              Amazon checkout happens on Amazon only. This app never processes Amazon payments.
            </p>
            <p>
              ASINs are manual configuration only. No scraping or crawling is used.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Smart presets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(PRESET_LABELS) as MovingPresetKey[]).map((key) => (
              <Button
                key={key}
                type="button"
                variant={preset === key ? "default" : "outline"}
                onClick={() => applyPreset(key)}
              >
                {PRESET_LABELS[key]}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} className="lg:col-span-1">
                  <CardContent className="p-4 text-sm text-muted-foreground">{t("common.loading")}</CardContent>
                </Card>
              ))
            : items.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(v) => updateItem(item.id, { selected: Boolean(v) })}
                          aria-label={`Select ${item.name}`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${item.id}-asin`}>Amazon ASIN (optional)</Label>
                      <Input
                        id={`${item.id}-asin`}
                        value={item.asin}
                        placeholder="e.g. B0XXXXXXXX"
                        onChange={(e) => updateItem(item.id, { asin: e.target.value.trim().toUpperCase() })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${item.id}-qty`}>Quantity</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateItem(item.id, { quantity: clampQty(item.quantity - 1) })}
                        >
                          -
                        </Button>
                        <Input
                          id={`${item.id}-qty`}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, { quantity: clampQty(Number(e.target.value || 1)) })
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateItem(item.id, { quantity: clampQty(item.quantity + 1) })}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Estimated: ${(item.estimatedPrice * clampQty(item.quantity)).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <Card className="border-dashed">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Total estimated cost</p>
              <p className="text-2xl font-semibold">${totalEstimate.toFixed(2)}</p>
            </div>

            {warning && (
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {warning}
              </p>
            )}

            {!!selectedMissingAsin.length && (
              <p className="text-sm text-muted-foreground">
                Some items need an Amazon product selected before they can be added.
              </p>
            )}

            <Button
              className="w-full h-12 text-base"
              disabled={!canOpenCart}
              onClick={openAmazonCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Open Amazon Cart
            </Button>

            {!!selectedMissingAsin.length && settings && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Fallback search links</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMissingAsin.map((item) => (
                    <Button key={item.id} variant="outline" size="sm" asChild>
                      <a
                        href={buildAmazonSearchUrl(
                          item.name,
                          settings.marketplaceDomain,
                          settings.associateTag
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {item.name}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
