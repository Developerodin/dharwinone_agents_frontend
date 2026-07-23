import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit site | DharwinOne",
};

export default function SiteEditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
