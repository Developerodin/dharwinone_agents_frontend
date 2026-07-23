"use client";

import type { PreviewDevice } from "@/store/site-editor-store";

const DEVICE_WIDTH: Record<PreviewDevice, number | "100%"> = {
  desktop: "100%",
  tablet: 768,
  mobile: 375,
};

export function DevicePreviewFrame({
  device,
  children,
}: {
  device: PreviewDevice;
  children: React.ReactNode;
}) {
  const width = DEVICE_WIDTH[device];
  return (
    <div className="flex flex-1 items-start justify-center overflow-auto bg-[#e8eaed] p-4">
      <div
        className="bg-white shadow-lg transition-[width] duration-200"
        style={{
          width: typeof width === "number" ? width : width,
          maxWidth: "100%",
          minHeight: "100%",
        }}
        data-device={device}
      >
        {children}
      </div>
    </div>
  );
}

export function DeviceToggle({
  device,
  onChange,
}: {
  device: PreviewDevice;
  onChange: (d: PreviewDevice) => void;
}) {
  const items: { id: PreviewDevice; label: string }[] = [
    { id: "desktop", label: "Desktop" },
    { id: "tablet", label: "Tablet" },
    { id: "mobile", label: "Mobile" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-defaultborder bg-white p-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            device === item.id
              ? "bg-brand-green text-white"
              : "text-textmuted hover:bg-light"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
