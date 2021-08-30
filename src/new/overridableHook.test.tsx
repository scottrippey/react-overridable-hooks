import React from "react";
import { act, renderHook } from "@testing-library/react-hooks";

import { createOverridesProvider, overridableHook } from "./overridableHook";

function useCounterRaw(initial = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}
function useToggleRaw(initial = false) {
  const [toggled, setToggle] = React.useState(initial);
  const toggle = React.useCallback(
    (toggled: boolean) => setToggle((t) => toggled ?? !t),
    []
  );
  return { toggled, toggle };
}

describe("overridableHook", () => {
  const useCounter = overridableHook(useCounterRaw);
  const useToggle = overridableHook(useToggleRaw);

  const HookOverrides = createOverridesProvider({
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

  it("the hook can be overridden with a mock hook", () => {
    const increment = jest.fn();
    const { result, rerender } = renderHook(() => useCounter(), {
      wrapper: (p) => (
        <HookOverrides
          useCounter={(initial = 0) => ({ count: 55, increment })}
          {...p}
        />
      ),
    });
    expect(result.current).toMatchObject({ count: 55 });
    act(() => result.current.increment());
    expect(result.current).toMatchObject({ count: 55 });
    expect(increment).toHaveBeenCalled();

    rerender();
    expect(result.current).toMatchObject({ count: 55 });
  });

  describe("with the 'help' flag", () => {
    const useUnexpectedHook = overridableHook(function unexpectedHook() {});

    it("unexpected hooks throw errors", () => {
      const { result } = renderHook(() => useUnexpectedHook(), {
        wrapper: (p) => <HookOverrides help {...p} />,
      });
      expect(result.error).toMatchInlineSnapshot(
        `[Error: react-overridable-hooks: register "unexpectedHook" by adding it to createOverridesProvider({ useCounter, useToggle })]`
      );
    });

    it("empty hooks throw errors", () => {
      const { result } = renderHook(() => useCounter(), {
        wrapper: (p) => <HookOverrides help {...p} />,
      });
      expect(result.error).toMatchInlineSnapshot(
        `[Error: react-overridable-hooks: no override was supplied for "useCounterRaw"]`
      );
    });
  });

  describe("when not enabled", () => {
    const useHookRaw = jest.fn();
    const useHookEnabled = overridableHook(useHookRaw, { enabled: true });
    const useHookDisabled = overridableHook(useHookRaw, { enabled: false });

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
});
