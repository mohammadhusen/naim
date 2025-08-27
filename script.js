let db;

// Open Database
let request = indexedDB.open("SilverBusinessDB", 1);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    let customerStore = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
    customerStore.createIndex("name", "name", { unique: false });

    db.createObjectStore("payments", { keyPath: "id", autoIncrement: true })
      .createIndex("customerId", "customerId", { unique: false });
};

request.onsuccess = function(e) {
    db = e.target.result;
    loadCustomers();
};

request.onerror = function() {
    alert("Database error!");
};

// Save New Customer
function saveCustomer() {
    let name = document.getElementById("customerName").value;
    let investment = parseFloat(document.getElementById("customerInvestment").value);

    if (!name || !investment) {
        alert("Please enter name and investment");
        return;
    }

    let tx = db.transaction("customers", "readwrite");
    let store = tx.objectStore("customers");
    let customer = { name, investment, created: new Date().toISOString() };
    store.add(customer);

    tx.oncomplete = () => {
        alert("Customer added!");
        document.getElementById("customerName").value = "";
        document.getElementById("customerInvestment").value = "";
        document.getElementById("addCustomerPage").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        loadCustomers();
    };
}

// Load Customers to Dashboard
function loadCustomers() {
    if (!db) return;

    let tx = db.transaction("customers", "readonly");
    let store = tx.objectStore("customers");
    let request = store.getAll();

    request.onsuccess = function() {
        let list = document.getElementById("customerList");
        list.innerHTML = "";

        if (request.result.length === 0) {
            list.innerHTML = "<p>No customers yet</p>";
            return;
        }

        request.result.forEach(cust => {
            let div = document.createElement("div");
            div.className = "p-2 border rounded mb-2 bg-white";
            div.innerHTML = `
                <strong>${cust.name}</strong>  
                <br> Investment: ₹${cust.investment}
                <br>
                <button onclick="viewCustomer(${cust.id})" class="bg-blue-500 text-white px-2 py-1 rounded mt-1">View</button>
            `;
            list.appendChild(div);
        });
    };
}

// View Customer Details
function viewCustomer(id) {
    let tx = db.transaction("customers", "readonly");
    let store = tx.objectStore("customers");
    let request = store.get(id);

    request.onsuccess = function() {
        let cust = request.result;
        document.getElementById("dashboard").style.display = "none";
        document.getElementById("customerPage").style.display = "block";

        document.getElementById("custDetails").innerHTML = `
            <h3 class="text-xl font-bold">${cust.name}</h3>
            <p>Investment: ₹${cust.investment}</p>
            <button onclick="recordPayment(${cust.id})" class="bg-green-500 text-white px-2 py-1 rounded mt-2">Record Payment</button>
            <button onclick="exportPDF(${cust.id})" class="bg-purple-500 text-white px-2 py-1 rounded mt-2">Export PDF</button>
        `;

        loadPayments(id);
    };
}

// Record Profit Payment
function recordPayment(id) {
    let amount = prompt("Enter profit amount:");
    if (!amount || isNaN(amount)) return;

    let tx = db.transaction("payments", "readwrite");
    let store = tx.objectStore("payments");
    let payment = { customerId: id, amount: parseFloat(amount), date: new Date().toISOString() };
    store.add(payment);

    tx.oncomplete = () => {
        alert("Payment added!");
        loadPayments(id);
    };
}

// Load Payment History
function loadPayments(customerId) {
    let tx = db.transaction("payments", "readonly");
    let store = tx.objectStore("payments");
    let index = store.index("customerId");
    let request = index.getAll(customerId);

    request.onsuccess = function() {
        let list = document.getElementById("paymentHistory");
        list.innerHTML = "<h4 class='font-bold mt-4'>Payment History</h4>";

        if (request.result.length === 0) {
            list.innerHTML += "<p>No payments yet</p>";
            return;
        }

        let total = 0;
        request.result.forEach(pay => {
            total += pay.amount;
            list.innerHTML += `<p>${new Date(pay.date).toLocaleDateString()} → ₹${pay.amount}</p>`;
        });

        list.innerHTML += `<p class='mt-2 font-bold'>Total Paid: ₹${total}</p>`;
    };
}

// Export Customer Summary to PDF
function exportPDF(customerId) {
    let tx = db.transaction("customers", "readonly");
    let store = tx.objectStore("customers");
    let request = store.get(customerId);

    request.onsuccess = function() {
        let cust = request.result;

        let tx2 = db.transaction("payments", "readonly");
        let store2 = tx2.objectStore("payments");
        let index = store2.index("customerId");
        let req2 = index.getAll(customerId);

        req2.onsuccess = function() {
            let payments = req2.result;
            let doc = new jsPDF();
            doc.text(`Customer: ${cust.name}`, 10, 10);
            doc.text(`Investment: ₹${cust.investment}`, 10, 20);

            let y = 40, total = 0;
            doc.text("Payment History:", 10, 30);
            payments.forEach(p => {
                doc.text(`${new Date(p.date).toLocaleDateString()} - ₹${p.amount}`, 10, y);
                y += 10;
                total += p.amount;
            });

            doc.text(`Total Paid: ₹${total}`, 10, y + 10);
            doc.save(`${cust.name}_summary.pdf`);
        };
    };
}

// Ensure customers show on first load
window.onload = function() {
    if (db) {
        loadCustomers();
    } else {
        setTimeout(() => loadCustomers(), 500);
    }
};
