function getGameKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("game") || "";
}

function loadGameData(gameKey) {
  return new Promise((resolve, reject) => {
    if (!gameKey) {
      reject(new Error("Game tidak ditemukan"));
      return;
    }

    window.PRICE_DATA = null;

    const oldScript = document.getElementById("dynamic-game-data");
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = "dynamic-game-data";
    script.src = `./data/${encodeURIComponent(gameKey)}.js`;

    script.onload = () => {
      if (window.PRICE_DATA && typeof window.PRICE_DATA === "object") {
        resolve(window.PRICE_DATA);
      } else {
        reject(new Error("Data game kosong"));
      }
    };

    script.onerror = () => reject(new Error("File data game tidak ditemukan"));

    document.body.appendChild(script);
  });
}

const titleEl = document.getElementById("game-title");
const subtitleEl = document.getElementById("game-subtitle");
const listEl = document.getElementById("price-list");
const fieldsEl = document.getElementById("dynamic-fields");
const selectedProductEl = document.getElementById("selected-product");
const selectedPriceEl = document.getElementById("selected-price");
const totalPriceEl = document.getElementById("total-price");
const quantityEl = document.getElementById("quantity");
const qtyMinusBtn = document.getElementById("qty-minus");
const qtyPlusBtn = document.getElementById("qty-plus");
const contactBtn = document.getElementById("contact-btn");
const orderNowBtn = document.getElementById("order-now-btn");
const orderModal = document.getElementById("order-modal");
const modalClose = document.getElementById("modal-close");
const copyBtn = document.getElementById("copy-order-btn");
const orderSection = document.getElementById("order-section");
const previewEl = document.getElementById("preview-order");
const backHomeLink = document.getElementById("back-home-link");
const backTop = document.getElementById("back-top");

let gameData = null;

function parseRupiah(value) {
  if (!value) return 0;
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function formatRupiah(value) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function getQuantity() {
  const qty = Number(quantityEl?.value) || 1;
  return qty < 1 ? 1 : qty;
}

function getSelectedPriceNumber() {
  return parseRupiah(selectedPriceEl?.value);
}

function getTotalPriceNumber() {
  return getSelectedPriceNumber() * getQuantity();
}

function updateTotalPrice() {
  if (!totalPriceEl) return;
  const total = getTotalPriceNumber();
  totalPriceEl.value = total > 0 ? formatRupiah(total) : "-";
}

function normalizeField(field) {
  if (typeof field === "string") {
    return {
      type: "text",
      label: field,
      placeholder: `Masukkan ${field}`
    };
  }

  return {
    type: field.type || "text",
    label: field.label || "Field",
    placeholder: field.placeholder || `Masukkan ${field.label || "Field"}`,
    options: Array.isArray(field.options) ? field.options : []
  };
}

function createField(field, index) {
  const config = normalizeField(field);

  const wrapper = document.createElement("div");
  wrapper.className = "form-group";

  const label = document.createElement("label");
  label.setAttribute("for", `field-${index}`);
  label.textContent = config.label;

  let input;

  if (config.type === "select") {
    input = document.createElement("select");
    input.id = `field-${index}`;
    input.dataset.label = config.label;
    input.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = `Pilih ${config.label}`;
    input.appendChild(defaultOption);

    config.options.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      input.appendChild(option);
    });
  } else {
    input = document.createElement("input");
    input.type = "text";
    input.id = `field-${index}`;
    input.dataset.label = config.label;
    input.placeholder = config.placeholder;
    input.autocomplete = "off";
    input.required = true;
  }

  input.addEventListener("input", () => {
    input.classList.remove("field-error");
    updateWhatsappLink();
  });

  input.addEventListener("change", () => {
    input.classList.remove("field-error");
    updateWhatsappLink();
  });

  wrapper.appendChild(label);
  wrapper.appendChild(input);

  return wrapper;
}

function renderFields() {
  if (!fieldsEl || !gameData) return;

  fieldsEl.innerHTML = "";
  (gameData.formFields || []).forEach((field, index) => {
    fieldsEl.appendChild(createField(field, index));
  });
}

function createPriceCard(item) {
  const card = document.createElement("div");
  card.className = "price-item";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const title = document.createElement("h3");
  title.textContent = item.name;

  const price = document.createElement("p");
  price.className = "price";
  price.textContent = item.price;

  const selectItem = () => {
    if (selectedProductEl) selectedProductEl.value = item.name;
    if (selectedPriceEl) selectedPriceEl.value = item.price;
    if (quantityEl) quantityEl.value = 1;

    document.querySelectorAll(".price-item").forEach((el) => {
      el.classList.remove("selected");
    });

    card.classList.add("selected");

    updateTotalPrice();
    updateWhatsappLink();

    if (orderSection) {
      orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  card.addEventListener("click", selectItem);

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectItem();
    }
  });

  card.appendChild(title);
  card.appendChild(price);

  return card;
}

function renderPriceList() {
  if (!listEl || !gameData) return;

  listEl.innerHTML = "";

  if (Array.isArray(gameData.categories) && gameData.categories.length) {
    gameData.categories.forEach((category) => {
      const section = document.createElement("div");
      section.className = "price-category";

      const heading = document.createElement("h3");
      heading.className = "price-category-title";
      heading.textContent = category.title || "Kategori";

      const grid = document.createElement("div");
      grid.className = "price-category-grid";

      (category.items || []).forEach((item) => {
        grid.appendChild(createPriceCard(item));
      });

      section.appendChild(heading);
      section.appendChild(grid);
      listEl.appendChild(section);
    });
    return;
  }

  if (Array.isArray(gameData.items) && gameData.items.length) {
    const grid = document.createElement("div");
    grid.className = "price-grid";

    gameData.items.forEach((item) => {
      grid.appendChild(createPriceCard(item));
    });

    listEl.appendChild(grid);
    return;
  }

  listEl.innerHTML = `<div class="empty-state">Belum ada daftar harga untuk game ini.</div>`;
}

function buildOrderText() {
  const inputs = fieldsEl ? fieldsEl.querySelectorAll("input, select") : [];
  const lines = [];

  lines.push(`Pesanan ${gameData.title}`);
  lines.push("");

  inputs.forEach((input) => {
    lines.push(`${input.dataset.label}: ${input.value.trim() || "-"}`);
  });

  lines.push(`Produk: ${selectedProductEl?.value || "-"}`);
  lines.push(`Harga Satuan: ${selectedPriceEl?.value || "-"}`);
  lines.push(`Kuantitas: ${getQuantity()}`);
  lines.push(`Total Harga: ${totalPriceEl?.value || "-"}`);

  return lines.join("\n");
}

function validateOrderForm() {
  const inputs = fieldsEl ? fieldsEl.querySelectorAll("input, select") : [];
  let firstEmptyField = null;

  inputs.forEach((input) => {
    const value = String(input.value || "").trim();

    if (!value) {
      input.classList.add("field-error");

      if (!firstEmptyField) {
        firstEmptyField = input;
      }
    } else {
      input.classList.remove("field-error");
    }
  });

  if (!selectedProductEl?.value) {
    alert("Pilih produk terlebih dahulu.");
    return false;
  }

  if (firstEmptyField) {
    alert("Kolom wajib diisi. Lengkapi semua data pesanan terlebih dahulu.");
    firstEmptyField.focus();
    return false;
  }

  return true;
}

function updateWhatsappLink() {
  if (!gameData || !contactBtn) return;

  updateTotalPrice();

  const text = buildOrderText();

  if (previewEl) {
    previewEl.value = text;
  }

  const encoded = encodeURIComponent(text);
  contactBtn.href = `https://wa.me/${gameData.contact}?text=${encoded}`;
}

function openOrderModal() {
  updateWhatsappLink();

  if (!validateOrderForm()) {
    return;
  }

  if (orderModal) {
    orderModal.classList.add("active");
  }
}

function closeOrderModal() {
  if (orderModal) {
    orderModal.classList.remove("active");
  }
}

if (orderNowBtn) {
  orderNowBtn.addEventListener("click", openOrderModal);
}

if (modalClose) {
  modalClose.addEventListener("click", closeOrderModal);
}

if (orderModal) {
  orderModal.addEventListener("click", (event) => {
    if (event.target === orderModal) {
      closeOrderModal();
    }
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const text = previewEl?.value || buildOrderText();

    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1200);
    } catch (error) {
      if (previewEl) {
        previewEl.select();
        document.execCommand("copy");
      }

      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1200);
    }
  });
}

if (qtyMinusBtn) {
  qtyMinusBtn.addEventListener("click", () => {
    const current = getQuantity();
    if (quantityEl) quantityEl.value = current > 1 ? current - 1 : 1;
    updateWhatsappLink();
  });
}

if (qtyPlusBtn) {
  qtyPlusBtn.addEventListener("click", () => {
    const current = getQuantity();
    if (quantityEl) quantityEl.value = current + 1;
    updateWhatsappLink();
  });
}

if (quantityEl) {
  quantityEl.addEventListener("input", () => {
    if (Number(quantityEl.value) < 1 || !quantityEl.value) {
      quantityEl.value = 1;
    }
    updateWhatsappLink();
  });
}

if (backHomeLink) {
  backHomeLink.addEventListener("click", (event) => {
    event.preventDefault();
    document.body.classList.add("page-leaving");

    setTimeout(() => {
      window.location.href = backHomeLink.href;
    }, 180);
  });
}

if (backTop) {
  backTop.addEventListener("click", (event) => {
    event.preventDefault();
    document.body.classList.add("page-leaving");

    setTimeout(() => {
      window.location.href = backTop.href;
    }, 180);
  });
}

async function initGamePage() {
  const gameKey = getGameKey();

  try {
    gameData = await loadGameData(gameKey);

    if (titleEl) titleEl.textContent = gameData.title;
    if (subtitleEl) subtitleEl.textContent = gameData.subtitle;

    renderFields();
    renderPriceList();

    if (selectedProductEl) selectedProductEl.value = "";
    if (selectedPriceEl) selectedPriceEl.value = "";
    if (quantityEl) quantityEl.value = 1;
    if (totalPriceEl) totalPriceEl.value = "-";

    updateWhatsappLink();
  } catch (error) {
    if (titleEl) titleEl.textContent = "Game tidak ditemukan";
    if (subtitleEl) subtitleEl.textContent = "Data game belum tersedia atau nama file salah.";

    if (listEl) {
      listEl.innerHTML = `<div class="empty-state">Data price list untuk game ini belum ada.</div>`;
    }

    if (fieldsEl) fieldsEl.innerHTML = "";
    if (selectedProductEl) selectedProductEl.value = "";
    if (selectedPriceEl) selectedPriceEl.value = "";
    if (quantityEl) quantityEl.value = 1;
    if (totalPriceEl) totalPriceEl.value = "";
    if (previewEl) previewEl.value = "";

    if (contactBtn) {
      contactBtn.removeAttribute("href");
    }
  }
}

initGamePage();
