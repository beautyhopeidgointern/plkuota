function getProviderKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("provider") || "";
}

function loadProviderData(providerKey) {
  return new Promise((resolve, reject) => {
    if (!providerKey) {
      reject(new Error("Provider tidak ditemukan"));
      return;
    }

    window.PRICE_DATA = null;

    const oldScript = document.getElementById("dynamic-provider-data");
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = "dynamic-provider-data";
    script.src = `./data/${encodeURIComponent(providerKey)}.js`;

    script.onload = () => {
      if (window.PRICE_DATA && typeof window.PRICE_DATA === "object") {
        resolve(window.PRICE_DATA);
      } else {
        reject(new Error("Data provider kosong"));
      }
    };

    script.onerror = () => {
      reject(new Error("File data provider tidak ditemukan"));
    };

    document.body.appendChild(script);
  });
}

const titleEl = document.getElementById("game-title");
const subtitleEl = document.getElementById("game-subtitle");
const categoryTabsEl = document.getElementById("category-tabs");
const listEl = document.getElementById("price-list");
const fieldsEl = document.getElementById("dynamic-fields");
const selectedProductEl = document.getElementById("selected-product");
const selectedPriceEl = document.getElementById("selected-price");
const descriptionEl = document.getElementById("product-description");
const contactBtn = document.getElementById("contact-btn");
const orderSection = document.getElementById("order-section");
const previewEl = document.getElementById("preview-order");
const backHomeLink = document.getElementById("back-home-link");

let providerData = null;
let activeCategoryIndex = 0;

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
  }

  input.addEventListener("input", updateWhatsappLink);
  input.addEventListener("change", updateWhatsappLink);

  wrapper.appendChild(label);
  wrapper.appendChild(input);

  return wrapper;
}

function renderFields() {
  if (!fieldsEl || !providerData) return;

  fieldsEl.innerHTML = "";
  (providerData.formFields || []).forEach((field, index) => {
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
    if (descriptionEl) descriptionEl.value = item.description || "-";

    document.querySelectorAll(".price-item").forEach((el) => {
      el.classList.remove("selected");
    });
    card.classList.add("selected");

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

function renderCategoryTabs() {
  if (!categoryTabsEl || !providerData) return;

  const categories = Array.isArray(providerData.categories) ? providerData.categories : [];
  categoryTabsEl.innerHTML = "";

  if (categories.length <= 1) {
    categoryTabsEl.style.display = "none";
    return;
  }

  categoryTabsEl.style.display = "flex";

  categories.forEach((category, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-tab${index === activeCategoryIndex ? " active" : ""}`;
    button.textContent = category.title || `Kategori ${index + 1}`;

    button.addEventListener("click", () => {
      activeCategoryIndex = index;
      renderCategoryTabs();
      renderPriceList();
    });

    categoryTabsEl.appendChild(button);
  });
}

function renderPriceList() {
  if (!listEl || !providerData) return;

  listEl.innerHTML = "";

  if (Array.isArray(providerData.categories) && providerData.categories.length) {
    const currentCategory = providerData.categories[activeCategoryIndex] || providerData.categories[0];

    const grid = document.createElement("div");
    grid.className = "price-category-grid";

    (currentCategory.items || []).forEach((item) => {
      grid.appendChild(createPriceCard(item));
    });

    listEl.appendChild(grid);
    return;
  }

  if (Array.isArray(providerData.items) && providerData.items.length) {
    const grid = document.createElement("div");
    grid.className = "price-category-grid";

    providerData.items.forEach((item) => {
      grid.appendChild(createPriceCard(item));
    });

    listEl.appendChild(grid);
    return;
  }

  listEl.innerHTML = `<div class="empty-state">Belum ada daftar produk untuk provider ini.</div>`;
}

function buildOrderText() {
  const inputs = fieldsEl ? fieldsEl.querySelectorAll("input, select") : [];
  const lines = [];

  lines.push(`Pesanan ${providerData.title}`);
  lines.push("");

  inputs.forEach((input) => {
    lines.push(`${input.dataset.label}: ${input.value.trim() || "-"}`);
  });

  lines.push(`Produk: ${selectedProductEl?.value || "-"}`);
  lines.push(`Harga: ${selectedPriceEl?.value || "-"}`);
  lines.push(`Deskripsi: ${descriptionEl?.value || "-"}`);

  return lines.join("\n");
}

function updateWhatsappLink() {
  if (!providerData || !contactBtn) return;

  const text = buildOrderText();

  if (previewEl) {
    previewEl.value = text;
  }

  const encoded = encodeURIComponent(text);
  contactBtn.href = `https://wa.me/${providerData.contact}?text=${encoded}`;
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

async function initProductPage() {
  const providerKey = getProviderKey();

  try {
    providerData = await loadProviderData(providerKey);
    activeCategoryIndex = 0;

    if (titleEl) titleEl.textContent = providerData.title;
    if (subtitleEl) subtitleEl.textContent = providerData.subtitle;

    renderFields();
    renderCategoryTabs();
    renderPriceList();

    if (selectedProductEl) selectedProductEl.value = "";
    if (selectedPriceEl) selectedPriceEl.value = "";
    if (descriptionEl) descriptionEl.value = "";
    if (previewEl) previewEl.value = "";

    updateWhatsappLink();
  } catch (error) {
    if (titleEl) titleEl.textContent = "Provider tidak ditemukan";
    if (subtitleEl) subtitleEl.textContent = "Data provider belum tersedia atau nama file salah.";

    if (categoryTabsEl) categoryTabsEl.innerHTML = "";
    if (listEl) {
      listEl.innerHTML = `<div class="empty-state">Data provider ini belum ada.</div>`;
    }

    if (fieldsEl) fieldsEl.innerHTML = "";
    if (selectedProductEl) selectedProductEl.value = "";
    if (selectedPriceEl) selectedPriceEl.value = "";
    if (descriptionEl) descriptionEl.value = "";
    if (previewEl) previewEl.value = "";

    if (contactBtn) {
      contactBtn.removeAttribute("href");
    }
  }
}

initProductPage();
