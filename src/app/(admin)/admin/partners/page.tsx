"use client";

import { useCallback, useEffect, useState } from "react";
import { Handshake, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useT } from "@/contexts/locale-context";
import { specialtyLabel } from "@/lib/partner/directory";
import type { MovingPartnerRecord } from "@/lib/partner/partner-store";
import { apiFetch } from "@/lib/api-client";

interface PartnerForm {
  name: string;
  regions: string;
  usdot: string;
  rating: string;
  yearsInBusiness: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  active: boolean;
  sortOrder: string;
  specialties: string[];
}

const emptyForm = (): PartnerForm => ({
  name: "",
  regions: "Nationwide, US",
  usdot: "",
  rating: "",
  yearsInBusiness: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
  active: true,
  sortOrder: "0",
  specialties: ["local", "long_distance"],
});

function formFromPartner(partner: MovingPartnerRecord): PartnerForm {
  return {
    name: partner.name,
    regions: partner.regions.join(", "),
    usdot: partner.usdot ?? "",
    rating: partner.rating != null ? String(partner.rating) : "",
    yearsInBusiness: partner.yearsInBusiness != null ? String(partner.yearsInBusiness) : "",
    website: partner.website ?? "",
    contactEmail: partner.contactEmail ?? "",
    contactPhone: partner.contactPhone ?? "",
    notes: partner.notes ?? "",
    active: partner.active,
    sortOrder: String(partner.sortOrder),
    specialties: [...partner.specialties],
  };
}

function payloadFromForm(form: PartnerForm) {
  return {
    name: form.name.trim(),
    regions: form.regions
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
    usdot: form.usdot.trim() || null,
    rating: form.rating ? Number(form.rating) : null,
    yearsInBusiness: form.yearsInBusiness ? Number(form.yearsInBusiness) : null,
    website: form.website.trim() || null,
    contactEmail: form.contactEmail.trim() || null,
    contactPhone: form.contactPhone.trim() || null,
    notes: form.notes.trim() || null,
    active: form.active,
    sortOrder: Number(form.sortOrder) || 0,
    specialties: form.specialties,
  };
}

export default function AdminPartnersPage() {
  const t = useT();
  const { locale } = useLocale();
  const [partners, setPartners] = useState<MovingPartnerRecord[]>([]);
  const [specialtyOptions, setSpecialtyOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/partners");
      const data = (await res.json()) as {
        partners: MovingPartnerRecord[];
        specialtyOptions: string[];
      };
      setPartners(data.partners);
      setSpecialtyOptions(data.specialtyOptions);
    } catch {
      setError(t("adminConsole.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (partner: MovingPartnerRecord) => {
    setEditingId(partner.id);
    setForm(formFromPartner(partner));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = payloadFromForm(form);
      const res = await apiFetch(
        editingId ? `/api/admin/partners/${editingId}` : "/api/admin/partners",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("save failed");
      setDialogOpen(false);
      await load();
    } catch {
      setError(t("adminConsole.partnerSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(t("adminConsole.partnerDeleteConfirm", { name }))) return;
    await apiFetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    await load();
  };

  const toggleSpecialty = (key: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(key)
        ? prev.specialties.filter((s) => s !== key)
        : [...prev.specialties, key],
    }));
  };

  return (
    <>
      <AdminHeader
        title={t("adminConsole.partners")}
        description={t("adminConsole.partnersDesc")}
      />
      <AdminPageContainer>
        <PageHeader
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("adminConsole.addPartner")}
            </Button>
          }
        />

        <Card className="border-dashed bg-muted/20 mb-4">
          <CardContent className="p-4 text-sm text-muted-foreground flex items-start gap-2">
            <Handshake className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            {t("adminConsole.partnersHint")}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminConsole.partnerName")}</TableHead>
                  <TableHead>{t("adminConsole.partnerRegions")}</TableHead>
                  <TableHead>{t("adminConsole.partnerSpecialties")}</TableHead>
                  <TableHead>{t("adminConsole.partnerContact")}</TableHead>
                  <TableHead>{t("adminConsole.partnerStatus")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <p className="font-medium">{partner.name}</p>
                      {partner.usdot && (
                        <p className="text-xs text-muted-foreground">USDOT {partner.usdot}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{partner.regions.join(", ")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[14rem]">
                        {partner.specialties.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {specialtyLabel(s, locale)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {partner.contactEmail && <p>{partner.contactEmail}</p>}
                      {partner.website && (
                        <p className="text-xs text-muted-foreground truncate max-w-[12rem]">
                          {partner.website}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={partner.active ? "default" : "secondary"}>
                        {partner.active ? t("adminConsole.active") : t("adminConsole.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(partner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void remove(partner.id, partner.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? t("adminConsole.editPartner") : t("adminConsole.addPartner")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t("adminConsole.partnerName")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminConsole.partnerRegions")}</Label>
                <Input
                  placeholder="Nationwide, US, Texas"
                  value={form.regions}
                  onChange={(e) => setForm((p) => ({ ...p, regions: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>USDOT</Label>
                  <Input
                    value={form.usdot}
                    onChange={(e) => setForm((p) => ({ ...p, usdot: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("adminConsole.partnerRating")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={form.rating}
                    onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("adminConsole.partnerYears")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.yearsInBusiness}
                    onChange={(e) => setForm((p) => ({ ...p, yearsInBusiness: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("adminConsole.partnerSort")}</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("adminConsole.partnerWebsite")}</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("adminConsole.partnerEmail")}</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("adminConsole.partnerPhone")}</Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("adminConsole.partnerSpecialties")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specialtyOptions.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.specialties.includes(key)}
                        onCheckedChange={() => toggleSpecialty(key)}
                      />
                      {specialtyLabel(key, locale)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("adminConsole.partnerNotes")}</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, active: v === true }))}
                />
                {t("adminConsole.partnerVisible")}
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => void save()} disabled={saving || !form.name.trim()}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminPageContainer>
    </>
  );
}
