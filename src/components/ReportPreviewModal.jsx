import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { jsPDF } from "jspdf";

export default function ReportPreviewModal({ open, onClose, rtdb }) {
  const [traffic, setTraffic] = useState([]);
  const [usage, setUsage] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
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
  }, []);

  if (!open) return null;

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
    const doc = new jsPDF();
    doc.text("CIMB Network Security Report", 15, 15);

    let y = 30;
    traffic.slice(0, 20).forEach((t, i) => {
      doc.text(`• ${t.time} | Inbound: ${t.inbound} | Outbound: ${t.outbound} | Threats: ${t.threats}`, 15, y);
      y += 8;
    });

    doc.save("network_report.pdf");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.65)",
      zIndex: 9999,
      overflowY: "auto",
      paddingTop: "3rem"
    }}>
      <div style={{
        width: "80%",
        margin: "auto",
        background: "#0f172a",
        padding: "2rem",
        borderRadius: "12px",
        color: "white"
      }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Network Security Report Preview
        </h2>

        <h3 style={{ fontSize: "1rem", opacity: .7 }}>Traffic Snapshot</h3>
        <div style={{
          background: "rgba(255,255,255,.05)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem"
        }}>
          {traffic.slice(0, 10).map((t, idx) => (
            <p key={idx} style={{ fontSize: ".8rem", marginBottom: ".2rem" }}>
              {t.time} | Inbound {t.inbound} | Outbound {t.outbound} | Threats {t.threats}
            </p>
          ))}
        </div>

        <h3 style={{ fontSize: "1rem", opacity: .7 }}>Alerts Summary</h3>
        <div style={{
          background: "rgba(255,255,255,.05)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem"
        }}>
          {alerts.slice(0, 8).map((a, idx) => (
            <p key={idx} style={{
              fontSize: ".8rem",
              color: a.severity === "high" ? "#ef4444" : "white",
              marginBottom: ".2rem"
            }}>
              {a.time} | {a.type} | Severity {a.severity}
            </p>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={handleExportCSV} style={btnStyle}>Export CSV</button>
          <button onClick={handleExportPDF} style={btnStyle}>Export PDF</button>
          <button onClick={onClose} style={btnStyleRed}>Close</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: ".6rem 1rem",
  background: "rgba(59,130,246,.2)",
  borderRadius: "6px",
  cursor: "pointer",
  color: "white"
};

const btnStyleRed = {
  ...btnStyle,
  background: "rgba(239,68,68,.25)"
};
