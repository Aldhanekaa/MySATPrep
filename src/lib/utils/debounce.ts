/**
 * Debounce Utility
 *
 * Provides a simple debounce function that delays invoking the given function
 * until after `delay` ms have elapsed since the last invocation.
 *
 * Validates: Requirement 19.4
 */

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation */
  cancel(): void;
  /** Immediately invoke any pending call */
  flush(): void;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Returns a debounced version of `fn` that delays invocation by `delay` ms.
 * Each new call resets the timer.
 *
 * @param fn    The function to debounce
 * @param delay Delay in milliseconds (default: 500)
 *
 * @example
 * const debouncedSave = debounce(saveProfile, 500);
 * debouncedSave(data); // will only call saveProfile once after 500 ms of inactivity
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  delay = 500,
): DebouncedFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = function (...args: Parameters<T>): void {
    lastArgs = args;

    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      if (lastArgs !== null) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, delay);
  } as DebouncedFunction<T>;

  debounced.cancel = function (): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  debounced.flush = function (): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (lastArgs !== null) {
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}
