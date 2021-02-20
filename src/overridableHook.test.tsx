import React from "react";
import { act, renderHook } from "@testing-library/react-hooks";

import { overridableHook } from "./overridableHook";

function useCounterHook(initial: number = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}

describe("overridableHook", () => {
  describe("with default options", () => {
    const [useCounter, CounterProvider] = overridableHook(useCounterHook);

    it("with no value, the Provider uses the original hook", () => {
      const { result } = renderHook(() => useCounter(), {
        wrapper: (p) => <CounterProvider {...p} />,
      });
      expect(result.current).toMatchObject({ count: 0 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 1 });
    });

    it("the hook can be overridden with a static value", () => {
      const mockCounter = { count: 5, increment: jest.fn() };
      const { result } = renderHook(() => useCounter(), {
        wrapper: (p) => <CounterProvider {...p} value={mockCounter} />,
      });
      expect(result.current).toMatchObject({ count: 5 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 5 });
      expect(mockCounter.increment).toHaveBeenCalled();
    });

    it("the hook can be overridden with a dynamic value", () => {
      const increment = jest.fn();
      const getMockCounter: typeof useCounter = (initial = 0) => ({
        count: initial,
        increment,
      });

      const { result, rerender } = renderHook(
        ({ initial }) => useCounter(initial),
        {
          wrapper: (p) => <CounterProvider {...p} value={getMockCounter} />,
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
    const [
      useCounterRequired,
      CounterProviderRequired,
    ] = overridableHook(useCounterHook, { required: true });

    it("with no Provider, the hook throws an error", () => {
      const { result } = renderHook(() => useCounterRequired());

      expect(result.error).toMatchInlineSnapshot(
        `[Error: Missing hook override Provider for 'useCounterHook' hook]`
      );
    });
    it("with no value, the Provider uses the original hook", () => {
      const { result } = renderHook(() => useCounterRequired(), {
        wrapper: (p) => <CounterProviderRequired {...p} />,
      });
      expect(result.current).toMatchObject({ count: 0 });
      act(() => result.current.increment());
      expect(result.current).toMatchObject({ count: 1 });
    });
  });

  describe("when not enabled", () => {
    const [
      useCounterProd,
      CounterProviderProd,
    ] = overridableHook(useCounterHook, { enabled: false });

    it("the hook is passed through untouched", () => {
      expect(useCounterProd).toBe(useCounterHook);
    });

    it("the supplied Provider throws an error if used", () => {
      expect(() => {
        // TODO: prevent React from logging the warning message:
        renderHook(() => useCounterProd(), {
          wrapper: (p) => <CounterProviderProd {...p} />,
        });
      }).toThrowErrorMatchingInlineSnapshot(
        `"Warning: you cannot use this HookOverrideProvider because this override is not enabled."`
      );
    });
  });
});
