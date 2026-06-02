"use client";

import dynamic from "next/dynamic";

const StlViewer = dynamic(
  () => import("./StlViewer").then((m) => m.StlViewer),
  { ssr: false, loading: () => null },
);

export function StlViewerLoader(props: {
  url: string;
  posterUrl?: string | null;
  className?: string;
}) {
  return <StlViewer {...props} />;
}
