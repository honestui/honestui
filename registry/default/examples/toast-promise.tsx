"use client";

import { Button } from "@/registry/default/ui/button";
import { toastManager } from "@/registry/default/ui/toast";

export default function ToastPromise() {
  function showResult(result: "success" | "error") {
    const request = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (result === "success") resolve("Report loaded");
        else reject(new Error("Report request failed"));
      }, 900);
    });

    toastManager.promise(request, {
      loading: {
        title: "Loading report…",
        description: "The report request is in progress.",
      },
      success: (data: string) => ({
        title: data,
        description: "The latest results are ready to review.",
      }),
      error: () => ({
        title: "Report not loaded",
        description: "Check your connection, then try again.",
      }),
    });
  }

  return (
    <div className="flex flex-wrap gap-[var(--hui-space-3)]">
      <Button variant="secondary" onClick={() => showResult("success")}>
        Load successfully
      </Button>
      <Button variant="outline" onClick={() => showResult("error")}>
        Show failed request
      </Button>
    </div>
  );
}
