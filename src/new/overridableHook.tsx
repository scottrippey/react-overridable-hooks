import React, { createContext, FC, useContext, useDebugValue } from "react";
import { OverridableHookOptions } from "../overridableHook";

type AnyFunction = (...args: any) => any;
export type AnyHook = AnyFunction & { displayName?: string };
const isOverridableHook = Symbol("isOverridableHook");
export type OverridableHook<THook extends AnyHook> = THook & {
  [isOverridableHook]: unknown;
};

type HookOverridesType = {
  getHookOverride<THook extends OverridableHook<AnyHook>>(
    hookWrapper: THook
  ): THook | null;
};
const HookOverridesContext = createContext<HookOverridesType | null>(null);
HookOverridesContext.displayName = "HookOverridesContext";

export type HooksToOverride = { [propName: string]: OverridableHook<AnyHook> };
export type OverridesProviderProps<THookToOverride extends HooksToOverride> = {
  [PropName in keyof THookToOverride]?: Partial<THookToOverride[PropName]>;
};

export function createOverridesProvider<
  THooksToOverride extends HooksToOverride
>(hooksToOverride: THooksToOverride) {
  const HookOverridesProvider: FC<OverridesProviderProps<THooksToOverride>> = ({
    children,
    ...hookOverrides
  }) => {
    const parent = useContext(HookOverridesContext);
    const map = new Map(
      Object.keys(hookOverrides).map((hookName) => {
        const key = hooksToOverride[hookName];
        const value = hookOverrides[hookName];
        return [key, value];
      })
    );
    const value = {
      getHookOverride(hookWrapper) {
        const override =
          map.get(hookWrapper) || parent?.getHookOverride(hookWrapper) || null;
        if (!override) {
          throw captureError(
            `react-overridable-hooks: Missing hook override for ${getName(
              hookWrapper
            )}`,
            value.getHookOverride
          );
        }
        return override;
      },
    } as HookOverridesType;

    return (
      <HookOverridesContext.Provider value={value}>
        {children}
      </HookOverridesContext.Provider>
    );
  };

  // Improve the displayName:
  const hookNames = Object.keys(hooksToOverride).join(",");
  HookOverridesProvider.displayName = `HookOverridesProvider(${hookNames})`;

  return HookOverridesProvider;
}

export function testableHook<T extends AnyHook>(
  hook: T,
  {
    enabled = process.env.NODE_ENV === "test" ||
      process.env.STORYBOOK === "true" ||
      process.env.TESTABLE_HOOKS_ENABLED === "true",
  }: OverridableHookOptions = {}
) {
  return overridableHook(hook, { enabled });
}

export function overridableHook<THook extends AnyHook>(
  hook: THook,
  { enabled = true }: OverridableHookOptions = {}
): OverridableHook<THook> {
  if (!enabled) {
    return hook as OverridableHook<THook>;
  }

  const hookWrapper = ((...args) => {
    const ctx = useContext(HookOverridesContext);
    const override = ctx?.getHookOverride(hookWrapper);
    const hookName = hook.displayName || hook.name;

    if (override) {
      useDebugValue(`HookOverride(${hookName || "hook"})`);
      return override(...args);
    } else {
      useDebugValue(hookName);
      return hook(...args);
    }
  }) as OverridableHook<THook>;

  // Add some metadata:
  setName(hookWrapper, `OverridableHook(${hook.name})`);
  hookWrapper[isOverridableHook] = isOverridableHook;

  return hookWrapper;
}

function getName(hook: AnyHook): string {
  const name = hook.displayName || hook.name;
  return name ? `"${name}"` : "hook";
}
function setName(hook: AnyHook, name: string) {
  Object.defineProperty(hook, "name", { value: name });
}

function captureError(message: string, scope: Function): Error {
  const err = new Error(message);
  Error.captureStackTrace(err, scope);
  return err;
}
