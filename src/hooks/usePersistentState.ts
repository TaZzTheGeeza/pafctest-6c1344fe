import { useEffect, useState } from "react";

const PREFIX = "pafc_draft:";

/** useState that survives page reloads / app being minimised (localStorage). */
export function usePersistentState<T>(
  key: string,
  initial: T,
  serialize: (v: T) => unknown = (v) => v,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {}
    return initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(serialize(value)));
    } catch {}
  }, [storageKey, value]); // eslint-disable-line react-hooks/exhaustive-deps
  return [value, setValue];
}

export function clearPersistentDrafts(prefix: string) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/** True if any match report draft has meaningful content. */
export function hasActiveDraft(): boolean {
  try {
    return Object.keys(localStorage).some((k) => {
      if (!k.startsWith(PREFIX)) return false;
      const v = localStorage.getItem(k);
      return !!v && v !== '""' && v !== "[]" && v !== "null" && !/^\[\{"player_name":"","shirt_number":"","reason":""[^\]]*\}\]$/.test(v);
    });
  } catch {
    return false;
  }
}
