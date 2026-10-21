import { useCallback, useEffect, useMemo, useState } from "react";
import { Gem, ShieldCheck, UserPlus, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import {
  addUserRecord, inviteFamilyMember, listUserCollection, normalizePhone, revokeFamilyInvite, updateUserRecord
} from "../services/firebaseService";
import { Avatar, Badge, Button, Card, Field, Input, List, ListRow, Notice, Screen, Section, Spinner } from "../ui";
import { familyAccessCopy } from "./FamilyAccess.copy";

const isIndianMobile = (phone) => /^\+91[6-9]\d{9}$/.test(phone);

// Lender gives read-only access to a family member. The invitation is written
// to familyLinks/{phone}/invites/{lenderUid}; the person must sign in with that
// phone and accept. The lender's own list is kept in users/{uid}/familyInvites.
export function FamilyAccess() {
  const { user, lender, hasFeature } = useApp();
  const s = useCopy(familyAccessCopy);
  const allowed = hasFeature("familyAccess");

  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [inv, mem] = await Promise.all([
        listUserCollection(user.uid, "familyInvites").catch(() => []),
        listUserCollection(user.uid, "familyMembers").catch(() => [])
      ]);
      setInvites(inv);
      setMembers(mem);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // One row per phone: an accepted member (familyMembers) and/or our invite record.
  const rows = useMemo(() => {
    const active = invites.filter((i) => i.status !== "revoked");
    const byPhone = new Map();
    for (const inv of active) byPhone.set(inv.phone, { phone: inv.phone, name: inv.memberName, invite: inv, member: null });
    for (const m of members) {
      const row = byPhone.get(m.phone) || { phone: m.phone, name: "", invite: null, member: null };
      row.member = m;
      byPhone.set(m.phone, row);
    }
    return [...byPhone.values()];
  }, [invites, members]);

  const sendInvite = async () => {
    setError("");
    setMessage("");
    const phone = normalizePhone(phoneInput);
    if (!name.trim()) return setError(s.errName);
    if (!isIndianMobile(phone)) return setError(s.errPhone);
    if (user?.phoneNumber && normalizePhone(user.phoneNumber) === phone) return setError(s.errSelf);
    if (rows.some((r) => r.phone === phone)) return setError(s.errDuplicate);
    if (!understood) return setError(s.errUnderstand);
    setBusy("invite");
    try {
      await inviteFamilyMember(user.uid, phone, { lenderName: lender?.name || "", memberName: name.trim() });
      await addUserRecord(user.uid, "familyInvites", { phone, memberName: name.trim(), status: "pending", permission: "view" });
      setMessage(s.invited(name.trim()));
      setName("");
      setPhoneInput("");
      setUnderstood(false);
      await load();
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  const revoke = async (row) => {
    setError("");
    setMessage("");
    setBusy(row.phone);
    try {
      await revokeFamilyInvite(user.uid, row.phone, row.member?.id);
      const records = invites.filter((i) => i.phone === row.phone && i.status !== "revoked");
      await Promise.all(records.map((i) => updateUserRecord(user.uid, "familyInvites", i.id, { status: "revoked", revokedAt: new Date() })));
      setConfirming(null);
      setMessage(s.revoked);
      await load();
    } catch (err) {
      console.error(err);
      setError(s.error);
    } finally {
      setBusy("");
    }
  };

  const displayName = (row) => row.name || s.unknownName;

  return (
    <Screen title={s.title} subtitle={s.subtitle} back="/more">
      <Section title={s.howTitle}>
        <Card>
          <ul className="grid list-disc gap-2 pl-5 text-[15px] font-medium text-ink">
            {s.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </Card>
      </Section>

      <Notice tone="warning" title={s.warningTitle}>{s.warning}</Notice>

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {!allowed ? (
        <Card className="grid gap-3 border-amber-200 bg-amber-50">
          <p className="text-[17px] font-extrabold text-ink">{s.upgradeTitle}</p>
          <p className="text-[15px] font-medium text-ink-soft">{s.upgradeText}</p>
          <Button to="/plans" icon={Gem}>{s.seePlans}</Button>
        </Card>
      ) : (
        <Section title={s.inviteTitle}>
          <Card className="grid gap-4">
            <Field label={s.name}>
              <Input value={name} placeholder={s.namePlaceholder} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={s.phone} hint={s.phoneHint}>
              <Input type="tel" inputMode="tel" autoComplete="off" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            </Field>
            <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-brand-600"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <span className="text-[15px] font-semibold text-ink">{s.understand}</span>
            </label>
            <Button size="lg" block icon={UserPlus} loading={busy === "invite"} disabled={Boolean(busy)} onClick={sendInvite}>
              {s.invite}
            </Button>
          </Card>
        </Section>
      )}

      <Section title={s.listTitle}>
        {loading ? (
          <Spinner label={s.loading} />
        ) : rows.length === 0 ? (
          <Card><p className="text-[15px] font-medium text-ink-muted">{s.none}</p></Card>
        ) : (
          <List>
            {rows.map((row) => (
              <div key={row.phone}>
                <ListRow
                  avatar={<Avatar name={displayName(row)} />}
                  title={displayName(row)}
                  subtitle={row.phone}
                  trailing={row.member ? <Badge tone="brand">{s.statusActive}</Badge> : <Badge tone="amber">{s.statusPending}</Badge>}
                />
                <div className="px-4 pb-3">
                  {confirming === row.phone ? (
                    <div className="grid gap-2 rounded-xl bg-rose-50 p-3">
                      <p className="text-[15px] font-semibold text-rose-800">{s.confirmRevoke(displayName(row))}</p>
                      <Button variant="danger" loading={busy === row.phone} disabled={Boolean(busy)} onClick={() => revoke(row)}>{s.yes}</Button>
                      <Button variant="secondary" disabled={Boolean(busy)} onClick={() => setConfirming(null)}>{s.no}</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" icon={row.member ? ShieldCheck : X} disabled={Boolean(busy)} onClick={() => setConfirming(row.phone)}>
                      {row.member ? s.revoke : s.cancelInvite}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </List>
        )}
      </Section>
    </Screen>
  );
}
