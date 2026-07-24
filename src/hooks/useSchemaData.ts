import { useState, useEffect } from "react";
import type { SchemaTable } from "../schema_data";

export interface CommonQueryItem {
  title: string;
  description: string;
  sql: string;
}

export interface SchemaDataState {
  SCHEMA_TABLES: SchemaTable[];
  COMMON_SQL_QUERIES: CommonQueryItem[];
  SQL_SCHEMA_CONTENT: string;
}

export function useSchemaData() {
  const [data, setData] = useState<SchemaDataState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    import("../schema_data").then((mod) => {
      if (isMounted) {
        setData({
          SCHEMA_TABLES: mod.SCHEMA_TABLES,
          COMMON_SQL_QUERIES: mod.COMMON_SQL_QUERIES,
          SQL_SCHEMA_CONTENT: mod.SQL_SCHEMA_CONTENT
        });
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading };
}
