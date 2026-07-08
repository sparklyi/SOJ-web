export const contestRegistrationStorageKey = "soj.contestRegistrations";
export const contestRegistrationChangeEvent = "soj:contest-registration-change";

type ContestRegistrationStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export function isContestRegistered(store: ContestRegistrationStore, contestId: number): boolean {
  return readContestRegistrations(store).has(contestId);
}

export function markContestRegistered(store: ContestRegistrationStore, contestId: number): void {
  const registrations = readContestRegistrations(store);
  registrations.add(contestId);
  store.setItem(contestRegistrationStorageKey, JSON.stringify([...registrations]));
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

function readContestRegistrations(store: ContestRegistrationStore) {
  const value = store.getItem(contestRegistrationStorageKey);
  if (!value) return new Set<number>();

  try {
    const ids = JSON.parse(value) as unknown;
    if (!Array.isArray(ids)) return new Set<number>();
    return new Set(ids.filter((id): id is number => Number.isInteger(id)));
  } catch {
    return new Set<number>();
  }
}

function dispatchContestRegistrationChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(contestRegistrationChangeEvent));
}
