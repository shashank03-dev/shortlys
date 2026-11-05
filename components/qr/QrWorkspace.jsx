"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { QrGenerator } from "./QrGenerator";
import { QrManageSection } from "./QrManageSection";

export function QrWorkspace(props) {
  const [revision, setRevision] = useState(0);
  const { user } = useUser();
  return (
    <div>
      <QrGenerator {...props} onSaved={() => setRevision((value) => value + 1)} />
      <QrManageSection key={user?.id || "public"} revision={revision} />
    </div>
  );
}
