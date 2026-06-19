"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { formatBudgetInput, type MoveProfile } from "@/lib/move-profile";
import { formatCurrency } from "@/lib/utils";

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  _count: { moves: number };
}

interface MoveDataResponse {
  moveId: string | null;
  profile: MoveProfile | null;
  destinationAddress: string;
  stats: {
    checklist: number;
    inventory: number;
    documents: number;
    vehicles: number;
  };
}

interface AdminUserMoveDialogProps {
  user: AdminUserRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminUserMoveDialog({ user, onClose, onSaved }: AdminUserMoveDialogProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moveId, setMoveId] = useState<string | null>(null);
  const [stats, setStats] = useState<MoveDataResponse["stats"] | null>(null);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [household, setHousehold] = useState("");
  const [budget, setBudget] = useState("");
  const [rentalPreference, setRentalPreference] = useState("");
  const [petDetails, setPetDetails] = useState("");
  const [pets, setPets] = useState(false);
  const [needsHousingHelp, setNeedsHousingHelp] = useState(false);
  const [needsVehicleTransport, setNeedsVehicleTransport] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState("");

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`/api/admin/users/${userId}/move`);
        const data = (await res.json()) as MoveDataResponse;
        if (cancelled) return;

        setMoveId(data.moveId);
        setStats(data.stats);
        setDestinationAddress(data.destinationAddress);

        if (data.profile) {
          const p = data.profile;
          setOrigin(p.origin);
          setDestination(p.destination);
          setMoveDate(p.moveDate);
          setHousehold(p.household);
          setBudget(String(p.budget));
          setRentalPreference(p.rentalPreference);
          setPetDetails(p.petDetails);
          setPets(p.pets);
          setNeedsHousingHelp(p.needsHousingHelp);
          setNeedsVehicleTransport(p.needsVehicleTransport);
        }
      } catch {
        if (!cancelled) setError(t("admin.moveLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  async function handleCreateMove() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({ createMove: true }),
      });
      const data = (await res.json()) as MoveDataResponse;
      setMoveId(data.moveId);
      setStats(data.stats);
      if (data.profile) {
        setOrigin(data.profile.origin);
        setDestination(data.profile.destination);
        setMoveDate(data.profile.moveDate);
        setHousehold(data.profile.household);
        setBudget(formatBudgetInput(data.profile.budget));
        setRentalPreference(data.profile.rentalPreference);
        setPetDetails(data.profile.petDetails);
        setPets(data.profile.pets);
        setNeedsHousingHelp(data.profile.needsHousingHelp);
        setNeedsVehicleTransport(data.profile.needsVehicleTransport);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.moveSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          profile: {
            origin,
            destination,
            moveDate,
            household,
            budget: Number(budget) || 0,
            rentalPreference,
            pets,
            petDetails,
            needsHousingHelp,
            needsVehicleTransport,
          },
          destinationAddress: destinationAddress || null,
        }),
      });
      const data = (await res.json()) as MoveDataResponse;
      setMoveId(data.moveId);
      setStats(data.stats);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.moveSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("admin.manageMove")}
          </DialogTitle>
          <DialogDescription>
            {user?.name} · {user?.email}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : !moveId ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t("admin.noMoveYet")}</p>
            <Button onClick={handleCreateMove} disabled={saving}>
              {saving ? t("common.loading") : t("admin.createMove")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {stats && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {t("admin.statChecklist")}: {stats.checklist}
                </Badge>
                <Badge variant="secondary">
                  {t("admin.statInventory")}: {stats.inventory}
                </Badge>
                <Badge variant="secondary">
                  {t("admin.statDocuments")}: {stats.documents}
                </Badge>
                <Badge variant="secondary">
                  {t("admin.statVehicles")}: {stats.vehicles}
                </Badge>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("onboarding.origin")}</Label>
                <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("onboarding.destination")}</Label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("onboarding.newAddress")}</Label>
              <Input
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder={t("onboarding.addressPlaceholder")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("onboarding.moveDate")}</Label>
                <Input
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("onboarding.estimatedBudget")}</Label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("onboarding.household")}</Label>
              <Input value={household} onChange={(e) => setHousehold(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t("onboarding.rentalPreference")}</Label>
              <Input
                value={rentalPreference}
                onChange={(e) => setRentalPreference(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-pets"
                checked={pets}
                onCheckedChange={(v) => setPets(v === true)}
              />
              <Label htmlFor="admin-pets">{t("onboarding.pets")}</Label>
            </div>

            {pets && (
              <div className="space-y-2">
                <Label>{t("onboarding.petDetails")}</Label>
                <Input value={petDetails} onChange={(e) => setPetDetails(e.target.value)} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="admin-housing"
                  checked={needsHousingHelp}
                  onCheckedChange={(v) => setNeedsHousingHelp(v === true)}
                />
                <Label htmlFor="admin-housing">{t("onboarding.needHousing")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="admin-transport"
                  checked={needsVehicleTransport}
                  onCheckedChange={(v) => setNeedsVehicleTransport(v === true)}
                />
                <Label htmlFor="admin-transport">{t("onboarding.needTransport")}</Label>
              </div>
            </div>

            {budget && (
              <p className="text-xs text-muted-foreground">
                {t("dashboardPage.estimatedBudget")}: {formatCurrency(Number(budget) || 0)}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {moveId && !loading && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              className="sm:mr-auto"
              disabled={saving}
              onClick={async () => {
                if (!moveId || !window.confirm(t("adminConsole.deleteMoveConfirm", {
                  route: `${origin} → ${destination}`,
                  owner: user?.name ?? "",
                }))) return;
                setSaving(true);
                try {
                  await apiFetch(`/api/admin/moves/${moveId}`, { method: "DELETE" });
                  onSaved();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : t("admin.moveSaveError"));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {t("adminConsole.deleteMove")}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
