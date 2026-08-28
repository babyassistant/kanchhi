// ============================================================
// KANCHHI CACHE
// Offline / Cached Mode
// ============================================================

const KANCHHI_CACHE_PREFIX = "kanchhi-cache:";


// ============================================================
// CACHE WRAPPER
// ============================================================

export type KanchhiCachedData<T> = {

  data: T;

  savedAt: number;

};


// ============================================================
// SAVE
// ============================================================

export function saveKanchhiCache<T>(
  key: string,
  data: T
): boolean {

  if (typeof window === "undefined") {
    return false;
  }

  try {

    const payload: KanchhiCachedData<T> = {
      data,
      savedAt: Date.now(),
    };

    localStorage.setItem(
      `${KANCHHI_CACHE_PREFIX}${key}`,
      JSON.stringify(payload)
    );

    return true;

  } catch (error) {

    console.warn(
      "KANCHHI cache save failed:",
      error
    );

    return false;
  }
}


// ============================================================
// LOAD
// ============================================================

export function loadKanchhiCache<T>(
  key: string
): KanchhiCachedData<T> | null {

  if (typeof window === "undefined") {
    return null;
  }

  try {

    const raw = localStorage.getItem(
      `${KANCHHI_CACHE_PREFIX}${key}`
    );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as KanchhiCachedData<T>;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.savedAt !== "number" ||
      !("data" in parsed)
    ) {

      localStorage.removeItem(
        `${KANCHHI_CACHE_PREFIX}${key}`
      );

      return null;
    }

    return parsed;

  } catch (error) {

    console.warn(
      "KANCHHI cache load failed:",
      error
    );

    return null;
  }
}


// ============================================================
// REMOVE
// ============================================================

export function removeKanchhiCache(
  key: string
): void {

  if (typeof window === "undefined") {
    return;
  }

  try {

    localStorage.removeItem(
      `${KANCHHI_CACHE_PREFIX}${key}`
    );

  } catch (error) {

    console.warn(
      "KANCHHI cache remove failed:",
      error
    );
  }
}


// ============================================================
// CLEAR ALL KANCHHI CACHE
// ============================================================

export function clearKanchhiCache(): void {

  if (typeof window === "undefined") {
    return;
  }

  try {

    const keys: string[] = [];

    for (
      let index = 0;
      index < localStorage.length;
      index++
    ) {

      const key =
        localStorage.key(index);

      if (
        key &&
        key.startsWith(KANCHHI_CACHE_PREFIX)
      ) {

        keys.push(key);
      }
    }

    keys.forEach(
      (key) => localStorage.removeItem(key)
    );

  } catch (error) {

    console.warn(
      "KANCHHI cache clear failed:",
      error
    );
  }
}


// ============================================================
// CACHE AGE
// ============================================================

export function getCacheAge(
  savedAt: number
): string {

  const difference =
    Math.max(
      0,
      Date.now() - savedAt
    );

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {

    return `${minutes} minute${
      minutes === 1
        ? ""
        : "s"
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {

    return `${hours} hour${
      hours === 1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  return `${days} day${
    days === 1
      ? ""
      : "s"
  } ago`;
}