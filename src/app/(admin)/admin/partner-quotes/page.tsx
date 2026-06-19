"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { quoteAmountLabel } from "@/lib/partner/quote-utils";

interface AdminQuoteRow {
  id: string;
  companyName: string;
  contactEmail: string;
  amount: number | null;
  amountMin: number | null;
  amountMax: number | null;
  status: string;
  createdAt: string;
  move: {
    id: string;
    origin: string;
    destination: string;
    moveDate: string;
    ownerName: string;
    ownerEmail: string;
  };
}

export default function AdminPartnerQuotesPage() {
  const t = useT();
  const { locale } = useLocale();
  const [quotes, setQuotes] = useState<AdminQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch("/api/admin/partner-quotes");
        const data = (await res.json()) as { quotes: AdminQuoteRow[] };
        setQuotes(data.quotes);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <AdminHeader
        title={t("adminConsole.partnerQuotes")}
        description={t("adminConsole.partnerQuotesDesc")}
      />
      <AdminPageContainer>
        <PageHeader
          title={t("adminConsole.partnerQuotes")}
          description={t("adminConsole.partnerQuotesDesc")}
        />

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : !quotes.length ? (
          <p className="text-sm text-muted-foreground">{t("adminConsole.noPartnerQuotes")}</p>
        ) : (
          <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminConsole.quoteCompany")}</TableHead>
                  <TableHead>{t("adminConsole.quoteAmount")}</TableHead>
                  <TableHead>{t("adminConsole.route")}</TableHead>
                  <TableHead>{t("adminConsole.owner")}</TableHead>
                  <TableHead>{t("adminConsole.when")}</TableHead>
                  <TableHead>{t("adminConsole.statusLabel")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <p className="font-medium">{q.companyName}</p>
                      <p className="text-xs text-muted-foreground">{q.contactEmail}</p>
                    </TableCell>
                    <TableCell>
                      {quoteAmountLabel(q, locale, formatCurrency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {q.move.origin} → {q.move.destination}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{q.move.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{q.move.ownerEmail}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(q.createdAt, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{q.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/moves/${q.move.id}`}>{t("adminConsole.viewDetails")}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
        )}
      </AdminPageContainer>
    </>
  );
}
