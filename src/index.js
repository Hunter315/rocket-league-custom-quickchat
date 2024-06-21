import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import dpadUp from "./assets/icons/dpad-up.svg";
import dpadRight from "./assets/icons/dpad-right.svg";
import dpadDown from "./assets/icons/dpad-down.svg";
import dpadLeft from "./assets/icons/dpad-left.svg";

const App = () => {
  const [quickchats, setQuickchats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electron
      .loadQuickchats()
      .then(setQuickchats)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setQuickchats((prevQuickchats) => ({
      ...prevQuickchats,
      [key]: value,
    }));
  };

  const handleSave = () => {
    window.electron.saveQuickchats(quickchats);
    alert("Quickchats saved successfully!");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const columns = {
    0: { icon: dpadUp, chats: [] },
    2: { icon: dpadRight, chats: [] },
    4: { icon: dpadDown, chats: [] },
    6: { icon: dpadLeft, chats: [] },
  };

  Object.keys(quickchats).forEach((key) => {
    const colKey = key.split(",")[0];
    const colKey2 = key.split(",")[1];
    if (columns[colKey]) {
      columns[colKey].chats.push(
        <div key={key} className="quickchat">
          <label>
            {" "}
            <img
              src={columns[colKey2].icon}
              alt={`D-pad ${colKey2}`}
              className="dpad-icon-small"
            />
          </label>
          <input
            type="text"
            value={quickchats[key]}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      );
    }
  });

  return (
    <div className="container">
      <h1>Quickchat Manager</h1>
      <div className="quickchat-columns">
        {Object.keys(columns).map((colKey) => (
          <div key={colKey} className="quickchat-column">
            <img
              src={columns[colKey].icon}
              alt={`D-pad ${colKey}`}
              className="dpad-icon"
            />

            <h2>Group {colKey / 2 + 1}</h2>
            <div className="column">{columns[colKey].chats}</div>
          </div>
        ))}
      </div>
      <button id="save-button" onClick={handleSave}>
        Save
      </button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
