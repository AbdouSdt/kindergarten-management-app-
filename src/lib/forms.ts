/** Shared shape returned by form Server Actions (used with `useActionState`). */
export type FormState =
  | {
      error?: string;
      ok?: boolean;
      /**
       * One-time credential handoff: set only when the action just created or
       * reset a password, so the dialog can render it from the result instead of
       * reading a now-reset DOM input.
       */
      password?: string;
    }
  | null;
