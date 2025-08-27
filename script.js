let db;
const request = indexedDB.open("SilverBusinessDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const customerStore = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
    customerStore.createIndex("name", "name", { unique: false });

    const txnStore = db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
    txnStore.createIndex("customerId", "customerId", { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
};

request.onerror = function(event) {
    console.error("DB Error:", event.target.error);
};

// 👉 Add customer
function addCustomer(name, phone) {
    const tx = db.transaction("customers", "readwrite");
    const store = tx.objectStore("customers");
    store.add({ name, phone });
    tx.oncomplete = () => alert("Customer added!");
}

// 👉 Load customers only when 'View Customers' clicked
function loadCustomers() {
    const tx = db.transaction("customers", "readonly");
    const store = tx.objectStore("customers");
    const request = store.getAll();

    request.onsuccess = function() {
        const customers = request.result;
        const list = document.getElementById("customerList");
        list.innerHTML = "";

        if (customers.length === 0) {
            list.innerHTML = "<p>No customers yet.</p>";
            return;
        }

        customers.forEach(c => {
            const div = document.createElement("div");
            div.className = "customer";
            div.innerHTML = `<strong>${c.name}</strong> (${c.phone || 'No Phone'})`;
            list.appendChild(div);
        });
    };
}
