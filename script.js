const itemsList = document.getElementById("itemsList");
const itemTemplate = document.getElementById("itemTemplate");

const fields = {
  companyName: document.getElementById("companyName"),
  companyLogo: document.getElementById("companyLogo"),
  invoiceNumber: document.getElementById("invoiceNumber"),
  issueDate: document.getElementById("issueDate"),
  dueDate: document.getElementById("dueDate"),
  taxRate: document.getElementById("taxRate"),
  fromDetails: document.getElementById("fromDetails"),
  billToDetails: document.getElementById("billToDetails"),
  notes: document.getElementById("notes"),
};

const preview = {
  companyName: document.getElementById("previewCompanyName"),
  logoWrap: document.getElementById("previewLogoWrap"),
  logo: document.getElementById("previewLogo"),
  invoiceNumber: document.getElementById("previewInvoiceNumber"),
  issueDate: document.getElementById("previewIssueDate"),
  dueDate: document.getElementById("previewDueDate"),
  fromDetails: document.getElementById("previewFrom"),
  billToDetails: document.getElementById("previewBillTo"),
  notes: document.getElementById("previewNotes"),
  items: document.getElementById("previewItems"),
  subtotal: document.getElementById("subtotalValue"),
  tax: document.getElementById("taxValue"),
  total: document.getElementById("totalValue"),
  taxLabel: document.getElementById("taxLabel"),
};

function setTodayDefaults() {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 7);

  fields.invoiceNumber.value = generateInvoiceNumber();
  if (!fields.issueDate.value) fields.issueDate.value = formatDateInput(today);
  if (!fields.dueDate.value) fields.dueDate.value = formatDateInput(due);
}

function formatDateInput(date) {
  return date.toISOString().split("T")[0];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

function formatDisplayDate(value) {
  if (!value) return "-";
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function generateInvoiceNumber() {
  const datePart = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randomPart}`;
}

function createItem(data = {}) {
  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".item-name").value = data.name || "";
  node.querySelector(".item-qty").value = data.qty ?? 1;
  node.querySelector(".item-rate").value = data.rate ?? 0;

  node.querySelectorAll(".item-input").forEach((input) => {
    input.addEventListener("input", updateInvoice);
  });

  node.querySelector(".remove-item").addEventListener("click", () => {
    node.remove();
    updateInvoice();
  });

  itemsList.appendChild(node);
}

function getItems() {
  return [...itemsList.querySelectorAll(".item-row")].map((row) => {
    const name = row.querySelector(".item-name").value.trim();
    const qty = Number(row.querySelector(".item-qty").value) || 0;
    const rate = Number(row.querySelector(".item-rate").value) || 0;

    return {
      name,
      qty,
      rate,
      amount: qty * rate,
    };
  });
}

function renderItems(items) {
  if (!items.some((item) => item.name || item.qty || item.rate)) {
    preview.items.innerHTML = '<tr class="empty-state"><td colspan="4">Add line items to build the invoice.</td></tr>';
    return;
  }

  preview.items.innerHTML = items
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.name || "Untitled item")}</td>
        <td>${item.qty}</td>
        <td>${formatCurrency(item.rate)}</td>
        <td>${formatCurrency(item.amount)}</td>
      </tr>
    `)
    .join("");
}

const escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => escapeMap[c]);
}

function updateInvoice() {
  const items = getItems();
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = Number(fields.taxRate.value) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  preview.companyName.textContent = fields.companyName.value.trim() || "Your Company";
  preview.invoiceNumber.textContent = fields.invoiceNumber.value.trim() || "INV-0000";
  preview.issueDate.textContent = formatDisplayDate(fields.issueDate.value);
  preview.dueDate.textContent = formatDisplayDate(fields.dueDate.value);
  preview.fromDetails.textContent = fields.fromDetails.value.trim();
  preview.billToDetails.textContent = fields.billToDetails.value.trim();
  preview.notes.textContent = fields.notes.value.trim() || "No additional notes.";
  preview.taxLabel.textContent = `Tax (${taxRate}%)`;

  renderItems(items);

  preview.subtotal.textContent = formatCurrency(subtotal);
  preview.tax.textContent = formatCurrency(tax);
  preview.total.textContent = formatCurrency(total);
}

document.getElementById("addItem").addEventListener("click", () => {
  createItem();
  updateInvoice();
});

document.getElementById("downloadPdf").addEventListener("click", () => {
  const invoiceNumber = fields.invoiceNumber.value.trim() || "invoice";
  const prev = document.title;
  document.title = invoiceNumber;
  window.print();
  document.title = prev;
});

[
  fields.companyName,
  fields.invoiceNumber,
  fields.issueDate,
  fields.dueDate,
  fields.taxRate,
  fields.fromDetails,
  fields.billToDetails,
  fields.notes,
].forEach((field) => {
  field.addEventListener("input", updateInvoice);
});

let logoObjectUrl = null;
fields.companyLogo.addEventListener("change", (event) => {
  const [file] = event.target.files || [];

  if (logoObjectUrl) {
    URL.revokeObjectURL(logoObjectUrl);
    logoObjectUrl = null;
  }

  if (!file) {
    preview.logo.src = "";
    preview.logoWrap.hidden = true;
    return;
  }

  logoObjectUrl = URL.createObjectURL(file);
  preview.logo.src = logoObjectUrl;
  preview.logoWrap.hidden = false;
});

setTodayDefaults();
createItem({ name: "Brand identity design", qty: 1, rate: 450 });
createItem({ name: "Landing page development", qty: 2, rate: 320 });
updateInvoice();
