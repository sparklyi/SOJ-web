"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AdminUser } from "@/lib/api/types";
import { updateAdminUser } from "./api";

export function UserProfileForm({ user, onSaved }: { user: AdminUser; onSaved: (user: AdminUser) => void }) {
  const { t } = useI18n();
  const [username, setUsername] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [usernameError, setUsernameError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = username.trim() !== user.handle || bio !== user.bio;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const name = username.trim();
    if (!name) {
      setUsernameError(t("auth.validation.usernameRequired"));
      return;
    }
    if (!dirty) return;
    setUsernameError("");
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      // Empty string clears the bio; null would be ignored by the backend's partial update.
      const input = { ...(name !== user.handle ? { username: name } : {}), ...(bio !== user.bio ? { bio } : {}) };
      const updated = await updateAdminUser(user.id, input, createBrowserApiClient());
      setUsername(updated.handle);
      setBio(updated.bio);
      setSaved(true);
      onSaved(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("roles.profileFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-3" aria-label={t("roles.profile")} onSubmit={save}>
      <h3 className="text-sm font-medium text-soj-text">{t("roles.profile")}</h3>
      <Input id="admin-profile-username" label={t("auth.form.username")} value={username} required disabled={saving} error={usernameError} onChange={(event) => { setUsername(event.target.value); setUsernameError(""); setSaved(false); }} />
      <Textarea id="admin-profile-bio" label={t("roles.bio")} value={bio} disabled={saving} onChange={(event) => { setBio(event.target.value); setSaved(false); }} />
      {saved ? <p role="status" className="text-sm text-soj-success">{t("roles.profileSaved")}</p> : null}
      {error ? <p role="alert" className="text-sm text-soj-danger">{error}</p> : null}
      <Button type="submit" variant="secondary" loading={saving} disabled={!dirty}>{t("roles.saveProfile")}</Button>
    </form>
  );
}
