"use client";

import { useEffect, useCallback } from "react";

interface ShortcutOptions {
  ctrl?: boolean;
  meta?: boolean;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const { preventDefault = true, ...mods } = options;
  const memoCallback = useCallback(callback, [callback]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mods.ctrlOrMeta && !(e.ctrlKey || e.metaKey)) return;
      if (!mods.ctrlOrMeta && mods.ctrl !== undefined && mods.ctrl !== e.ctrlKey) return;
      if (!mods.ctrlOrMeta && mods.meta !== undefined && mods.meta !== e.metaKey) return;
      if (mods.shift !== undefined && mods.shift !== e.shiftKey) return;
      if (mods.alt !== undefined && mods.alt !== e.altKey) return;
      if (!e.key || e.key.toLowerCase() !== key.toLowerCase()) return;
      if (preventDefault) e.preventDefault();
      memoCallback();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [key, memoCallback, mods.ctrl, mods.meta, mods.ctrlOrMeta, mods.shift, mods.alt, preventDefault]);
}
