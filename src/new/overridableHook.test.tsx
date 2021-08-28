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
  describe("with default options", () => {
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
        wrapper: (p) => <HookOverrides {...p} />,
      });
      expect(result.current).toMatchObject({ count: 0 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 1 });
    });

    it("the hook can be overridden with a mock hook", () => {
      const increment = jest.fn();
      const useCounterMock: typeof useCounter = (initial = 0) => ({
        count: initial,
        increment,
      });

      const { result, rerender } = renderHook(
        ({ initial }) => useCounter(initial),
        {
          wrapper: (p) => <HookOverrides useCounter={useCounterMock} {...p} />,
          initialProps: { initial: 77 },
        }
      );
      expect(result.current).toMatchObject({ count: 77 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 77 });
      expect(increment).toHaveBeenCalled();

      rerender({ initial: 88 });
      expect(result.current).toMatchObject({ count: 88 });
    });
  });

  describe("when required", () => {
    // const [
    //   useCounterRequired,
    //   CounterProviderRequired,
    // ] = overridableHook(useCounterRaw, { required: true });
    //
    // it.skip("with no Provider, the hook throws an error", () => {
    //   const { result } = renderHook(() => useCounterRequired());
    //
    //   expect(result.error).toMatchInlineSnapshot(
    //     `[Error: Missing hook override Provider for 'useCounterHook' hook]`
    //   );
    // });
    // it.skip("with no value, the Provider uses the original hook", () => {
    //   const { result } = renderHook(() => useCounterRequired(), {
    //     wrapper: (p) => <CounterProviderRequired {...p} />,
    //   });
    //   expect(result.current).toMatchObject({ count: 0 });
    //   act(() => result.current.increment());
    //   expect(result.current).toMatchObject({ count: 1 });
    // });
  });

  describe("when not enabled", () => {
    // const [useCounterProd, CounterProviderProd] = overridableHook(
    //   useCounterRaw,
    //   { enabled: false }
    // );
    //
    // it.skip("the hook is passed through untouched", () => {
    //   expect(useCounterProd).toBe(useCounterRaw);
    // });
    //
    // it.skip("the supplied Provider throws an error if used", () => {
    //   expect(() => {
    //     // TODO: prevent React from logging the warning message:
    //     renderHook(() => useCounterProd(), {
    //       wrapper: (p) => <CounterProviderProd {...p} />,
    //     });
    //   }).toThrowErrorMatchingInlineSnapshot(
    //     `"Warning: you cannot use this HookOverrideProvider because this override is not enabled."`
    //   );
    // });
  });
});
