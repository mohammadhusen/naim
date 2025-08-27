<body>
  <h2>Silver Business</h2>

  <button onclick="document.getElementById('addForm').style.display='block'">+ Add Customer</button>
  <button onclick="loadCustomers()">View Customers</button>

  <div id="addForm" style="display:none; margin-top:10px;">
    <input id="custName" placeholder="Customer Name">
    <input id="custPhone" placeholder="Phone">
    <button onclick="addCustomer(
        document.getElementById('custName').value,
        document.getElementById('custPhone').value
    )">Save</button>
  </div>

  <hr>
  <div id="customerList"></div>
</body>
