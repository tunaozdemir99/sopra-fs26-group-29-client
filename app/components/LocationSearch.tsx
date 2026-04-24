"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Spin, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface SelectedLocation {
  label: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  onSelect: (location: SelectedLocation) => void;
  placeholder?: string;
  initialValue?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onSelect,
  placeholder = "Search for a location...",
  initialValue = "",
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);
  const userTypedRef = useRef(false);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data: GeoResult[] = await res.json();
      setResults(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userTypedRef.current) return;
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (item: GeoResult) => {
    const loc: SelectedLocation = {
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    skipSearchRef.current = true;
    setSelected(loc);
    setResults([]);
    setQuery(item.display_name.split(",")[0]);
    onSelect(loc);
  };

  return (
    <div style={{ position: "relative" }}>
      <Input
        value={query}
        onChange={(e) => { userTypedRef.current = true; setQuery(e.target.value); setSelected(null); }}
        placeholder={placeholder}
        prefix={<EnvironmentOutlined style={{ color: "#2563eb" }} />}
        suffix={loading ? <Spin size="small" /> : null}
      />

      {results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #dbeafe",
          borderRadius: 8,
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: 200,
          overflowY: "auto",
        }}>
          {results.map((item) => (
            <button
              key={`${item.lat},${item.lon}`}
              type="button"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
              }}
              onClick={() => handleSelect(item)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Text style={{ fontSize: 13, color: "#111" }}>{item.display_name}</Text>
            </button>
          ))}
        </div>
      )}

      {selected && results.length === 0 && (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
          📍 {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
        </Text>
      )}
    </div>
  );
};

export default LocationSearch;
