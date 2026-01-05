import { useMemo, useState } from "react";

import type { ComboboxOption } from "./Combobox";

export function useComboboxFilter(options: ComboboxOption[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }

    try {
      const regex = new RegExp(searchQuery, "i");
      return options.filter(
        (opt) => regex.test(opt.label) || regex.test(opt.value),
      );
    } catch {
      const query = searchQuery.toLowerCase();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          opt.value.toLowerCase().includes(query),
      );
    }
  }, [options, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredOptions,
  };
}
