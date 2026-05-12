import React, { useState, useEffect } from "react";
import { ControllerStatus } from "../ControllerStatus";
import "./DeveloperPanel.css";

const DeveloperPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [availableControllers, setAvailableControllers] = useState([]);
  const [rawInputData, setRawInputData] = useState([]);
  const [maxRawInputs, setMaxRawInputs] = useState(50);

  useEffect(() => {
    if (!isOpen) return;

    let debugInterval;

    const updateDebugInfo = async () => {
      try {
        const debug = await window.electron.getControllerDebugInfo();
        setDebugInfo(debug);

        const controllers = await window.electron.searchControllers();
        setAvailableControllers(controllers);
      } catch (error) {
        console.error("Failed to get debug info:", error);
      }
    };

    // Listen for raw input data (we'll need to add this to the backend)
    const handleRawInput = (event, inputData) => {
      setRawInputData(prev => {
        const newData = [...prev, {
          timestamp: Date.now(),
          ...inputData
        }].slice(-maxRawInputs);
        return newData;
      });
    };

    window.electron.on("controller-raw-input", handleRawInput);

    updateDebugInfo();
    debugInterval = setInterval(updateDebugInfo, 1000);

    return () => {
      if (debugInterval) clearInterval(debugInterval);
      window.electron.removeListener("controller-raw-input", handleRawInput);
    };
  }, [isOpen, maxRawInputs]);

  const clearRawInputs = () => {
    setRawInputData([]);
  };

  const exportDebugData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      debugInfo,
      availableControllers,
      rawInputData: rawInputData.slice(-100) // Last 100 inputs
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controller-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="developer-panel">
      <button
        className="dev-panel-toggle"
        onClick={togglePanel}
        title="Toggle Developer Panel"
      >
        {isOpen ? "Hide" : "Show"} Dev Panel
      </button>

      {isOpen && (
        <div className="dev-panel-content">
          <div className="dev-panel-header">
            <h3>Controller Developer Panel</h3>
            <button onClick={exportDebugData} className="export-btn">
              Export Debug Data
            </button>
          </div>

          <div className="dev-panel-sections">
            <section className="dev-section">
              <h4>Connection Status</h4>
              <ControllerStatus showDebugInfo={true} />
            </section>

            <section className="dev-section">
              <h4>Available Controllers ({availableControllers.length})</h4>
              <div className="controllers-list">
                {availableControllers.map((controller, index) => (
                  <div key={index} className="controller-info">
                    <div className="controller-name">
                      {controller.product || controller.manufacturer || "Unknown"}
                    </div>
                    <div className="controller-details">
                      <span>VID: {controller.vendorId}</span>
                      <span>PID: {controller.productId}</span>
                      <span>Path: {controller.path.slice(0, 30)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dev-section">
              <h4>Raw Input Data</h4>
              <div className="raw-input-controls">
                <label>
                  Max entries:
                  <input
                    type="number"
                    value={maxRawInputs}
                    onChange={(e) => setMaxRawInputs(parseInt(e.target.value) || 50)}
                    min="10"
                    max="200"
                  />
                </label>
                <button onClick={clearRawInputs}>Clear</button>
              </div>
              <div className="raw-input-data">
                {rawInputData.length === 0 ? (
                  <div className="no-data">No input data captured yet</div>
                ) : (
                  rawInputData.slice().reverse().map((input, index) => (
                    <div key={index} className="input-entry">
                      <span className="input-time">
                        {formatTimestamp(input.timestamp)}
                      </span>
                      <span className="input-data">
                        {JSON.stringify(input, null, 1)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {debugInfo && (
              <section className="dev-section">
                <h4>System Information</h4>
                <div className="system-info">
                  <div className="info-item">
                    <strong>Connection Status:</strong> {debugInfo.connectionStatus}
                  </div>
                  <div className="info-item">
                    <strong>Controller Type:</strong> {debugInfo.controllerType || "none"}
                  </div>
                  <div className="info-item">
                    <strong>Reconnect Attempts:</strong> {debugInfo.reconnectAttempts}
                  </div>
                  <div className="info-item">
                    <strong>Device Watcher:</strong> {debugInfo.isDeviceWatcherActive ? "Active" : "Inactive"}
                  </div>
                  {debugInfo.performanceStats && (
                    <div className="perf-stats">
                      <strong>Performance:</strong>
                      <ul>
                        <li>Input Count: {debugInfo.performanceStats.inputCount}</li>
                        <li>Avg Latency: {Math.round(debugInfo.performanceStats.averageLatency)}ms</li>
                        <li>Uptime: {Math.round(debugInfo.performanceStats.connectionUptime / 1000)}s</li>
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperPanel;