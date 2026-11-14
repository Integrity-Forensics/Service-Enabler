/* ==============================================
 * IMPORTS
 * ============================================== */

import { Search } from "lucide-react";

import "../CSS/ui/SearchBar.css";

/* ==============================================
 * SEARCH BAR
 * ============================================== */

/**
 * Controlled search input with a leading icon.
 *
 * @param {{ value: string, placeholder?: string, onChange: function }} props
 * @returns {import("react").JSX.Element}
 */
export default function SearchBar({
  value,
  placeholder = "Search",
  onChange,
}) {
  return (
    <label className="search-bar">
      {/* Search icon */}
      <Search aria-hidden="true" strokeWidth={2} />

      {/* Search input */}
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
