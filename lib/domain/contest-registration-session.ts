export const contestRegistrationStorageKey = "soj.contestRegistrations";
export const contestRegistrationChangeEvent = "soj:contest-registration-change";

type ContestRegistrationUser = {
  id?: number;
  handle?: string;
};

type ContestRegistrationStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type ContestRegistrationUserKey = string | number | null;

export function contestRegistrationUserKey(user: ContestRegistrationUser | null | undefined): string | null {
  if (!user) return null;
  if (Number.isInteger(user.id)) return `id:${user.id}`;
  return user.handle ? `handle:${user.handle}` : null;
}

export function isContestRegistered(store: ContestRegistrationStore, userKey: ContestRegistrationUserKey, contestId: number): boolean {
  const key = normalizeUserKey(userKey);
  if (!key) return false;
  return readContestRegistrations(store, key).has(contestId);
}

export function markContestRegistered(store: ContestRegistrationStore, userKey: ContestRegistrationUserKey, contestId: number): void {
  const key = normalizeUserKey(userKey);
  if (!key) return;
  const registrationsByUser = readContestRegistrationMap(store);
  const registrations = new Set(registrationsByUser[key] ?? []);
  registrations.add(contestId);
  registrationsByUser[key] = [...registrations];
  store.setItem(contestRegistrationStorageKey, JSON.stringify(registrationsByUser));
  dispatchContestRegistrationChange();
}

export function subscribeToContestRegistrationChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(contestRegistrationChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(contestRegistrationChangeEvent, onStoreChange);
  };
}

function readContestRegistrations(store: ContestRegistrationStore, userKey: string) {
  return new Set(readContestRegistrationMap(store)[userKey] ?? []);
}

function normalizeUserKey(userKey: ContestRegistrationUserKey) {
  if (typeof userKey === "number") return `id:${userKey}`;
  return userKey;
}

function readContestRegistrationMap(store: ContestRegistrationStore): Record<string, number[]> {
  const value = store.getItem(contestRegistrationStorageKey);
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).map(([userKey, ids]) => [
        userKey,
        Array.isArray(ids) ? ids.filter((id): id is number => Number.isInteger(id)) : [],
      ]),
    );
  } catch {
    return {};
  }
}

function dispatchContestRegistrationChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(contestRegistrationChangeEvent));
}
