let db;
const request = indexedDB.open("SilverBusinessDB", 1);

request.onupgradeneeded = function(e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains("customers")) {
    const store = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = function(e) {
  db = e.target.result;
  console.log("DB Connected");
};

request.onerror = function() {
  console.error("DB error");
};

// Button bindings
document.getElementById("addCustomerBtn").onclick = showAddCustomerForm;
document.getElementById("viewCustomersBtn").onclick = loadCustomers;

function showAddCustomerForm() {
  document.getElementById("formSection").innerHTML = `
    <h2>Add Customer</h2>
    <input id="cname" placeholder="Name"><br>
    <input id="cphone" placeholder="Phone"><br>
    <button onclick="addCustomer()">Save</button>
  `;
}

function addCustomer() {
  const name = document.getElementById("cname").value;
  const phone = document.getElementById("cphone").value;

  if (!name || !phone) {
    alert("Please enter name & phone");
    return;
  }

  const tx = db.transaction("customers", "readwrite");
  const store = tx.objectStore("customers");
  store.add({ name, phone, transactions: [] });

  tx.oncomplete = () => {
    loadCustomers();
    document.getElementById("formSection").innerHTML = "";
  };
}

function loadCustomers() {
  const tx = db.transaction("customers", "readonly");
  const store = tx.objectStore("customers");
  const req = store.getAll();

  req.onsuccess = () => {
    const list = req.result.map(c => `
      <div class="card">
        <h3>${c.name} (${c.phone})</h3>
        <button onclick="viewCustomer(${c.id})">View</button>
      </div>
    `).join("");
    document.getElementById("listSection").innerHTML = list || "<p>No customers yet</p>";
  };
}

function viewCustomer(id) {
  const tx = db.transaction("customers", "readonly");
  const store = tx.objectStore("customers");
  const req = store.get(id);

  req.onsuccess = () => {
    const c = req.result;

    const invested = c.transactions.filter(t => t.type === "investment").reduce((a, b) => a + b.amount, 0);
    const profit = c.transactions.filter(t => t.type === "profit").reduce((a, b) => a + b.amount, 0);
    const balance = invested - profit;

    document.getElementById("formSection").innerHTML = `
      <h2>${c.name} (${c.phone})</h2>
      <p><b>Total Invested:</b> ${invested}</p>
      <p><b>Total Profit Paid:</b> ${profit}</p>
      <p><b>Net Balance:</b> ${balance}</p>

      <h3>Add Transaction</h3>
      <select id="ttype">
        <option value="investment">Investment</option>
        <option value="profit">Profit</option>
      </select>
      <input id="tamt" type="number" placeholder="Amount"><br>
      <button onclick="addTransaction(${c.id})">Add</button>
      <button onclick="downloadReport(${c.id})">Download Report (PDF)</button>

      <h3>Transactions</h3>
      <ul>
        ${c.transactions.map(t => `<li>${t.date} - ${t.type}: ${t.amount}</li>`).join("")}
      </ul>
    `;
  };
}

function addTransaction(id) {
  const type = document.getElementById("ttype").value;
  const amt = parseFloat(document.getElementById("tamt").value);

  if (!amt) {
    alert("Enter valid amount");
    return;
  }

  const tx = db.transaction("customers", "readwrite");
  const store = tx.objectStore("customers");
  const req = store.get(id);

  req.onsuccess = () => {
    const c = req.result;
    c.transactions.push({ type, amount: amt, date: new Date().toLocaleDateString() });
    store.put(c);

    tx.oncomplete = () => viewCustomer(id);
  };
}

// PDF Export
function downloadReport(id) {
  const tx = db.transaction("customers", "readonly");
  const store = tx.objectStore("customers");
  const req = store.get(id);

  req.onsuccess = () => {
    const c = req.result;

    const invested = c.transactions.filter(t => t.type === "investment").reduce((a, b) => a + b.amount, 0);
    const profit = c.transactions.filter(t => t.type === "profit").reduce((a, b) => a + b.amount, 0);
    const balance = invested - profit;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Customer Report - ${c.name}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Phone: ${c.phone}`, 20, 30);
    doc.text(`Total Invested: ${invested}`, 20, 40);
    doc.text(`Total Profit Paid: ${profit}`, 20, 50);
    doc.text(`Net Balance: ${balance}`, 20, 60);

    doc.text("Transactions:", 20, 75);
    let y = 85;
    c.transactions.forEach(t => {
      doc.text(`${t.date} - ${t.type}: ${t.amount}`, 25, y);
      y += 10;
    });

    doc.save(`${c.name}_report.pdf`);
  };
}
