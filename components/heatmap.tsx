"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

type Point = [number, number, number];
type Props = {
  data: Array<{
    location: { latitude: number; longitude: number };
    query: { affinity: number };
  }>;
};

export default function HeatmapMap({ data }: Props) {
  const heatData: Point[] = data.map(({ location, query }) => [
    location.latitude,
    location.longitude,
    query.affinity,
  ]);

  return (
    <MapContainer
      center={[heatData[0][0], heatData[0][1]]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <HeatmapLayer
        fitBoundsOnLoad
        fitBoundsOnUpdate
        points={heatData}
        longitudeExtractor={(m: any) => m[1]}
        latitudeExtractor={(m: any) => m[0]}
        intensityExtractor={(m: any) => m[2]}
      />
    </MapContainer>
  );
}
