let db;
let currentCustomer;

// Initialize IndexedDB
let request = indexedDB.open("SilverDB", 1);
request.onupgradeneeded = function(e) {
    db = e.target.result;
    let custStore = db.createObjectStore("customers", { keyPath: "id", autoIncrement: true });
    custStore.createIndex("name", "name", { unique: false });

    let txnStore = db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
    txnStore.createIndex("customer_id", "customer_id", { unique: false });
};
request.onsuccess = function(e) { 
    db = e.target.result; 
    loadCustomers(); // auto-load dashboard
};
request.onerror = function(e) { alert("DB Error"); };

// ---------------- CUSTOMER ----------------
function showAddCustomer() {
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("addCustomerPage").style.display = "block";
}

function saveCustomer() {
    let tx = db.transaction("customers", "readwrite");
    let store = tx.objectStore("customers");
    store.add({
        name: document.getElementById("custNameInput").value,
        phone: document.getElementById("custPhoneInput").value,
        address: document.getElementById("custAddressInput").value
    });
    tx.oncomplete = () => {
        alert("Customer added!");
        document.getElementById("addCustomerPage").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        loadCustomers();
    };
}

function loadCustomers() {
    let tx = db.transaction("customers", "readonly");
    let store = tx.objectStore("customers");
    let request = store.getAll();
    request.onsuccess = function() {
        let list = document.getElementById("customerList");
        let summaryDiv = document.getElementById("summary");
        list.innerHTML = "";
        summaryDiv.innerHTML = "";
        
        let totalInvest = 0, totalProfit = 0;
        request.result.forEach(c => {
            let btn = document.createElement("button");
            btn.innerText = c.name;
            btn.onclick = () => openCustomer(c);
            list.appendChild(btn);

            // also calculate totals
            let tx2 = db.transaction("transactions", "readonly");
            let store2 = tx2.objectStore("transactions");
            let idx = store2.index("customer_id");
            let req = idx.getAll(c.id);
            req.onsuccess = function() {
                req.result.forEach(t => {
                    if (t.type === "investment") totalInvest += t.amount;
                    if (t.type === "profit") totalProfit += t.amount;
                });
                summaryDiv.innerHTML = `
                    <h3>Overall Summary</h3>
                    <p>Total Investments: ₹${totalInvest}</p>
                    <p>Total Profits Paid: ₹${totalProfit}</p>
                    <p>Overall Balance: ₹${totalInvest - totalProfit}</p>
                `;
            };
        });
    };
}

// ---------------- CUSTOMER DETAIL ----------------
function openCustomer(cust) {
    currentCustomer = cust;
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("customerDetail").style.display = "block";
    document.getElementById("custName").innerText = cust.name;
    document.getElementById("custPhone").innerText = "Phone: " + cust.phone;
    document.getElementById("custAddress").innerText = "Address: " + cust.address;
    loadTransactions();
}

function backToDashboard() {
    document.getElementById("customerDetail").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadCustomers();
}

// ---------------- TRANSACTIONS ----------------
function addTransaction() {
    let type = document.getElementById("txnType").value;
    let amt = parseFloat(document.getElementById("txnAmount").value);
    if (!amt) return;

    let tx = db.transaction("transactions", "readwrite");
    let store = tx.objectStore("transactions");
    store.add({ customer_id: currentCustomer.id, type: type, amount: amt, date: new Date() });

    tx.oncomplete = () => {
        loadTransactions();
        document.getElementById("txnAmount").value = "";
    };
}

function loadTransactions() {
    let tx = db.transaction("transactions", "readonly");
    let store = tx.objectStore("transactions");
    let idx = store.index("customer_id");
    let req = idx.getAll(currentCustomer.id);

    req.onsuccess = function() {
        let list = document.getElementById("txnList");
        list.innerHTML = "";
        let inv = 0, profit = 0;
        req.result.forEach(t => {
            let li = document.createElement("li");
            li.innerText = `${new Date(t.date).toLocaleDateString()} - ${t.type} - ₹${t.amount}`;
            list.appendChild(li);
            if (t.type === "investment") inv += t.amount;
            if (t.type === "profit") profit += t.amount;
        });
        document.getElementById("investTotal").innerText = inv;
        document.getElementById("profitTotal").innerText = profit;
        document.getElementById("balance").innerText = inv - profit;
    };
}

// ---------------- PDF EXPORT ----------------
function downloadPDF() {
    let { jsPDF } = window.jspdf;
    let doc = new jsPDF();
    doc.text(`Customer Report: ${currentCustomer.name}`, 10, 10);
    doc.text(`Phone: ${currentCustomer.phone}`, 10, 20);
    doc.text(`Address: ${currentCustomer.address}`, 10, 30);
    doc.text(`Investments: ₹${document.getElementById("investTotal").innerText}`, 10, 50);
    doc.text(`Profits Paid: ₹${document.getElementById("profitTotal").innerText}`, 10, 60);
    doc.text(`Balance: ₹${document.getElementById("balance").innerText}`, 10, 70);
    doc.save(`${currentCustomer.name}_report.pdf`);
}
