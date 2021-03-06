import React from "react";

export type OverridableHookOptions = {
  /**
   * If true, then the HookOverrideProvider will be _required_,
   * and using the hook without a Provider will throw an error.
   */
  required?: boolean;
  /**
   * If false, the hook will be passed through untouched, and a HookOverrideProvider is not provided
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

export const NotEnabledProvider: HookOverrideProvider<any> = () => {
  const err = new Error(
    "Warning: you cannot use this HookOverrideProvider because this override is not enabled."
  );
  Error.captureStackTrace(err, NotEnabledProvider);
  throw err;
};
export const NotEnabledTestProvider: HookOverrideProvider<any> = () => {
  const err = new Error(
    "Warning: this HookOverrideProvider should only be used in tests. " +
      "Either set NODE_ENV=test, STORYBOOK=true, TESTABLE_HOOKS_ENABLED=true, " +
      "or remove this Provider from production code."
  );
  Error.captureStackTrace(err, NotEnabledTestProvider);
  throw err;
};

/**
 * Wraps a hook, so that it can be optionally overridden.
 *
 * By default, the returned wrapper is identical to the hook, and should be used in its place.
 * But when an OverrideProvider is present, it will override the hook, and supply its own value.
 *
 * This is especially useful for mocking, for tests, or for Storybook integration.
 *
 * @param hook - Any hook-like function
 * @param [options] - Defaults: { required: false, enabled: true }
 */
export function overridableHook<THook extends AnyFunction>(
  hook: THook,
  { required = false, enabled = true }: OverridableHookOptions = {}
): [THook, HookOverrideProvider<THook>] {
  if (!enabled) {
    // In production, pass-through the hook, untouched:
    return [hook, NotEnabledProvider];
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

/**
 * Same as `overridableHook`, but enabled and required when:
 * - NODE_ENV=test (the default for Jest)
 * - STORYBOOK=true (the default for Storybook)
 * - TESTABLE_HOOKS_ENABLED=true (manually set by you)
 *
 * For non-test environments, there is no overhead; the original hook will be passed-through verbatim.
 *
 * @param hook - Any hook-like function
 * @param [options] - Defaults: { required: true, enabled: NODE_ENV === 'test' || STORYBOOK === 'true' || TESTABLE_HOOKS_ENABLED === 'true' }
 */
export function testableHook<THook extends AnyFunction>(
  hook: THook,
  {
    required = true,
    enabled = process.env.NODE_ENV === "test" ||
      process.env.STORYBOOK === "true" ||
      process.env.TESTABLE_HOOKS_ENABLED === "true",
  }: OverridableHookOptions = {}
): [THook, HookOverrideProvider<THook>] {
  if (!enabled) {
    // In production, pass-through the hook, untouched:
    return [hook, NotEnabledTestProvider];
  }
  return overridableHook(hook, { required, enabled });
}
