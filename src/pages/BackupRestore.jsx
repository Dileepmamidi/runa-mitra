import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Download, FileSpreadsheet, Gem } from "lucide-react";
import { version as appVersion } from "../../package.json";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Badge, Button, Card, Notice, Screen, Section } from "../ui";
import { BACKUP_COLLECTIONS, buildBackup, fileStamp, loanRows, paymentRows, toCsv } from "../utils/exporters";
import { toDateKey } from "../utils/interestEngine";
import { backupCopy } from "./BackupRestore.copy";

/**
 * Saves text as a file. Web: browser download. Android: write to the app's
 * cache folder, then open the share sheet so the lender chooses where it goes.
 * Returns "shared" or "downloaded".
 */
async function saveTextFile(name, text, mime, title) {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title, url: uri });
    return "shared";
  }
  // BOM so Excel reads Telugu text in CSV files correctly.
  const blob = new Blob([mime === "text/csv" ? "﻿" : "", text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

export function BackupRestore() {
  const app = useApp();
  const { lender, hasFeature } = app;
  const s = useCopy(backupCopy);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canCsv = hasFeature("csvExport");
  const total = BACKUP_COLLECTIONS.reduce((n, name) => n + (app[name]?.length || 0), 0);

  const run = async (key, make) => {
    setBusy(key);
    setMessage("");
    setError("");
    try {
      const [name, text, mime] = make();
      const how = await saveTextFile(name, text, mime, s.title);
      setMessage(how === "shared" ? s.saved : s.downloaded);
    } catch (err) {
      // Closing the share sheet is not an error worth showing.
      if (!/cancel/i.test(String(err?.message || err))) {
        console.error(err);
        setError(s.error);
      }
    } finally {
      setBusy("");
    }
  };

  const fullBackup = () =>
    run("json", () => {
      const data = Object.fromEntries(BACKUP_COLLECTIONS.map((name) => [name, app[name] || []]));
      const backup = buildBackup(data, { appVersion, lender: { name: lender?.name || "", village: lender?.village || "" } });
      return [`runa-mitra-backup-${fileStamp()}.json`, JSON.stringify(backup, null, 2), "application/json"];
    });

  const columns = (labels) => Object.entries(labels).map(([key, label]) => ({ key, label }));

  const loansCsv = () =>
    run("loans", () => {
      const rows = loanRows(app, toDateKey(new Date()), s.unclear);
      return [`runa-mitra-loans-${fileStamp()}.csv`, toCsv(rows, columns(s.loanCols)), "text/csv"];
    });

  const paymentsCsv = () =>
    run("payments", () => {
      const rows = paymentRows(app);
      return [`runa-mitra-payments-${fileStamp()}.csv`, toCsv(rows, columns(s.paymentCols)), "text/csv"];
    });

  return (
    <Screen title={s.title} subtitle={s.subtitle} back="/more">
      <Notice tone="info">{s.cloudNote}</Notice>

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Section title={s.fullTitle} action={<Badge tone="brand">{s.free}</Badge>}>
        <Card className="grid gap-3">
          <p className="text-[15px] font-medium text-ink-soft">{s.fullText}</p>
          <p className="text-[13px] font-bold text-ink-muted">{s.counts(total)}</p>
          <Button size="lg" block icon={Download} loading={busy === "json"} disabled={Boolean(busy)} onClick={fullBackup}>
            {s.fullButton}
          </Button>
        </Card>
      </Section>

      <Section title={s.csvTitle}>
        {canCsv ? (
          <Card className="grid gap-3">
            <p className="text-[15px] font-medium text-ink-soft">{s.csvText}</p>
            <Button variant="secondary" block icon={FileSpreadsheet} loading={busy === "loans"} disabled={Boolean(busy)} onClick={loansCsv}>
              {s.loansButton}
            </Button>
            <Button variant="secondary" block icon={FileSpreadsheet} loading={busy === "payments"} disabled={Boolean(busy)} onClick={paymentsCsv}>
              {s.paymentsButton}
            </Button>
          </Card>
        ) : (
          <Card className="grid gap-3 border-amber-200 bg-amber-50">
            <p className="text-[17px] font-extrabold text-ink">{s.upgradeTitle}</p>
            <p className="text-[15px] font-medium text-ink-soft">{s.upgradeText}</p>
            <Button to="/plans" icon={Gem}>{s.seePlans}</Button>
          </Card>
        )}
      </Section>

      <Section title={s.restoreTitle}>
        <Notice tone="warning">{s.restoreText}</Notice>
      </Section>
    </Screen>
  );
}
