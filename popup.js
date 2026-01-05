function format(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

function render() {
  const list = document.getElementById("list");

  chrome.runtime.sendMessage("GET_DATA", (rows) => {
    if (!Array.isArray(rows)) return;

    rows.sort((a, b) => b.ms - a.ms);
    list.innerHTML = "";

    if (!rows.length) {
      list.innerHTML = "<li>No usage yet</li>";
      return;
    }

    rows.forEach(({ domain, ms }) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${domain}</span><span>${format(ms)}</span>`;
      list.appendChild(li);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  setInterval(render, 1000);
});
