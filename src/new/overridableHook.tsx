import React, { createContext, FC, useContext, useDebugValue } from "react";
import { OverridableHookOptions } from "../overridableHook";

type AnyFunction = (...args: any) => any;
export type AnyHook = AnyFunction;
export type OverridableHook<THook extends AnyHook> = THook & {
  isOverridableHook: unknown;
};

type HookOverridesType = {
  getHookOverride<THook extends OverridableHook<AnyHook>>(
    hookWrapper: THook
  ): THook | null;
};
const HookOverridesContext = createContext<HookOverridesType | null>(null);
HookOverridesContext.displayName = "HookOverridesContext";

export function createOverridesProvider<
  THookOverrides extends { [propName: string]: OverridableHook<AnyHook> }
>(hooksToOverride: THookOverrides) {
  type HookOverridesProviderProps = { help?: boolean | "warn" | "error" } & {
    [P in keyof THookOverrides]?: Omit<THookOverrides[P], "isOverridableHook">;
  };
  const HookOverridesProvider: FC<HookOverridesProviderProps> = ({
    children,
    help,
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

        if (!override && help) {
          let error: Error;
          if (!Object.values(hooksToOverride).includes(hookWrapper)) {
            error = new Error(
              `react-overridable-hooks: register "${
                hookWrapper.isOverridableHook
              }" by adding it to createOverridesProvider({ ${Object.keys(
                hooksToOverride
              ).join(", ")} })`
            );
          } else {
            error = new Error(
              `react-overridable-hooks: no override was supplied for "${hookWrapper.isOverridableHook}"`
            );
          }
          Error.captureStackTrace(error, value.getHookOverride);
          if (help === "warn") {
            console.warn(error);
          } else {
            throw error;
          }
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

    if (override) {
      useDebugValue(`(overridden)`);
      return override(...args);
    } else {
      return hook(...args);
    }
  }) as OverridableHook<THook>;

  // Add some metadata:
  setFunctionName(hookWrapper, `${hook.name}(overridable)`);
  hookWrapper.isOverridableHook = hook.name || "overridableHook";

  return hookWrapper;
}

function setFunctionName(fn: AnyFunction, name: string) {
  Object.defineProperty(fn, "name", { value: name });
}
