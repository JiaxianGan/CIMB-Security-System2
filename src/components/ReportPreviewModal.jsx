import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { jsPDF } from "jspdf";

export default function ReportPreviewModal({ open, onClose, rtdb }) {
  const [traffic, setTraffic] = useState([]);
  const [usage, setUsage] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!open) return;

    const trafficRef = ref(rtdb, "active_traffic");
    const usageRef = ref(rtdb, "network_usage");
    const alertsRef = ref(rtdb, "alerts");

    const unsub1 = onValue(trafficRef, snap => {
      setTraffic(Object.values(snap.val() || {}));
    });
    const unsub2 = onValue(usageRef, snap => {
      setUsage(Object.values(snap.val() || {}));
    });
    const unsub3 = onValue(alertsRef, snap => {
      setAlerts(Object.values(snap.val() || {}));
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [open, rtdb]);

  if (!open) return null;

  // -------------------------------
  // EXPORT FUNCTIONS
  // -------------------------------
  const handleExportCSV = () => {
    let rows = [
      ["Timestamp", "Inbound", "Outbound", "Threats", "Usage(MB)", "Upload", "Download"]
    ];

    traffic.forEach((t, i) => {
      rows.push([
        t.time,
        t.inbound,
        t.outbound,
        t.threats,
        usage[i]?.totalUsage ?? "",
        usage[i]?.uploadSpeed ?? "",
        usage[i]?.downloadSpeed ?? ""
      ]);
    });

    const csv = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "network_report.csv";
    a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    doc.text("CIMB Network Security Report", 40, 40);

    let y = 70;
    traffic.slice(0, 25).forEach((t, i) => {
      doc.text(
        `${t.time} | Inbound: ${t.inbound} | Outbound: ${t.outbound} | Threats: ${t.threats}`,
        40,
        y
      );
      y += 18;
      if (y > 780) {
        doc.addPage();
        y = 40;
      }
    });

    doc.save("network_report.pdf");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 999999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowY: "auto",
        padding: "3rem 0",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "1300px", // ⬆ increased width
          maxHeight: "90vh", // ⬆ increased height
          background: "#0f172a",
          padding: "2rem",
          borderRadius: "14px",
          color: "white",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", fontWeight: "bold" }}>
          Network Security Report Preview
        </h2>

        {/* SCROLLABLE CONTENT AREA */}
        <div
          style={{
            overflowY: "auto",
            paddingRight: "0.5rem",
            flexGrow: 1, // makes inside content scroll instead of entire modal
          }}
        >
          {/* TRAFFIC */}
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem" }}>Traffic Snapshot</h3>
          <div style={sectionBox}>
            {traffic.slice(0, 20).map((t, idx) => (
              <p key={idx} style={rowStyle}>
                {t.time} | In {t.inbound} | Out {t.outbound} | Threats {t.threats}
              </p>
            ))}
          </div>

          {/* ALERTS */}
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem" }}>Alerts Summary</h3>
          <div style={sectionBox}>
            {alerts.slice(0, 20).map((a, idx) => (
              <p
                key={idx}
                style={{
                  ...rowStyle,
                  color: a.severity === "high" ? "#ef4444" : "white",
                }}
              >
                {a.time} | {a.type} | Severity {a.severity}
              </p>
            ))}
          </div>

          {/* USAGE */}
          <h3 style={{ fontSize: "1.2rem", marginTop: "1rem" }}>Network Usage Trend</h3>
          <div style={sectionBox}>
            {usage.slice(0, 20).map((u, idx) => (
              <p key={idx} style={rowStyle}>
                {u.time} | Usage {u.totalUsage} MB | Up {u.uploadSpeed} Mbps | Down{" "}
                {u.downloadSpeed} Mbps
              </p>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
          <button style={btnBlue} onClick={handleExportCSV}>
            Export CSV
          </button>
          <button style={btnBlue} onClick={handleExportPDF}>
            Export PDF
          </button>
          <button style={btnRed} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------
// STYLES
// -------------------------------
const sectionBox = {
  background: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1.5rem",
  maxHeight: "260px",
  overflowY: "auto",
};

const rowStyle = {
  fontSize: ".9rem",
  marginBottom: ".3rem",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  paddingBottom: ".3rem",
};

const btnBlue = {
  padding: "0.7rem 1.2rem",
  background: "rgba(59,130,246,0.25)",
  borderRadius: "6px",
  cursor: "pointer",
  color: "white",
  fontWeight: "bold",
};

const btnRed = {
  ...btnBlue,
  background: "rgba(239,68,68,0.35)",
};
