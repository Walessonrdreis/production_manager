import { useEffect, useState } from 'react';

type Options<T> = {
  /**
   * Se quiser transformar o valor ao carregar (ex.: normalização),
   * passe uma função aqui.
   */
  revive?: (raw: unknown) => T;
  /**
   * Se quiser customizar serialização, passe aqui.
   */
  serialize?: (value: T) => string;
  /**
   * Se quiser customizar parsing, passe aqui.
   */
  parse?: (value: string) => unknown;
};

export function useLocalStorageState<T>(
  key: string | null,
  initialValue: T,
  options?: Options<T>
) {
  const [state, setState] = useState<T>(initialValue);

  const parse = options?.parse ?? ((value: string) => JSON.parse(value));
  const serialize = options?.serialize ?? ((value: T) => JSON.stringify(value));
  const revive = options?.revive ?? ((raw: unknown) => raw as T);

  // Load
  useEffect(() => {
    if (!key) return;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        setState(initialValue);
        return;
      }

      const parsed = parse(raw);
      setState(revive(parsed));
    } catch {
      setState(initialValue);
    }
  }, [key]);

  // Save
  useEffect(() => {
    if (!key) return;

    try {
      window.localStorage.setItem(key, serialize(state));
    } catch {
      // ignore (quota, private mode etc.)
    }
  }, [key, serialize, state]);

  return [state, setState] as const;
}
