import React from "react";

export type OverridableHookOptions = {
  /**
   * If true, then the HookOverrideProvider will be _required_,
   * and using the hook without a Provider will throw an error.
   *
   * @default true
   */
  required?: boolean;
  /**
   * When false, the hook will be passed through untouched, and a HookOverrideProvider will not be provided
   * @default true when NODE_ENV=test
   */
  enabled?: boolean;
};
type AnyFunction = (...args: any[]) => any;
export type HookOverrideProvider<THook extends AnyFunction> = React.FC<{
  /**
   * Override the associated hook with this value.
   *
   * Value can be either a function with the same signature as the Hook, or
   * a static value matching the hook's return value.
   *
   * If not specified, the original hook will be used.
   */
  value?: THook | ReturnType<THook>;
}>;

const isTestEnv =
  typeof process === "object" && process.env.NODE_ENV === "test";

export const DummyProvider: HookOverrideProvider<any> = () => {
  const err = new Error(
    "Warning: this HookOverrideProvider should only be used in tests. It should not be used in production code.\n" +
      "Either set NODE_ENV=test, or remove this Provider from production code."
  );
  Error.captureStackTrace(err, DummyProvider);
  throw err;
};

/**
 * Transparently wraps the hook, and returns it, along with a HookOverrideProvider.
 *
 * When no HookOverrideProvider is used, the hook behaves normally.
 * The HookOverrideProvider is used to override the hook, and return a different value.
 *
 * This is especially useful for tests and for Storybook integration.
 *
 * @param hook - Any hook-like function
 * @param [options]
 */
export function overridableHook<THook extends AnyFunction>(
  hook: THook,
  { required = true, enabled = isTestEnv }: OverridableHookOptions = {}
): [THook, HookOverrideProvider<THook>] {
  if (!enabled) {
    // In production, pass-through the hook, untouched:
    return [hook, DummyProvider];
  }

  const context = React.createContext<
    THook | ReturnType<THook> | undefined | null
  >(null);

  const hookOverride = ((...args): ReturnType<THook> => {
    const contextValue = React.useContext(context);

    const missingProvider = contextValue === null;
    const missingValue = contextValue === undefined;

    if (required && missingProvider) {
      // There's no Provider, so throw an error!
      const name = (hook as any).displayName || hook.name || "";
      const err = new Error(
        `Missing hook override Provider${
          name ? ` for '${name}' hook` : "for overridable hook"
        }`
      );
      Error.captureStackTrace(err, hookOverride);
      throw err;
    }

    if (missingProvider || missingValue) {
      // There's no value, so use the original hook:
      return hook(...args);
    }

    if (typeof contextValue === "function") {
      // value is a dynamic value:
      return (contextValue as THook)(...args);
    }

    // value is a static value:
    return contextValue!;
  }) as THook;

  // Simply wrap context.Provider because `value` is optional
  const HookOverrideProvider: HookOverrideProvider<THook> = ({
    value,
    children,
  }) => {
    return <context.Provider value={value}>{children}</context.Provider>;
  };

  return [hookOverride, HookOverrideProvider];
}
