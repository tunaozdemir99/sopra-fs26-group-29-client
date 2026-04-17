"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths (broken in webpack/Next.js builds)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color?: "blue" | "green";
}

/** Auto-fit the map to show all markers */
const FitBounds: React.FC<{ markers: MapMarker[] }> = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, markers]);
  return null;
};

/** Emit lat/lng when user clicks the map */
const ClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface TripMapProps {
  markers: MapMarker[];
  /** When provided the map is clickable and emits the clicked coordinate */
  onMapClick?: (lat: number, lng: number) => void;
  height?: number | string;
}

const TripMap: React.FC<TripMapProps> = ({ markers, onMapClick, height = 400 }) => {
  const defaultCenter: [number, number] = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : [48.8566, 2.3522]; // Paris as fallback

  return (
    <MapContainer
      center={defaultCenter}
      zoom={markers.length === 0 ? 4 : 12}
      style={{ height, width: "100%", borderRadius: 8, zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.length > 0 && <FitBounds markers={markers} />}
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}

      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]}>
          <Popup>{m.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default TripMap;
