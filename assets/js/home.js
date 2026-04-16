const listEl = document.getElementById("provider-list");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function goToProvider(key) {
  document.body.classList.add("page-leaving");

  setTimeout(() => {
    window.location.href = `./product.html?provider=${encodeURIComponent(key)}`;
  }, 180);
}

function createCard(provider) {
  const card = document.createElement("div");
  card.className = "game-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const safeName = escapeHtml(provider.name || "Provider");
  const safeDesc = escapeHtml(provider.desc || "Lihat daftar paket.");
  const safeImage = escapeHtml(provider.image || "");

  const imageContent = safeImage
    ? `<img src="${safeImage}" alt="${safeName}" loading="lazy" draggable="false" />`
    : `<span>${safeName.charAt(0)}</span>`;

  card.innerHTML = `
    <div class="game-card-top">
      <div class="game-icon">${imageContent}</div>
      <h3>${safeName}</h3>
    </div>
    <p>${safeDesc}</p>
    <span class="open-text">Lihat Paket</span>
  `;

  card.addEventListener("click", () => {
    goToProvider(provider.key);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToProvider(provider.key);
    }
  });

  return card;
}

function renderProviders() {
  if (!listEl) return;

  const providers = Array.isArray(window.PROVIDER_LIST) ? window.PROVIDER_LIST : [];

  if (!providers.length) {
    listEl.innerHTML = `<div class="empty-state">Belum ada provider yang ditambahkan.</div>`;
    return;
  }

  listEl.innerHTML = "";

  providers.forEach((provider) => {
    listEl.appendChild(createCard(provider));
  });
}

renderProviders();
