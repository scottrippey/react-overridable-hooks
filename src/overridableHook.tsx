import React, { createContext, FC, useContext, useDebugValue } from "react";

type AnyFunction = (...args: any) => any;
export type AnyHook = AnyFunction;
export type OverridableHook<THook extends AnyHook> = THook & {
  /**
   * This property is used to identify an overridable hook.
   * It also holds the name of the actual raw hook (if supplied) for debugging purposes.
   */
  isOverridableHook: string;
};

// Used internally
type HookOverridesContextType = {
  getHookOverride<THook extends OverridableHook<AnyHook>>(
    hookWrapper: THook
  ): THook | null;
};
const HookOverridesContext = createContext<HookOverridesContextType | null>(
  null
);
HookOverridesContext.displayName = "HookOverridesContext";

/**
 * This Provider allows us to override any of the registered hooks.
 *
 * Each hook override should match the original hook signature.
 *
 * If needed, add the `help` or `help='warn'` property to help identify which hooks can be overridden.
 */
type HookOverridesProps<THookOverrides extends HookOverridesBase> = {
  /**
   * When true, an error will be thrown for any overridable hooks that are not mocked.
   * This makes it easy to find overridable hooks.
   * Once all overridable hooks are mocked, the `help` prop can be removed.
   *
   * "warn" will simply log to the console, instead of throwing an error.
   */
  help?: boolean | "warn" | "error";
} & {
  /**
   * Overrides a hook with a new function.  Signatures should match.
   * Overrides are optional; if not supplied, the original hook will be used.
   */
  [P in keyof THookOverrides]?: THookOverrides[P] extends OverridableHook<
    infer THook
  >
    ? THook
    : THookOverrides[P];
};

export type HookOverridesBase = {
  /**
   * A list of all hooks that can be overridden by this provider
   */
  [propName: string]: OverridableHook<AnyHook>;
};

/**
 * Creates a HookOverridesProvider which can be used to override hooks.
 *
 * @example
 * const HookOverrides = createHookOverridesProvider({ useCounter, useToggle });
 * const Example = () => (
 *   <HookOverrides
 *     useCounter={() => ({ count: 99 })}
 *     useToggle={() => ({ toggled: true })}
 *   >
 *     <Counter>
 *   </HookOverrides>;
 * );
 *
 * @param hooksToOverride An object that lists all hooks which this provider should be able to override.
 *                        These hooks must have been wrapped with `testableHook` or `overridableHook`.
 * @param options
 */
export function createHookOverridesProvider<
  THookOverrides extends HookOverridesBase
>(
  hooksToOverride: THookOverrides,
  options?: { defaults?: HookOverridesProps<THookOverrides> }
) {
  const HookOverridesProvider: FC<HookOverridesProps<THookOverrides>> = ({
    children,
    help = options?.defaults?.help,
    ...hookOverrides
  }) => {
    if (options?.defaults) {
      hookOverrides = { ...options.defaults, ...hookOverrides };
    }

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
          handleHelp(hooksToOverride, hookWrapper, value.getHookOverride, help);
        }

        return override;
      },
    } as HookOverridesContextType;

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

function handleHelp<
  THookOverrides extends HookOverridesBase,
  THook extends AnyHook
>(
  hooksToOverride: THookOverrides,
  hookWrapper: OverridableHook<THook>,
  errorScope: Function,
  help: "warn" | "error" | true
) {
  // Let's throw / log some errors that help identify the hooks that can be overridden:
  let error: Error;
  if (!Object.values(hooksToOverride).includes(hookWrapper)) {
    const hookNames = Object.keys(hooksToOverride).join(", ");
    const hookName = hookWrapper.isOverridableHook;
    error = new Error(
      `react-overridable-hooks: register "${hookName}" by adding it to createOverridesProvider({ ${hookNames} })`
    );
  } else {
    // Notes:
    error = new Error(
      `react-overridable-hooks: no override was supplied for "${hookWrapper.isOverridableHook}"`
    );
  }

  // Throw or log the error:
  Error.captureStackTrace(error, errorScope);
  if (help === "error") {
    throw error;
  } else {
    console.warn(error);
  }
}

export type TestableHookOptions = {
  /**
   * If false, the hook will be passed through untouched.
   *
   * Default is true for the following environments:
   * - NODE_ENV=test (the default for Jest)
   * - STORYBOOK=true (the default for Storybook)
   * - TESTABLE_HOOKS_ENABLED=true (manually set by you)
   */
  enabled?: boolean;
};

/**
 * Wraps a hook, so that it can be optionally overridden.
 *
 * By default, the returned wrapper is identical to the hook, and should be used in its place.
 * However, a HookOverridesProvider can be used to override the hook.
 *
 * This is especially useful for mocking, for tests, or for Storybook integration.
 *
 * For non-test environments, there is no overhead; the original hook will be passed-through verbatim.
 *
 * @param hook - Any hook-like function
 * @param [options] - Default: { enabled: NODE_ENV === 'test' || STORYBOOK === 'true' || TESTABLE_HOOKS_ENABLED === 'true' }
 */
export function testableHook<THook extends AnyHook>(
  hook: THook,
  {
    enabled = process.env.NODE_ENV === "test" ||
      process.env.STORYBOOK === "true" ||
      process.env.TESTABLE_HOOKS_ENABLED === "true",
  }: TestableHookOptions = {}
) {
  if (!enabled) {
    return hook as OverridableHook<THook>;
  }

  return overridableHook(hook);
}

/**
 * Wraps a hook, so that it can be optionally overridden.
 *
 * By default, the returned wrapper is identical to the hook, and should be used in its place.
 * However, a HookOverridesProvider can be used to override the hook.
 *
 * This is especially useful for mocking, for tests, or for Storybook integration.
 *
 * @param hook - Any hook-like function
 */
export function overridableHook<THook extends AnyHook>(
  hook: THook
): OverridableHook<THook> {
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

function setFunctionName(fn: Function, name: string) {
  Object.defineProperty(fn, "name", { value: name });
}
