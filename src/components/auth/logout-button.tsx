"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
}: LogoutButtonProps) {
  const t = useT();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={handleLogout}
    >
      {showIcon && <LogOut className="h-4 w-4 shrink-0" />}
      {t("common.logout")}
    </Button>
  );
}
