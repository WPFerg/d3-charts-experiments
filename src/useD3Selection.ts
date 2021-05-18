import { useMemo, useState } from "react";
import { select, Selection } from "d3";

// The selection returned doesn't have any bound data, nor is it selected
// from a parent node. Frustratingly, most types in the @types/d3 library
// use any, any, any, which isn't assignable to the more strict alternative
// of never, null, undefined.
type WeakD3Selection<T extends Element> = Selection<T, any, any, any>;

const useD3Selection = <T extends Element>(): [
  WeakD3Selection<T> | null,
  (element: T) => void
] => {
  const [element, setElement] = useState<T | null>(null);
  const selection: WeakD3Selection<T> | null = useMemo(
    () => (element ? select(element) : null),
    [element]
  );

  return [selection, setElement];
};

export default useD3Selection;
