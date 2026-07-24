import { useState, useEffect, useCallback } from "react";
import type { BugItem } from "../bugs_data";

export function useBugsData() {
  const [bugs, setBugs] = useState<BugItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    import("../bugs_data").then((mod) => {
      if (isMounted) {
        setBugs(mod.BUGS_LIST_DATA);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const exportPdf = useCallback(async () => {
    const mod = await import("../bugs_data");
    mod.generateBugsReportPDF();
  }, []);

  return { bugs, loading, exportPdf };
}
