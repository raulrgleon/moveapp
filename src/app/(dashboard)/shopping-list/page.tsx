"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, ShoppingCart } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { useT } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { useMove } from "@/contexts/move-context";
import { useMovingSupplies } from "@/hooks/use-moving-supplies";
import { apiFetch } from "@/lib/api-client";
import { shoppingListStorageKey } from "@/lib/amazon/shopping-list-storage";
import {
  MOVING_PRODUCTS,
  PRESET_QUANTITIES,
  type MovingPresetKey,
} from "@/lib/amazon/moving-shopping";
import {
  AMAZON_CART_MAX_ITEMS,
  buildAmazonCartFormConfig,
  buildAmazonSearchUrl,
} from "@/lib/amazon/links";
import {
  countGatheredShoppingProducts,
  isShoppingProductGathered,
} from "@/lib/inventory/supply-shopping-bridge";
import { Badge } from "@/components/ui/badge";
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

const PRESET_KEYS: MovingPresetKey[] = ["studio", "two_bed", "three_bed", "four_plus"];
const LEGACY_STORAGE_KEY = "movepilot_shopping_list_v1";

function clampQty(input: number): number {
  if (!Number.isFinite(input)) return 1;
  return Math.max(1, Math.floor(input));
}

function applySupplyGathered(
  items: ShoppingItemState[],
  supplyChecks: Record<string, boolean>
): ShoppingItemState[] {
  return items.map((item) =>
    isShoppingProductGathered(item.id, supplyChecks)
      ? { ...item, selected: false }
      : item
  );
}

export default function ShoppingListPage() {
  const t = useT();
  const { user } = useAuth();
  const { profile } = useMove();
  const { checked: supplyChecks, isHydrated: suppliesHydrated } = useMovingSupplies();
  const [settings, setSettings] = useState<AmazonSettingsResponse | null>(null);
  const [items, setItems] = useState<ShoppingItemState[]>([]);
  const [preset, setPreset] = useState<MovingPresetKey>("studio");
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const cartFormRef = useRef<HTMLFormElement>(null);

  const storageKey = useMemo(
    () =>
      shoppingListStorageKey({
        userId: user?.id,
        email: user?.email,
        origin: profile.origin,
        destination: profile.destination,
        moveDate: profile.moveDate,
      }),
    [user?.id, user?.email, profile.origin, profile.destination, profile.moveDate]
  );

  const productLabel = useCallback(
    (id: string, field: "name" | "description") =>
      t(`amazonShopping.products.${id}.${field}`),
    [t]
  );

  const baseItems = useCallback(
    (defaultProducts: Record<string, string>): ShoppingItemState[] =>
      MOVING_PRODUCTS.map((product) => ({
        id: product.id,
        name: productLabel(product.id, "name"),
        description: productLabel(product.id, "description"),
        estimatedPrice: product.estimatedPrice,
        quantity: 1,
        selected: true,
        asin: defaultProducts[product.id] ?? "",
      })),
    [productLabel]
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/amazon/settings");
        const json = (await res.json()) as AmazonSettingsResponse;
        setSettings(json);
        const fromDefaults = baseItems(json.defaultProducts);
        if (typeof window === "undefined") {
          setItems(fromDefaults);
          return;
        }

        let savedRaw = localStorage.getItem(storageKey);
        if (!savedRaw && storageKey !== LEGACY_STORAGE_KEY) {
          savedRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        }
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
            asin: item.asin,
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
  }, [baseItems, storageKey]);

  useEffect(() => {
    if (!suppliesHydrated || !items.length) return;
    setItems((prev) => applySupplyGathered(prev, supplyChecks));
  }, [supplyChecks, suppliesHydrated]);

  useEffect(() => {
    if (!items.length || typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const supplySync = useMemo(
    () => countGatheredShoppingProducts(supplyChecks),
    [supplyChecks]
  );

  const stillNeeded = useMemo(
    () => items.filter((item) => !isShoppingProductGathered(item.id, supplyChecks)),
    [items, supplyChecks]
  );

  const gathered = useMemo(
    () => items.filter((item) => isShoppingProductGathered(item.id, supplyChecks)),
    [items, supplyChecks]
  );

  const totalEstimate = useMemo(
    () =>
      stillNeeded
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + item.estimatedPrice * clampQty(item.quantity), 0),
    [stillNeeded]
  );

  const selectedMissingAsin = useMemo(
    () => stillNeeded.filter((item) => item.selected && !item.asin.trim()),
    [stillNeeded]
  );

  const validCartSelection = useMemo(
    () =>
      stillNeeded.filter(
        (item) => item.selected && item.asin.trim() && item.quantity >= 1
      ),
    [stillNeeded]
  );

  const cartSelection = useMemo(
    () =>
      validCartSelection.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        asin: item.asin,
        selected: true,
      })),
    [validCartSelection]
  );

  const cartForm = useMemo(() => {
    if (!settings) return null;
    return buildAmazonCartFormConfig(
      cartSelection,
      settings.associateTag,
      settings.marketplaceDomain
    );
  }, [cartSelection, settings]);

  const cartItemCount = cartSelection.length;
  const cartTruncated = cartItemCount > AMAZON_CART_MAX_ITEMS;

  const canOpenCart = Boolean(settings?.marketplaceDomain.trim() && cartForm);

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
    if (!cartForm) return;
    if (selectedMissingAsin.length) {
      setWarning(t("amazonShopping.partialCartWarning"));
    } else if (cartTruncated) {
      setWarning(t("amazonShopping.cartLimitWarning", { max: AMAZON_CART_MAX_ITEMS }));
    } else {
      setWarning(null);
    }
    cartFormRef.current?.submit();
  };

  const renderItemCard = (item: ShoppingItemState, gatheredItem = false) => (
    <Card key={item.id} className={gatheredItem ? "opacity-75 border-emerald-500/30" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{item.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            {gatheredItem && (
              <Badge variant="secondary" className="mt-2 text-[10px]">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t("amazonShopping.inSuppliesChecklist")}
              </Badge>
            )}
          </div>
          {!gatheredItem && (
            <Checkbox
              checked={item.selected}
              onCheckedChange={(v) => updateItem(item.id, { selected: Boolean(v) })}
              aria-label={t("amazonShopping.selectItem", { name: item.name })}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!gatheredItem && (
          <div className="space-y-2">
            <Label htmlFor={`${item.id}-qty`}>{t("amazonShopping.quantity")}</Label>
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
        )}
        <p className="text-sm text-muted-foreground">
          {t("amazonShopping.estimated", {
            amount: (item.estimatedPrice * clampQty(item.quantity)).toFixed(2),
          })}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <DashboardHeader
        title={t("amazonShopping.title")}
        description={t("amazonShopping.pageDesc")}
      />
      <PageContainer>
        <PageHeader />

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm space-y-2 text-muted-foreground">
            <p>{t("amazonShopping.disclaimerPayments")}</p>
            <p>{t("amazonShopping.disclaimerAsins")}</p>
            {suppliesHydrated && supplySync.gathered > 0 && (
              <p className="text-foreground font-medium">
                {t("amazonShopping.suppliesSync", {
                  gathered: supplySync.gathered,
                  total: supplySync.total,
                })}{" "}
                <Link
                  href="/inventory?tab=supplies"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {t("amazonShopping.openSuppliesChecklist")}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("amazonShopping.presetsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PRESET_KEYS.map((key) => (
              <Button
                key={key}
                type="button"
                variant={preset === key ? "default" : "outline"}
                onClick={() => applyPreset(key)}
              >
                {t(`amazonShopping.presets.${key}`)}
              </Button>
            ))}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  {t("common.loading")}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {stillNeeded.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">{t("amazonShopping.stillNeed")}</h2>
                <div className="grid gap-4 lg:grid-cols-3">
                  {stillNeeded.map((item) => renderItemCard(item))}
                </div>
              </div>
            )}

            {gathered.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {t("amazonShopping.alreadyGathered")}
                </h2>
                <div className="grid gap-4 lg:grid-cols-3">
                  {gathered.map((item) => renderItemCard(item, true))}
                </div>
              </div>
            )}
          </>
        )}

        <Card className="border-dashed">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("amazonShopping.totalEstimate")}</p>
              <p className="text-2xl font-semibold">${totalEstimate.toFixed(2)}</p>
            </div>

            {cartItemCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("amazonShopping.cartReady", { count: Math.min(cartItemCount, AMAZON_CART_MAX_ITEMS) })}
              </p>
            )}

            <p className="text-xs text-muted-foreground">{t("amazonShopping.cartFlowHint")}</p>

            {warning && (
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {warning}
              </p>
            )}

            {!!selectedMissingAsin.length && (
              <p className="text-sm text-muted-foreground">
                {t("amazonShopping.missingAsinHint")}
              </p>
            )}

            {cartForm && (
              <form
                ref={cartFormRef}
                action={cartForm.action}
                method="GET"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden"
                aria-hidden
              >
                {Object.entries(cartForm.fields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
              </form>
            )}

            <Button className="w-full h-12 text-base" disabled={!canOpenCart} onClick={openAmazonCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t("amazonShopping.openCart", {
                count: Math.min(cartItemCount, AMAZON_CART_MAX_ITEMS),
              })}
            </Button>

            {!!selectedMissingAsin.length && settings && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">{t("amazonShopping.fallbackLinks")}</p>
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

            <p className="text-xs text-muted-foreground pt-2 border-t">
              {t("movingSupplies.checklistLink")}{" "}
              <Link
                href="/inventory?tab=supplies"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("movingSupplies.checklistLinkAction")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
