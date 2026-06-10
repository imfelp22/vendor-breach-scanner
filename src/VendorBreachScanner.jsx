import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a cybersecurity data breach research analyst. Given a vendor name or domain, research and report on any known data breaches from the last 5 years (2021-2026).

You MUST respond ONLY with a valid JSON object (no markdown, no backticks, no preamble). Use this exact schema:

{
  "vendor_name": "Official Company Name",
  "domain": "company.com",
  "breaches_found": true/false,
  "breach_count": number,
  "breaches": [
    {
      "date": "YYYY-MM or YYYY-MM-DD",
      "disclosure_date": "YYYY-MM or YYYY-MM-DD or null",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "summary": "Brief description of the breach",
      "data_accessed": ["list", "of", "data", "types"],
      "records_affected": "number or estimate string",
      "attack_vector": "How the breach occurred",
      "third_parties_affected": true/false,
      "third_party_details": "Description of third party impact or null",
      "downstream_customer_mentioned": true/false,
      "downstream_customer_details": "Any mention of downstream customers or partners being affected, or null",
      "remediation": "What steps were taken",
      "source": "Where this information is known from"
    }
  ],
  "risk_assessment": "Overall risk summary for third-party customers and partners",
  "recommendation": "Recommended action"
}

Be thorough. Include ALL known breaches in the last 5 years. If no breaches are known, set breaches_found to false and provide an empty breaches array. Always assess whether downstream customers or partners could have been affected by supply chain exposure.`;

// Severity colors and badges
const severityConfig = {
  Critical: { bg: "#2d0a0a", border: "#ff3b3b", text: "#ff6b6b", glow: "0 0 12px rgba(255,59,59,0.3)" },
  High: { bg: "#2d1a0a", border: "#ff8c3b", text: "#ffaa6b", glow: "0 0 12px rgba(255,140,59,0.2)" },
  Medium: { bg: "#2d2a0a", border: "#ffd03b", text: "#ffe06b", glow: "0 0 12px rgba(255,208,59,0.2)" },
  Low: { bg: "#0a2d1a", border: "#3bff8c", text: "#6bffaa", glow: "0 0 12px rgba(59,255,140,0.2)" },
};

const PulsingDot = ({ color }) => (
  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 8, boxShadow: `0 0 6px ${color}`, animation: "pulse 2s infinite" }} />
);

const ScanLine = () => (
  <div style={{ position: "relative", height: 2, background: "rgba(0,255,136,0.1)", borderRadius: 1, overflow: "hidden", margin: "12px 0" }}>
    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "40%", background: "linear-gradient(90deg, transparent, #00ff88, transparent)", animation: "scanMove 1.5s ease-in-out infinite" }} />
  </div>
);

const BreachCard = ({ breach, index }) => {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[breach.severity] || severityConfig.Medium;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: sev.bg,
        border: `1px solid ${sev.border}33`,
        borderLeft: `3px solid ${sev.border}`,
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 12,
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: expanded ? sev.glow : "none",
        animation: `fadeSlideIn 0.4s ease ${index * 0.1}s both`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              background: `${sev.border}22`,
              color: sev.text,
              padding: "2px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: `1px solid ${sev.border}44`,
            }}>
              {breach.severity}
            </span>
            <span style={{ color: "#8a9bb5", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
              {breach.date}
            </span>
            {breach.downstream_customer_mentioned && (
              <span style={{
                background: "#ff3b3b22",
                color: "#ff6b6b",
                padding: "2px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                border: "1px solid #ff3b3b44",
                animation: "pulse 2s infinite",
              }}>
                ⚠ CUSTOMER IMPACT
              </span>
            )}
          </div>
          <p style={{ color: "#d1dae8", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{breach.summary}</p>
        </div>
        <span style={{ color: "#4a5a70", fontSize: 18, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <DetailBlock label="Records Affected" value={breach.records_affected || "Unknown"} />
            <DetailBlock label="Attack Vector" value={breach.attack_vector || "Unknown"} />
            <DetailBlock label="Disclosure Date" value={breach.disclosure_date || "Unknown"} />
            <DetailBlock label="Source" value={breach.source || "Public reports"} />
          </div>

          {breach.data_accessed?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <span style={{ color: "#6b7a90", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Data Accessed</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {breach.data_accessed.map((d, i) => (
                  <span key={i} style={{ background: "rgba(255,255,255,0.05)", color: "#a0b0c8", padding: "3px 10px", borderRadius: 4, fontSize: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {breach.third_parties_affected && (
            <div style={{ marginTop: 14, padding: 12, background: "rgba(255,140,59,0.06)", borderRadius: 6, border: "1px solid rgba(255,140,59,0.15)" }}>
              <span style={{ color: "#ffaa6b", fontSize: 12, fontWeight: 600 }}>Third Party Impact</span>
              <p style={{ color: "#c8b8a0", fontSize: 13, margin: "4px 0 0", lineHeight: 1.5 }}>{breach.third_party_details}</p>
            </div>
          )}

          {breach.downstream_customer_mentioned && breach.downstream_customer_details && (
            <div style={{ marginTop: 14, padding: 12, background: "rgba(255,59,59,0.06)", borderRadius: 6, border: "1px solid rgba(255,59,59,0.2)" }}>
              <span style={{ color: "#ff6b6b", fontSize: 12, fontWeight: 600 }}>⚡ Downstream Customer Exposure</span>
              <p style={{ color: "#c8a0a0", fontSize: 13, margin: "4px 0 0", lineHeight: 1.5 }}>{breach.downstream_customer_details}</p>
            </div>
          )}

          {breach.remediation && (
            <div style={{ marginTop: 14 }}>
              <span style={{ color: "#6b7a90", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Remediation</span>
              <p style={{ color: "#a0b0c8", fontSize: 13, margin: "4px 0 0", lineHeight: 1.5 }}>{breach.remediation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DetailBlock = ({ label, value }) => (
  <div>
    <span style={{ color: "#6b7a90", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
    <p style={{ color: "#c0cee0", fontSize: 13, margin: "3px 0 0" }}>{value}</p>
  </div>
);

const ScanHistory = ({ history, onSelect }) => (
  <div style={{ marginTop: 8 }}>
    {history.length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span style={{ color: "#4a5a70", fontSize: 12, alignSelf: "center", marginRight: 4 }}>Recent:</span>
        {history.map((h, i) => (
          <button
            key={i}
            onClick={() => onSelect(h)}
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#7a8aa0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "3px 10px",
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.target.style.background = "rgba(0,255,136,0.08)"; e.target.style.color = "#00ff88"; e.target.style.borderColor = "rgba(0,255,136,0.2)"; }}
            onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.color = "#7a8aa0"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            {h}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default function VendorBreachScanner() {
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [allScans, setAllScans] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const stages = [
    "Initializing breach database query...",
    "Scanning public disclosure records...",
    "Cross-referencing threat intelligence feeds...",
    "Analyzing third-party exposure chains...",
    "Checking downstream customer supply chain impact...",
    "Compiling findings...",
  ];

  const runScan = async (vendorName) => {
    if (!vendorName.trim()) return;
    setScanning(true);
    setResult(null);
    setError(null);

    let stageIdx = 0;
    setScanStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) setScanStage(stages[stageIdx]);
    }, 2800);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [
            {
              role: "user",
              content: `Research all known data breaches for this vendor in the last 5 years (2021-2026): "${vendorName.trim()}"\n\nBe thorough and check for any connection or impact to downstream customers or partners in the supply chain.`,
            },
          ],
        }),
      });

      clearInterval(stageInterval);
      setScanStage("Parsing results...");

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const textContent = data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      if (!textContent) throw new Error("No response received from analysis.");

      const cleaned = textContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      let parsed;

      // Try to find a JSON object in the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse breach analysis results.");
      }

      setResult(parsed);
      setHistory((prev) => {
        const updated = [vendorName.trim(), ...prev.filter((h) => h.toLowerCase() !== vendorName.trim().toLowerCase())];
        return updated.slice(0, 8);
      });
      setAllScans((prev) => [...prev, { vendor: vendorName.trim(), result: parsed, timestamp: new Date() }]);
    } catch (err) {
      clearInterval(stageInterval);
      setError(err.message);
    } finally {
      setScanning(false);
      setScanStage("");
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    runScan(query);
  };

  const exportReport = () => {
    if (!result) return;
    const lines = [
      `VENDOR DATA BREACH ASSESSMENT REPORT`,
      `Generated: ${new Date().toISOString()}`,
      `${"=".repeat(60)}`,
      ``,
      `Vendor: ${result.vendor_name}`,
      `Domain: ${result.domain}`,
      `Breaches Found: ${result.breach_count || 0}`,
      ``,
      `${"─".repeat(60)}`,
      `RISK ASSESSMENT`,
      `${"─".repeat(60)}`,
      result.risk_assessment,
      ``,
      `RECOMMENDATION`,
      `${"─".repeat(60)}`,
      result.recommendation,
      ``,
    ];

    if (result.breaches?.length) {
      lines.push(`${"═".repeat(60)}`);
      lines.push(`BREACH DETAILS`);
      lines.push(`${"═".repeat(60)}`);
      result.breaches.forEach((b, i) => {
        lines.push(``);
        lines.push(`[${i + 1}] ${b.summary}`);
        lines.push(`    Date: ${b.date} | Severity: ${b.severity}`);
        lines.push(`    Records: ${b.records_affected || "Unknown"}`);
        lines.push(`    Attack Vector: ${b.attack_vector || "Unknown"}`);
        lines.push(`    Data Accessed: ${b.data_accessed?.join(", ") || "Unknown"}`);
        lines.push(`    Third Parties Affected: ${b.third_parties_affected ? "YES" : "No"}`);
        if (b.third_party_details) lines.push(`    Third Party Details: ${b.third_party_details}`);
        lines.push(`    Downstream Customer Impact: ${b.downstream_customer_mentioned ? "YES - " + b.downstream_customer_details : "None identified"}`);
        if (b.remediation) lines.push(`    Remediation: ${b.remediation}`);
        lines.push(`    Source: ${b.source || "Public records"}`);
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `breach-report-${result.vendor_name?.replace(/\s+/g, "-").toLowerCase() || "vendor"}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const breachesWithCustomerImpact = result?.breaches?.filter((b) => b.downstream_customer_mentioned) || [];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#d1dae8", fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scanMove { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gridPulse { 0%, 100% { opacity: 0.03; } 50% { opacity: 0.06; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #3a4a60; }
      `}</style>

      {/* Background grid effect */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        animation: "gridPulse 4s ease infinite",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, animation: "fadeSlideIn 0.5s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg, #00ff88 0%, #00aa55 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: "0 0 20px rgba(0,255,136,0.2)",
            }}>
              🛡
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#e8edf5", letterSpacing: "-0.02em" }}>
                Vendor Breach Scanner
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "#4a5a70", letterSpacing: "0.04em" }}>
                Third-party vendor risk assessment • Supply chain breach intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#3a4a60", fontSize: 14 }}>▸</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleSubmit()}
                placeholder="Enter vendor name or domain (e.g., SolarWinds, Okta, microsoft.com)"
                disabled={scanning}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 32px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,255,136,0.15)",
                  borderRadius: 8,
                  color: "#e8edf5",
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,255,136,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(0,255,136,0.15)"; }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={scanning || !query.trim()}
              style={{
                padding: "12px 24px",
                background: scanning ? "rgba(0,255,136,0.1)" : "linear-gradient(135deg, #00cc6a, #00aa55)",
                color: scanning ? "#00ff88" : "#000",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: scanning ? "wait" : "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.03em",
                transition: "all 0.2s",
                opacity: !query.trim() && !scanning ? 0.4 : 1,
              }}
            >
              {scanning ? "Scanning..." : "Scan Vendor"}
            </button>
          </div>
          <ScanHistory history={history} onSelect={(v) => { setQuery(v); runScan(v); }} />
        </div>

        {/* Scanning State */}
        {scanning && (
          <div style={{
            background: "rgba(0,255,136,0.03)",
            border: "1px solid rgba(0,255,136,0.1)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            animation: "fadeSlideIn 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <PulsingDot color="#00ff88" />
              <span style={{ color: "#00ff88", fontSize: 13, fontWeight: 600 }}>SCANNING IN PROGRESS</span>
            </div>
            <p style={{ color: "#7a9a8a", fontSize: 13, margin: "4px 0 0" }}>{scanStage}</p>
            <ScanLine />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(255,59,59,0.06)",
            border: "1px solid rgba(255,59,59,0.2)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <PulsingDot color="#ff3b3b" />
              <span style={{ color: "#ff6b6b", fontSize: 13, fontWeight: 600 }}>SCAN ERROR</span>
            </div>
            <p style={{ color: "#c8a0a0", fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
            {/* Summary Bar */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}>
              <StatCard label="Vendor" value={result.vendor_name} color="#e8edf5" />
              <StatCard label="Breaches Found" value={result.breach_count || 0} color={result.breach_count > 0 ? "#ff6b6b" : "#00ff88"} />
              <StatCard
                label="Customer Impact"
                value={breachesWithCustomerImpact.length > 0 ? `${breachesWithCustomerImpact.length} FOUND` : "None Found"}
                color={breachesWithCustomerImpact.length > 0 ? "#ff3b3b" : "#00ff88"}
              />
              <div
                onClick={exportReport}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,136,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <span style={{ fontSize: 11, color: "#4a5a70", textTransform: "uppercase", letterSpacing: "0.06em" }}>Export</span>
                <span style={{ fontSize: 14, color: "#00ff88", fontWeight: 600, marginTop: 2 }}>↓ Report</span>
              </div>
            </div>

            {/* Customer Impact Alert */}
            {breachesWithCustomerImpact.length > 0 && (
              <div style={{
                background: "rgba(255,59,59,0.06)",
                border: "1px solid rgba(255,59,59,0.25)",
                borderRadius: 10,
                padding: 18,
                marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <span style={{ color: "#ff6b6b", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em" }}>
                    DOWNSTREAM CUSTOMER EXPOSURE DETECTED
                  </span>
                </div>
                <p style={{ color: "#c8a0a0", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  {breachesWithCustomerImpact.length} breach{breachesWithCustomerImpact.length > 1 ? "es" : ""} with potential downstream customer impact identified. Review details below.
                </p>
              </div>
            )}

            {/* Risk Assessment */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: 18,
              marginBottom: 20,
            }}>
              <span style={{ color: "#6b7a90", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Risk Assessment</span>
              <p style={{ color: "#b0c0d8", fontSize: 14, margin: "8px 0 0", lineHeight: 1.6 }}>{result.risk_assessment}</p>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "#6b7a90", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Recommendation</span>
                <p style={{ color: "#a0d0b8", fontSize: 14, margin: "8px 0 0", lineHeight: 1.6 }}>{result.recommendation}</p>
              </div>
            </div>

            {/* Breach Cards */}
            {result.breaches?.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ color: "#6b7a90", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                    Breach Timeline ({result.breaches.length})
                  </span>
                  <span style={{ color: "#3a4a60", fontSize: 11 }}>Click to expand</span>
                </div>
                {result.breaches
                  .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                  .map((breach, i) => (
                    <BreachCard key={i} breach={breach} index={i} />
                  ))}
              </div>
            )}

            {result.breaches?.length === 0 && (
              <div style={{
                background: "rgba(0,255,136,0.04)",
                border: "1px solid rgba(0,255,136,0.15)",
                borderRadius: 10,
                padding: 24,
                textAlign: "center",
              }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>✓</span>
                <p style={{ color: "#00ff88", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>No Breaches Found</p>
                <p style={{ color: "#5a7a6a", fontSize: 13, margin: 0 }}>No publicly disclosed data breaches found for this vendor in the last 5 years.</p>
              </div>
            )}
          </div>
        )}

        {/* All Scans Summary */}
        {allScans.length > 1 && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "#4a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Session Summary — {allScans.length} vendors scanned
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginTop: 10 }}>
              {allScans.map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${s.result.breach_count > 0 ? "rgba(255,100,100,0.15)" : "rgba(0,255,136,0.1)"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 13, color: "#d1dae8", fontWeight: 500 }}>{s.vendor}</div>
                  <div style={{ fontSize: 12, color: s.result.breach_count > 0 ? "#ff6b6b" : "#00ff88", marginTop: 2 }}>
                    {s.result.breach_count || 0} breach{s.result.breach_count !== 1 ? "es" : ""}
                    {s.result.breaches?.some((b) => b.downstream_customer_mentioned) && " • Customer Impact ⚠"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
          <p style={{ color: "#2a3a50", fontSize: 11, margin: 0 }}>
            Data sourced from public breach disclosures via AI analysis • Results should be verified against official sources • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, color }) => (
  <div style={{
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "14px 16px",
  }}>
    <span style={{ color: "#4a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
    <div style={{ color, fontSize: 16, fontWeight: 700, marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
  </div>
);
