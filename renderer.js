document.addEventListener("DOMContentLoaded", async () => {
  const quickchatContainer = document.getElementById("quickchat-container");
  const saveButton = document.getElementById("save-button");
  let quickchats = await window.electron.loadQuickchats();

  const renderQuickchats = () => {
    quickchatContainer.innerHTML = "";
    Object.keys(quickchats).forEach((key) => {
      const quickchatDiv = document.createElement("div");
      quickchatDiv.className = "quickchat";
      const label = document.createElement("span");
      label.textContent = key;
      const input = document.createElement("input");
      input.value = quickchats[key];
      input.addEventListener("input", (e) => {
        quickchats[key] = e.target.value;
      });
      quickchatDiv.appendChild(label);
      quickchatDiv.appendChild(input);
      quickchatContainer.appendChild(quickchatDiv);
    });
  };

  renderQuickchats();

  saveButton.addEventListener("click", () => {
    window.electron.saveQuickchats(quickchats);
  });
});
