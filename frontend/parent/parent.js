// Parent Login Logic
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('parentLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('parentEmail').value.trim();
      const password = document.getElementById('parentPassword').value.trim();

      // Simulate parent authentication (real: server validation)
      let parents = JSON.parse(localStorage.getItem('parents') || '[]');
      const parent = parents.find(p => p.email === email && p.password === password);
      if (parent) {
        localStorage.setItem('parentLoggedIn', 'true');
        localStorage.setItem('currentParent', JSON.stringify(parent));
        window.location.href = 'parent-dashboard.html';
      } else {
        alert('Invalid parent credentials.');
      }
    });
  }

  // Parent Dashboard Logic
  if (window.location.pathname.includes('parent-dashboard.html')) {
    checkParentAuth();
    loadLimitsBanner();
    loadExpensesForChild();
    loadApprovalRequests();
    document.getElementById('limitForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const limit = parseFloat(document.getElementById('spendingLimit').value);
      let parent = JSON.parse(localStorage.getItem('currentParent'));
      parent.limit = limit;
      // Save updated parent
      let parents = JSON.parse(localStorage.getItem('parents') || '[]');
      parents = parents.map(p => p.email === parent.email ? parent : p);
      localStorage.setItem('parents', JSON.stringify(parents));
      localStorage.setItem('currentParent', JSON.stringify(parent));
      loadLimitsBanner();
      alert('Spending limit updated.');
    });
  }
});

function checkParentAuth() {
  if (localStorage.getItem('parentLoggedIn') !== 'true') {
    window.location.href = 'parent-login.html';
  }
}

function parentLogout() {
  localStorage.removeItem('parentLoggedIn');
  localStorage.removeItem('currentParent');
  window.location.href = 'parent-login.html';
}

function showSection(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(section).classList.add('active');
}

function loadLimitsBanner() {
  let parent = JSON.parse(localStorage.getItem('currentParent') || '{}');
  let banner = document.getElementById('limitsBanner');
  if (parent.limit) {
    banner.textContent = `Weekly spending limit for your child: $${parent.limit}`;
  } else {
    banner.textContent = 'No spending limit set for your child yet.';
  }
}

function loadExpensesForChild() {
  // For demo, show all "child" transactions (would be filtered by parent-child link in real app)
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  let html = `<table style="width:100%;color:#fff;background:#2c295c;border-radius:12px;">
    <tr>
      <th>Date</th><th>Type</th><th>Amount</th><th>Category</th><th>Description</th>
    </tr>`;
  transactions.forEach(tx => {
    html += `<tr>
      <td>${new Date(tx.date).toLocaleDateString()}</td>
      <td>${tx.type}</td>
      <td>$${tx.amount}</td>
      <td>${tx.category}</td>
      <td>${tx.description || ''}</td>
    </tr>`;
  });
  html += '</table>';
  document.getElementById('expensesTable').innerHTML = html;
}

function loadApprovalRequests() {
  // For demo: show expenses pending approval
  let requests = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  let html = '<h3>Approval Requests</h3>';
  if (requests.length === 0) {
    html += '<div>No pending approvals.</div>';
  } else {
    html += '<ul>';
    requests.forEach((req, i) => {
      html += `<li>
        <b>${req.amount} for ${req.category}</b> on ${new Date(req.date).toLocaleDateString()}<br>
        <button onclick="approveExpense(${i})">Approve</button>
        <button onclick="denyExpense(${i})">Deny</button>
      </li>`;
    });
    html += '</ul>';
  }
  document.getElementById('approvalRequests').innerHTML = html;
}

function approveExpense(index) {
  let requests = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  let req = requests.splice(index, 1)[0];
  // Add to transactions
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  transactions.push(req);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('pendingApprovals', JSON.stringify(requests));
  loadApprovalRequests();
  alert('Expense approved.');
}

function denyExpense(index) {
  let requests = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  requests.splice(index, 1);
  localStorage.setItem('pendingApprovals', JSON.stringify(requests));
  loadApprovalRequests();
  alert('Expense denied.');
}