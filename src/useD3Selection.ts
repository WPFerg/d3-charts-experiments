import { useMemo, useState } from "react";
import { select, Selection } from "d3";

type D3Selection<T extends Element> = Selection<T, undefined, null, undefined>;

const useD3Selection = <T extends Element>(): [
  D3Selection<T> | null,
  (element: T) => void
] => {
  const [element, setElement] = useState<T | null>(null);
  const selection: D3Selection<T> | null = useMemo(
    () => (element ? select(element) : null),
    [element]
  );

  return [selection, setElement];
};

export default useD3Selection;
