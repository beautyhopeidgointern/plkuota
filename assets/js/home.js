const listEl = document.getElementById("provider-list");

function createCard(provider) {
  const card = document.createElement("div");
  card.className = "game-card";

  card.innerHTML = `
    <div class="game-card-top">
      <div class="game-icon">
        <img src="${provider.image}" />
      </div>
      <h3>${provider.name}</h3>
    </div>
    <p>${provider.desc}</p>
    <span class="open-text">Lihat Paket</span>
  `;

  card.addEventListener("click", () => {
    document.body.classList.add("page-leaving");
    setTimeout(() => {
      window.location.href = `product.html?provider=${provider.key}`;
    }, 180);
  });

  return card;
}

function renderProviders() {
  if (!listEl) return;

  listEl.innerHTML = "";

  window.PROVIDER_LIST.forEach((provider) => {
    listEl.appendChild(createCard(provider));
  });
}

renderProviders();
