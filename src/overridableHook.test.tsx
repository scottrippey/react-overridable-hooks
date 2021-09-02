import React from "react";
import { act, renderHook } from "@testing-library/react-hooks";

import {
  createHookOverridesProvider,
  overridableHook,
  testableHook,
} from "./overridableHook";

function useCounterRaw(initial = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}
function useToggleRaw(initial = false) {
  const [toggled, setToggle] = React.useState(initial);
  const toggle = React.useCallback(
    (toggled?: boolean) => setToggle((t) => toggled ?? !t),
    []
  );
  return { toggled, toggle };
}

describe("overridableHook", () => {
  // Some "real" hooks:
  const useCounter = overridableHook(useCounterRaw);
  const useToggle = overridableHook(useToggleRaw);
  const useCounterAndToggle = () => {
    return { ...useCounter(), ...useToggle() };
  };

  // Some overrides:
  const increment = jest.fn();
  const useCounterMock = (initial = 0) => ({ count: 55, increment });
  const toggle = jest.fn();
  const useToggleMock = () => ({ toggled: true, toggle });

  const HookOverrides = createHookOverridesProvider({
    useCounter,
    useToggle,
  });

  it("with no Provider, the hook behaves normally", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current).toMatchObject({ count: 0 });
    act(() => result.current.increment());
    expect(result.current).toMatchObject({ count: 1 });
  });

  it("with an empty Provider, the hook behaves normally", () => {
    const { result } = renderHook(() => useCounter(), {
      wrapper: (p) => <HookOverrides>{p.children}</HookOverrides>,
    });
    expect(result.current).toMatchObject({ count: 0 });
    act(() => result.current.increment());
    expect(result.current).toMatchObject({ count: 1 });
  });

  it("a hook can be overridden with a mock hook", () => {
    const { result, rerender } = renderHook(() => useCounter(), {
      wrapper: (p) => <HookOverrides useCounter={useCounterMock} {...p} />,
    });
    expect(result.current).toMatchObject({ count: 55 });
    act(() => result.current.increment());
    expect(result.current).toMatchObject({ count: 55 });
    expect(increment).toHaveBeenCalled();

    rerender();
    expect(result.current).toMatchObject({ count: 55 });
  });

  it("multiple hooks can be overridden", () => {
    const { result, rerender } = renderHook(() => useCounterAndToggle(), {
      wrapper: (p) => (
        <HookOverrides
          useCounter={useCounterMock}
          useToggle={useToggleMock}
          {...p}
        />
      ),
    });
    expect(result.current).toMatchObject({ count: 55, toggled: true });
    act(() => result.current.increment());
    act(() => result.current.toggle());
    expect(result.current).toMatchObject({ count: 55, toggled: true });
    expect(increment).toHaveBeenCalled();
    expect(toggle).toHaveBeenCalled();

    rerender();
    expect(result.current).toMatchObject({ count: 55, toggled: true });
  });

  it("nested providers can be used", () => {
    const { result, rerender } = renderHook(() => useCounterAndToggle(), {
      wrapper: (p) => (
        <HookOverrides useCounter={useCounterMock}>
          <HookOverrides useToggle={useToggleMock}>
            <HookOverrides>{p.children}</HookOverrides>
          </HookOverrides>
        </HookOverrides>
      ),
    });
    expect(result.current).toMatchObject({ count: 55, toggled: true });
    act(() => result.current.increment());
    act(() => result.current.toggle());
    expect(result.current).toMatchObject({ count: 55, toggled: true });
    expect(increment).toHaveBeenCalled();
    expect(toggle).toHaveBeenCalled();

    rerender();
    expect(result.current).toMatchObject({ count: 55, toggled: true });
  });

  describe("with the 'help' flag", () => {
    const useUnexpectedHook = overridableHook(function unexpectedHook() {});

    let warn: jest.SpyInstance;
    beforeEach(() => {
      warn = jest.spyOn(console, "warn");
      warn.mockReturnValue(undefined);
    });
    afterEach(() => {
      warn.mockRestore();
    });

    it("unexpected hooks log errors", () => {
      const { result } = renderHook(() => useUnexpectedHook(), {
        wrapper: (p) => <HookOverrides help {...p} />,
      });
      expect(warn).toHaveBeenCalled();
      expect(warn.mock.calls[0][0]).toMatchInlineSnapshot(
        `[Error: react-overridable-hooks: register "unexpectedHook" by adding it to createOverridesProvider({ useCounter, useToggle })]`
      );
    });

    it("empty hooks throw errors", () => {
      const { result } = renderHook(() => useCounter(), {
        wrapper: (p) => <HookOverrides help="error" {...p} />,
      });
      expect(result.error).toMatchInlineSnapshot(
        `[Error: react-overridable-hooks: no override was supplied for "useCounterRaw"]`
      );
    });

    it("no errors are thrown when all overrides are provided", () => {
      const { result } = renderHook(() => useCounterAndToggle(), {
        wrapper: (p) => (
          <HookOverrides
            help
            useCounter={useCounterMock}
            useToggle={useToggleMock}
          >
            {p.children}
          </HookOverrides>
        ),
      });
      expect(result.current).toMatchObject({ count: 55, toggled: true });
    });

    it("even when nested, unexpected hooks throw errors", () => {
      const { result } = renderHook(() => useCounterAndToggle(), {
        wrapper: (p) => (
          <HookOverrides help>
            <HookOverrides useCounter={useCounterMock}>
              {p.children}
            </HookOverrides>
          </HookOverrides>
        ),
      });
    });
  });

  describe("when not enabled", () => {
    const useHookRaw = jest.fn();
    const useHookEnabled = testableHook(useHookRaw, { enabled: true });
    const useHookDisabled = testableHook(useHookRaw, { enabled: false });

    it("enabled hooks should return new hooks", () => {
      expect(useHookEnabled).not.toBe(useHookRaw);
      renderHook(() => useHookEnabled());
      expect(useHookRaw).toHaveBeenCalledTimes(1);
    });
    it("disabled hooks should return the original hook, unmodified", () => {
      expect(useHookDisabled).toBe(useHookRaw);
      renderHook(() => useHookDisabled());
      expect(useHookRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe("with defaults", () => {
    const HookOverridesWithDefaults = createHookOverridesProvider(
      { useCounter },
      { defaults: { useCounter: () => ({ count: 9999, increment }) } }
    );

    it("with an empty Provider, the default hook overrides are used", () => {
      const { result } = renderHook(() => useCounter(), {
        wrapper: (p) => <HookOverridesWithDefaults {...p} />,
      });
      expect(result.current).toMatchObject({ count: 9999 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 9999 });
    });

    it("a hook can be overridden normally with a mock hook", () => {
      const { result, rerender } = renderHook(() => useCounter(), {
        wrapper: (p) => (
          <HookOverridesWithDefaults useCounter={useCounterMock} {...p} />
        ),
      });
      expect(result.current).toMatchObject({ count: 55 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 55 });
      expect(increment).toHaveBeenCalled();
    });
  });
});
