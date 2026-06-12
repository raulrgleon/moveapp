"use client";

import { useEffect, useState, type RefObject, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function DropdownPortal({
  anchorRef,
  open,
  children,
  className,
}: DropdownPortalProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!open || !position || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={className}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
