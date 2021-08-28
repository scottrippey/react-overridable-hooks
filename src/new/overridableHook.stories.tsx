import React, { useEffect, useState } from "react";
import { action } from "@storybook/addon-actions";

import { createOverridesProvider, testableHook } from "./overridableHook";

const useExampleState = testableHook(function useExampleState() {
  const [state, setState] = useState("");
  return { state, setState };
});

const useExampleData = testableHook(function useExampleData(state: string) {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
      setData(`example results for "${state}"`);
    }, 300);
    return () => clearTimeout(t);
  }, [state]);
  return { data, loading };
});

const Example = () => {
  const { state, setState } = useExampleState();
  const { data, loading } = useExampleData(state);

  return (
    <div>
      <input value={state} onChange={(e) => setState(e.currentTarget.value)} />
      <p>{data}</p>
      <p>{loading && `Loading results for "${state}"...`}</p>
    </div>
  );
};

// STORIES:

export default { title: "Example" };

const HookOverrides = createOverridesProvider({
  useExampleData,
  useExampleState,
});

export const Uncontrolled = () => (
  <>
    <HookOverrides>
      <Example />
    </HookOverrides>
  </>
);
export const ControlledData = () => (
  <>
    <HookOverrides
      useExampleData={(state) => ({ data: "fake data", loading: true })}
    >
      <Example />
    </HookOverrides>
  </>
);
export const ControlledStateAndData = () => (
  <>
    <HookOverrides
      useExampleState={() => ({
        state: "fake state",
        setState: action("setState"),
      })}
      useExampleData={(state) => ({ data: "fake data", loading: false })}
    >
      <Example />
    </HookOverrides>
  </>
);
