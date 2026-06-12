"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Ban,
  LogOut,
} from "lucide-react";
import { AdminUserMoveDialog } from "@/components/admin/admin-user-move-dialog";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAuth } from "@/contexts/auth-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TableScroll } from "@/components/dashboard/table-scroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { invalidateUserData } from "@/lib/data-cache";

interface AdminUserRow {
  id: string;
  email: string;
  username: string | null;
  name: string;
  role: string;
  createdAt: string;
  suspendedAt: string | null;
  _count: { moves: number; sessions: number };
}

function AdminUsersPage() {
  const t = useT();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [createRole, setCreateRole] = useState<"user" | "admin">("user");

  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin">("user");

  const [resetUser, setResetUser] = useState<AdminUserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [deleteUser, setDeleteUser] = useState<AdminUserRow | null>(null);
  const [moveUser, setMoveUser] = useState<AdminUserRow | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/users");
      const data = (await res.json()) as { users: AdminUserRow[] };
      setUsers(data.users);
    } catch {
      setError(t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, name, password, role: createRole }),
      });
      setEmail("");
      setName("");
      setPassword("");
      setCreateRole("user");
      setSuccess(t("admin.userCreated"));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.createError"));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(user: AdminUserRow) {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditUsername(user.username ?? "");
    setEditRole(user.role === "admin" ? "admin" : "user");
    setError("");
  }

  async function handleEditSave() {
    if (!editUser) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          username: editUsername || null,
          role: editRole,
        }),
      });
      setEditUser(null);
      setSuccess(t("admin.userUpdated"));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetUser || !newPassword.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${resetUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword }),
      });
      setResetUser(null);
      setNewPassword("");
      setSuccess(t("admin.passwordReset"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.resetError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
      setDeleteUser(null);
      setSuccess(t("admin.userDeleted"));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.deleteError"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspend(user: AdminUserRow) {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ suspended: !user.suspendedAt }),
      });
      setSuccess(t("admin.userUpdated"));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function impersonate(user: AdminUserRow) {
    if (user.role === "admin") return;
    setSaving(true);
    try {
      await apiFetch("/api/admin/impersonate", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });
      invalidateUserData();
      await refreshUser();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function revokeSessions(user: AdminUserRow) {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/sessions?userId=${user.id}`, { method: "DELETE" });
      setSuccess(t("admin.userUpdated"));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateError"));
    } finally {
      setSaving(false);
    }
  }

  const isSelf = (user: AdminUserRow) => user.id === currentUser?.id;

  return (
    <>
      <AdminHeader title={t("adminConsole.users")} description={t("admin.pageDescFull")} />
      <PageContainer>
        <PageHeader title={t("adminConsole.users")} description={t("admin.pageDescFull")} />

        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            {success}
          </p>
        )}
        {error && !editUser && !resetUser && !deleteUser && (
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t("admin.createUser")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">{t("admin.userName")}</Label>
                  <Input
                    id="admin-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="María García"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">{t("login.email")}</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">{t("login.password")}</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.role")}</Label>
                  <Select
                    value={createRole}
                    onValueChange={(v) => setCreateRole(v as "user" | "admin")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("admin.roleUser")}</SelectItem>
                      <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? t("admin.creating") : t("admin.createUser")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("admin.userList")} ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("common.loading")}
                </div>
              ) : (
                <TableScroll>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.userName")}</TableHead>
                        <TableHead>{t("login.email")}</TableHead>
                        <TableHead>{t("admin.role")}</TableHead>
                        <TableHead>{t("admin.status")}</TableHead>
                        <TableHead>{t("admin.moves")}</TableHead>
                        <TableHead className="text-right">{t("admin.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {user.role === "admin" && (
                                <Shield className="h-3.5 w-3.5 text-primary" />
                              )}
                              {user.name}
                              {user.username && (
                                <span className="text-xs text-muted-foreground">
                                  @{user.username}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.suspendedAt ? (
                              <Badge variant="destructive">{t("admin.suspended")}</Badge>
                            ) : (
                              <Badge variant="secondary">{t("admin.active")}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{user._count.moves}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={t("admin.editUser")}
                                onClick={() => openEdit(user)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {user.role !== "admin" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title={t("admin.impersonateUser")}
                                    onClick={() => void impersonate(user)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title={user.suspendedAt ? t("admin.reactivateUser") : t("admin.suspendUser")}
                                    disabled={isSelf(user)}
                                    onClick={() => void toggleSuspend(user)}
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title={t("admin.revokeSessions")}
                                    onClick={() => void revokeSessions(user)}
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={t("admin.manageMove")}
                                onClick={() => {
                                  setMoveUser(user);
                                  setError("");
                                }}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={t("admin.resetPassword")}
                                onClick={() => {
                                  setResetUser(user);
                                  setNewPassword("");
                                  setError("");
                                }}
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title={t("admin.deleteUser")}
                                disabled={isSelf(user)}
                                onClick={() => {
                                  setDeleteUser(user);
                                  setError("");
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableScroll>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.editUser")}</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("admin.userName")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("login.email")}</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.username")}</Label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder={t("admin.usernameOptional")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.role")}</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as "user" | "admin")}
                disabled={editUser ? isSelf(editUser) : false}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("admin.roleUser")}</SelectItem>
                  <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
              {editUser && isSelf(editUser) && (
                <p className="text-xs text-muted-foreground">{t("admin.cannotDemoteSelf")}</p>
              )}
            </div>
            {error && editUser && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetUser)} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.resetPassword")}</DialogTitle>
            <DialogDescription>
              {t("admin.resetPasswordDesc", { name: resetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{t("admin.newPassword")}</Label>
            <Input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && resetUser && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleResetPassword} disabled={saving || newPassword.length < 6}>
              {saving ? t("common.loading") : t("admin.resetPassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deleteUser")}</DialogTitle>
            <DialogDescription>
              {t("admin.deleteConfirm", {
                name: deleteUser?.name ?? "",
                email: deleteUser?.email ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          {error && deleteUser && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminUserMoveDialog
        user={moveUser}
        onClose={() => setMoveUser(null)}
        onSaved={() => {
          setSuccess(t("admin.moveSaved"));
          void loadUsers();
        }}
      />
    </>
  );
}

export default function AdminUsersPageRoute() {
  return <AdminUsersPage />;
}
