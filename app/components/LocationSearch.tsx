"use client";

import React, { useState } from "react";
import { Input, Button, List, Spin, Typography } from "antd";
import { SearchOutlined, EnvironmentOutlined } from "@ant-design/icons";

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
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onSelect,
  placeholder = "Search for a location...",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      const data: GeoResult[] = await res.json();
      setResults(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: GeoResult) => {
    const loc: SelectedLocation = {
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    setSelected(loc);
    setResults([]);
    setQuery(item.display_name.split(",")[0]);
    onSelect(loc);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={search}
          placeholder={placeholder}
          prefix={<EnvironmentOutlined style={{ color: "#2563eb" }} />}
        />
        <Button icon={<SearchOutlined />} onClick={search} loading={loading} />
      </div>

      {loading && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Spin size="small" />
        </div>
      )}

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
          <List
            size="small"
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: "pointer", padding: "8px 12px" }}
                onClick={() => handleSelect(item)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Text style={{ fontSize: 13, color: "#111" }}>{item.display_name}</Text>
              </List.Item>
            )}
          />
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
