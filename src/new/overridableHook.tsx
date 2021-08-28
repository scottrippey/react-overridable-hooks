import React, { createContext, FC, useContext, useDebugValue } from "react";
import { OverridableHookOptions } from "../overridableHook";

type AnyFunction = (...args: any) => any;

export type HookOverrides = {
  getHookOverride<T extends AnyFunction>(hook: T): T | null;
};
const OverridesContext = createContext<HookOverrides | null>(null);
OverridesContext.displayName = "HookOverridesContext";

export function createOverridesProvider<
  THookOverrides extends { [propName: string]: AnyFunction }
>(hooksToOverride: THookOverrides): FC<Partial<THookOverrides>> {
  const HookOverridesProvider: FC<Partial<THookOverrides>> = ({
    children,
    ...overrides
  }) => {
    const parent = useContext(OverridesContext);
    const map = new Map(
      Object.keys(overrides).map((hookName) => {
        const key = hooksToOverride[hookName];
        const value = overrides[hookName];
        return [key, value];
      })
    );
    const value = {
      getHookOverride(hook) {
        return map.get(hook) || parent?.getHookOverride(hook) || null;
      },
    } as HookOverrides;

    return (
      <OverridesContext.Provider value={value}>
        {children}
      </OverridesContext.Provider>
    );
  };

  const hookNames = Object.keys(hooksToOverride).join(",");
  HookOverridesProvider.displayName = `HookOverridesProvider(${hookNames})`;

  return HookOverridesProvider;
}

export function testableHook<T extends AnyFunction>(
  hook: T,
  {
    required = true,
    enabled = process.env.NODE_ENV === "test" ||
      process.env.STORYBOOK === "true" ||
      process.env.TESTABLE_HOOKS_ENABLED === "true",
  }: OverridableHookOptions = {}
): T {
  return overridableHook(hook, { required, enabled });
}

export function overridableHook<T extends AnyFunction>(
  hook: T,
  { required = false, enabled = true }: OverridableHookOptions = {}
): T {
  if (!enabled) {
    return hook;
  }

  const hookOverride = ((...args) => {
    const ctx = useContext(OverridesContext);
    const override = ctx?.getHookOverride(hookOverride);

    if (override) {
      useDebugValue(`Overridden(${hook.name || "Hook"})`);
      return override(...args);
    }

    if (!required) {
      return hook(...args);
    }

    const error = new Error(
      `react-overridable-hooks: ${
        !ctx ? "Missing hook provider" : "Missing hook override"
      }${!hook.name ? "" : ` for "${hook.name}"`}`
    );
    Error.captureStackTrace(error, hookOverride);
    throw error;
  }) as T;

  return hookOverride;
}
