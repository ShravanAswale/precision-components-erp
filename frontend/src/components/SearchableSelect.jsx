import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select...",
  required = false,
  disabled = false,
  name = "",
  // multiple=false gives single-select; multiple=true enables tag-based multi-pick
  multiple = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // ─── Normalise value ────────────────────────────────────────────
  const selectedValues = multiple
    ? Array.isArray(value) ? value : []
    : value;

  // Selected option objects (for tag / label rendering)
  const selectedOptions = multiple
    ? options.filter((o) => selectedValues.includes(o.value))
    : options.find((o) => o.value === selectedValues) || null;

  // ─── Filter list ────────────────────────────────────────────────
  // Already-selected options are hidden from list in multi mode
  const filtered = options.filter((o) => {
    const matchesQuery = query.trim()
      ? o.label.toLowerCase().startsWith(query.trim().toLowerCase())
      : true;
    const notAlreadySelected = multiple
      ? !selectedValues.includes(o.value)
      : true;
    return matchesQuery && notAlreadySelected;
  });

  // ─── Close on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (option) => {
    if (multiple) {
      onChange([...selectedValues, option.value]);
      setQuery("");
      // Keep open and re-focus for next pick
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      onChange(option.value);
      setOpen(false);
      setQuery("");
    }
  };

  // Single: clear selection
  const handleClearSingle = (e) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setQuery("");
  };

  // Multi: remove one tag
  const handleRemoveTag = (val, e) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== val));
  };

  // Multi: clear all
  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  // ─── Trigger area ───────────────────────────────────────────────
  const triggerClasses = `
    w-full min-h-[42px] px-3 py-1.5 border border-gray-200 rounded-lg
    flex flex-wrap items-center gap-1.5 cursor-pointer bg-white transition
    ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-teal-400"}
    ${open ? "ring-2 ring-teal-500 border-teal-500" : ""}
  `;

  return (
    <div ref={containerRef} className="relative w-full" name={name}>

      {/* ── Trigger ── */}
      <div onClick={handleOpen} className={triggerClasses}>

        {multiple ? (
          /* Multi mode: show tags */
          <>
            {selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => (
                <span key={opt.value} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium px-2 py-0.5 rounded-full">
                  {opt.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(opt.value, e)}
                      className="text-teal-500 hover:text-teal-700"
                      tabIndex={-1}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">{placeholder}</span>
            )}

            <div className="ml-auto flex items-center gap-1 flex-shrink-0 pl-1">
              {selectedOptions.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  tabIndex={-1}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
          </>
        ) : (
          /* Single mode: show label */
          <>
            <span className={`text-sm truncate ${selectedOptions?.label ? "text-gray-900" : "text-gray-400"}`}>
              {selectedOptions?.label || placeholder}
            </span>
            <div className="flex items-center gap-1 ml-auto flex-shrink-0 pl-1">
              {selectedValues && !disabled && (
                <button
                  type="button"
                  onClick={handleClearSingle}
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  tabIndex={-1}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Hidden input for required validation ── */}
      {required && (
        <input
          type="text"
          required
          value={multiple ? (selectedValues.length > 0 ? "valid" : "") : selectedValues}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">

          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                {multiple && options.length === selectedValues.length
                  ? "All options selected"
                  : "No results found"}
              </li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${!multiple && option.value === selectedValues
                      ? "bg-teal-50 text-teal-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-teal-700"}
                  `}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>

          {/* Footer hint for multi mode */}
          {multiple && selectedValues.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
              {selectedValues.length} selected — click outside to close
            </div>
          )}
        </div>
      )}
    </div>
  );
}
