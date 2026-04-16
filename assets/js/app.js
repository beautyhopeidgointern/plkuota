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
    if (oldScript) {
      oldScript.remove();
    }

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
