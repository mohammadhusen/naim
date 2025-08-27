let db;
const request = indexedDB.open("SilverBusinessDB", 1);

request.onupgradeneeded = function(e) {
  db = e.target.result;
  const store = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function(e) {
  db = e.target.result;
  console.log("DB Connected");
};

request.onerror = function() {
  console.error("DB error");
};

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
  const tx = db.transaction("customers", "readwrite");
  const store = tx.objectStore("customers");
  store.add({ name, phone, transactions: [] });
  tx.oncomplete = () => loadCustomers();
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
    const invested = c.transactions.filter(t => t.type==="investment").reduce((a,b)=>a+b.amount
