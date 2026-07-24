import React, { memo } from "react";
import { 
  Database, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Search, 
  Code,
  ChevronRight,
  ArrowRightLeft,
  BookOpen
} from "lucide-react";
import { useSchemaData } from "../../../hooks/useSchemaData";

interface SchemaViewerTabProps {
  themeMode: "light" | "dark";
  activeTab: "visual" | "code" | "queries" | "java";
  selectedTableName: string;
  setSelectedTableName: (name: string) => void;
  sqlSearch: string;
  setSqlSearch: (val: string) => void;
  copiedAll: boolean;
  copiedQueryIndex: number | null;
  handleCopyAll: () => void;
  handleCopyQuery: (sql: string, index: number) => void;
  handleDownloadFile: () => void;
}

export const SchemaViewerTab: React.FC<SchemaViewerTabProps> = memo(({
  themeMode,
  activeTab,
  selectedTableName,
  setSelectedTableName,
  sqlSearch,
  setSqlSearch,
  copiedAll,
  copiedQueryIndex,
  handleCopyAll,
  handleCopyQuery,
  handleDownloadFile
}) => {
  const { data, loading } = useSchemaData();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 font-mono text-xs text-slate-500 uppercase tracking-wider animate-pulse">
        Loading schema metadata...
      </div>
    );
  }

  const { SCHEMA_TABLES, COMMON_SQL_QUERIES, SQL_SCHEMA_CONTENT } = data;
  const selectedTable = SCHEMA_TABLES.find(t => t.name === selectedTableName) || SCHEMA_TABLES[0];

  const getTableConnections = (tableName: string) => {
    if (tableName === "users") return { sources: [], targets: ["user_roles", "refresh_tokens"] };
    if (tableName === "roles") return { sources: [], targets: ["user_roles", "role_permissions"] };
    if (tableName === "permissions") return { sources: [], targets: ["role_permissions"] };
    if (tableName === "user_roles") return { sources: ["users", "roles"], targets: [] };
    if (tableName === "role_permissions") return { sources: ["roles", "permissions"], targets: [] };
    if (tableName === "refresh_tokens") return { sources: ["users"], targets: [] };
    return { sources: [] as string[], targets: [] as string[] };
  };

  const currentConnections = getTableConnections(selectedTableName);

  return (
    <div className="space-y-6">
      {/* 1. VISUAL INTERACTIVE ER DESIGNER */}
      {activeTab === "visual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR: TABLES SELECTOR */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
              Entities & Tables ({SCHEMA_TABLES.length})
            </h3>

            <div className="space-y-2">
              {SCHEMA_TABLES.map((t) => {
                const isSel = t.name === selectedTableName;
                return (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTableName(t.name)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSel
                        ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-md shadow-blue-500/5"
                        : themeMode === "dark"
                        ? "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className={`h-4 w-4 ${isSel ? "text-blue-400" : "text-slate-400"}`} />
                      <div>
                        <div className="font-mono text-xs font-bold">{t.name}</div>
                        <div className="text-[10px] text-slate-400">{t.columns.length} Fields</div>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isSel ? "translate-x-0.5 text-blue-400" : "text-slate-400"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT VIEW: TABLE SCHEMA DETAILS & ER CONNECTIONS */}
          <div className="lg:col-span-8 space-y-6">
            <div className={`p-6 rounded-2xl border ${
              themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-800/80 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-bold font-mono text-blue-400">{selectedTable.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedTable.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                    3NF Schema
                  </span>
                </div>
              </div>

              {/* COLUMNS TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3 px-2">Column</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Key / Nullable</th>
                      <th className="pb-3 px-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedTable.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-slate-200">{col.name}</td>
                        <td className="py-2.5 px-2 text-cyan-400">{col.type}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            col.isPk
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : col.isFk
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {col.isPk ? "PRIMARY KEY" : col.isFk ? "FOREIGN KEY" : col.isNullable ? "NULL" : "NOT NULL"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-400 text-[11px]">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ER CONNECTIVITY GRAPH */}
              <div className="mt-8 pt-6 border-t border-slate-800/80">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                  Foreign Key Relationships
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-2">Incoming References (FK)</span>
                    {currentConnections.sources.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono italic">None (Root Entity)</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentConnections.sources.map(s => (
                          <span key={s} className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-2">Outgoing Targets (Referenced By)</span>
                    {currentConnections.targets.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono italic">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentConnections.targets.map(t => (
                          <span key={t} className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono text-xs border border-blue-500/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SQL DDL CODE VIEW */}
      {activeTab === "code" && (
        <div className={`p-6 rounded-2xl border font-mono ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">PostgreSQL DDL Definitions</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedAll ? "Copied" : "Copy SQL"}</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download DDL</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-[600px]">
            <code>{SQL_SCHEMA_CONTENT}</code>
          </pre>
        </div>
      )}

      {/* 3. COMMON SQL QUERIES TAB */}
      {activeTab === "queries" && (
        <div className="space-y-4 font-mono">
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search queries by title, description or SQL..."
                value={sqlSearch}
                onChange={(e) => setSqlSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {COMMON_SQL_QUERIES
              .filter(q => q.title.toLowerCase().includes(sqlSearch.toLowerCase()) || q.sql.toLowerCase().includes(sqlSearch.toLowerCase()))
              .map((q, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${
                  themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      {q.title}
                    </h4>
                    <button
                      onClick={() => handleCopyQuery(q.sql, idx)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedQueryIndex === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedQueryIndex === idx ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">{q.description}</p>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 text-xs overflow-x-auto border border-slate-850">
                    <code>{q.sql}</code>
                  </pre>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. JAVA DTO MODELS TAB */}
      {activeTab === "java" && (
        <div className={`p-6 rounded-2xl border font-mono ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Spring Boot JPA Entity Mappings</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            High-performance Hibernate JPA entity classes aligned 1-to-1 with PostgreSQL database tables.
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-4">
            <span className="text-purple-400 font-bold block">// User.java Entity Model</span>
            <pre className="overflow-x-auto text-[11px]">
{`@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private UserType userType;

    private boolean isActive = true;
    private boolean emailVerified = false;

    @Version
    private Long version;
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});

SchemaViewerTab.displayName = "SchemaViewerTab";
