const API_BASE_URL = 'http://localhost:3000/api';
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('parentLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('parentEmail').value.trim();
      const password = document.getElementById('parentPassword').value.trim();
      if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
      }
      const submitButton = document.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Logging in...';
      submitButton.disabled = true;
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        });
        const data = await response.json();
        if (response.ok) {
          if (data.user.isMinor) {
            showMessage('Access denied. This portal is for parents/guardians only.', 'error');
            return;
          }
          console.log("Parent login successful:", data);
          const parentData = {
            ...data.user,
            loginTime: new Date().toISOString(),
            isParentLoggedIn: true
          };

          localStorage.setItem('currentParent', JSON.stringify(parentData));
          localStorage.setItem('parentLoggedIn', 'true');

          showMessage('Login successful! Redirecting...', 'success');
          
          setTimeout(() => {
            window.location.href = 'parent-dashboard.html';
          }, 1500);

        } else {
          showMessage(data.error || data.message || 'Login failed. Please try again.', 'error');
        }
      } catch (error) {
        console.error("Parent login error:", error);
        showMessage('Network error. Please check your connection and try again.', 'error');
      } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  }
  if (window.location.pathname.includes('parent-dashboard.html')) {
    initializeParentDashboard();
  }
});
async function initializeParentDashboard() {
  checkParentAuth();
  await loadChildren();
  loadLimitsBanner();
  setupLimitForm();
  loadDashboardStats();
  loadApprovalRequests();
  setupEventListeners();
}
function checkParentAuth() {
  if (localStorage.getItem('parentLoggedIn') !== 'true') {
    window.location.href = 'parent-login.html';
    return;
  }
  const parentData = localStorage.getItem('currentParent');
  if (!parentData) {
    window.location.href = 'parent-login.html';
    return;
  }
}
function setupEventListeners() {
  const childSelect = document.getElementById('childSelect');
  if (childSelect) {
    childSelect.addEventListener('change', loadChildData);
  }
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const sectionName = this.getAttribute('data-section') || this.textContent.toLowerCase().replace(/\s+/g, '');
      showSection(sectionName);
    });
  });
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', parentLogout);
  }
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      location.reload();
    });
  }
}
function parentLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('parentLoggedIn');
    localStorage.removeItem('currentParent');
    localStorage.removeItem('selectedChild');
    localStorage.removeItem('parentChildren');
    window.location.href = 'parent-login.html';
  }
}
function showSection(sectionName) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`[data-section="${sectionName}"]`) || 
                   Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
                     btn.textContent.toLowerCase().replace(/\s+/g, '') === sectionName
                   );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  if (sectionName === 'expenses') {
    loadExpensesForChild();
  } else if (sectionName === 'approvals') {
    loadApprovalRequests();
  } else if (sectionName === 'overview') {
    loadDashboardStats();
  }
}
async function loadChildren() {
  try {
    const parent = JSON.parse(localStorage.getItem('currentParent'));
    if (!parent) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        const children = data.users.filter(user => 
          user.isMinor && user.guardianEmail === parent.email
        );
        populateChildSelector(children);
        return;
      }
    } catch (backendError) {
      console.log('Backend not available, using mock data');
    }
    const mockChildren = [
      {
        id: 1,
        username: 'Alice Johnson',
        email: 'alice@example.com',
        isMinor: true,
        guardianEmail: parent.email
      },
      {
        id: 2,
        username: 'Bob Johnson',
        email: 'bob@example.com',
        isMinor: true,
        guardianEmail: parent.email
      }
    ];
    populateChildSelector(mockChildren);   
  } catch (error) {
    console.error('Error loading children:', error);
    showMessage('Error loading children data', 'error');
  }
}
function populateChildSelector(children) {
  const childSelect = document.getElementById('childSelect');
  if (!childSelect) return;
  childSelect.innerHTML = '<option value="">Select a child...</option>';
  children.forEach(child => {
    const option = document.createElement('option');
    option.value = child.id;
    option.textContent = `${child.username} (${child.email})`;
    childSelect.appendChild(option);
  });
  localStorage.setItem('parentChildren', JSON.stringify(children));
  if (children.length === 1) {
    childSelect.value = children[0].id;
    loadChildData();
  }
}
function loadChildData() {
  const childSelect = document.getElementById('childSelect');
  const selectedChildId = childSelect.value;
  if (selectedChildId) {
    localStorage.setItem('selectedChild', selectedChildId);
    loadDashboardStats();
    const expensesSection = document.getElementById('expenses');
    if (expensesSection && expensesSection.classList.contains('active')) {
      loadExpensesForChild();
    }
    showMessage('Child selected successfully', 'success');
  } else {
    localStorage.removeItem('selectedChild');
    clearDashboardStats();
  }
}
function loadLimitsBanner() {
  const parent = JSON.parse(localStorage.getItem('currentParent') || '{}');
  const banner = document.getElementById('limitsBanner');
  if (!banner) return;
  const spendingLimit = parent.weeklyLimit || null;
  if (spendingLimit) {
    banner.textContent = `Weekly spending limit for your children: $${spendingLimit.toFixed(2)}`;
    banner.style.background = 'linear-gradient(145deg, #4caf50, #388e3c)';
    banner.style.color = 'white';
  } else {
    banner.textContent = 'No spending limit set for your children yet.';
    banner.style.background = 'linear-gradient(145deg, #ff9800, #f57c00)';
    banner.style.color = 'white';
  }
}
function setupLimitForm() {
  const limitForm = document.getElementById('limitForm');
  if (!limitForm) return;
  const parent = JSON.parse(localStorage.getItem('currentParent') || '{}');
  const limitInput = document.getElementById('spendingLimit');
  if (parent.weeklyLimit && limitInput) {
    limitInput.value = parent.weeklyLimit;
  }
  limitForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const limitInput = document.getElementById('spendingLimit');
    const limit = parseFloat(limitInput.value);
    if (isNaN(limit) || limit < 0) {
      showMessage('Please enter a valid spending limit.', 'error');
      return;
    }
    if (limit > 10000) {
      showMessage('Spending limit seems too high. Please enter a reasonable amount.', 'error');
      return;
    }
    let parent = JSON.parse(localStorage.getItem('currentParent'));
    parent.weeklyLimit = limit;
    localStorage.setItem('currentParent', JSON.stringify(parent));
    loadLimitsBanner();
    loadDashboardStats();
    showMessage('Spending limit updated successfully!', 'success');
  });
}
function loadDashboardStats() {
  const selectedChildId = localStorage.getItem('selectedChild');
  if (!selectedChildId) {
    clearDashboardStats();
    return;
  }
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  if (transactions.length === 0) {
    transactions = generateMockTransactions(selectedChildId);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
  const childTransactions = transactions.filter(tx => tx.userId == selectedChildId);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0); 
  const weeklyTransactions = childTransactions.filter(tx => 
    new Date(tx.date) >= weekStart && tx.type === 'expense'
  );
  const weeklySpent = weeklyTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlyTransactions = childTransactions.filter(tx => 
    new Date(tx.date) >= monthStart && tx.type === 'expense'
  );
  const monthlySpent = monthlyTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const parent = JSON.parse(localStorage.getItem('currentParent') || '{}');
  const weeklyLimit = parent.weeklyLimit || 0;
  const remainingBudget = Math.max(0, weeklyLimit - weeklySpent);
  const pendingApprovals = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  const childPendingApprovals = pendingApprovals.filter(req => req.userId == selectedChildId);
  updateElementText('weeklySpent', `$${weeklySpent.toFixed(2)}`);
  updateElementText('monthlySpent', `$${monthlySpent.toFixed(2)}`);
  updateElementText('pendingCount', childPendingApprovals.length.toString());
  updateElementText('remainingBudget', `$${remainingBudget.toFixed(2)}`);
  const remainingElement = document.getElementById('remainingBudget');
  if (remainingElement) {
    if (remainingBudget <= 0) {
      remainingElement.style.color = '#f44336';
    } else if (remainingBudget < weeklyLimit * 0.2) {
      remainingElement.style.color = '#ff9800';
    } else {
      remainingElement.style.color = '#4caf50';
    }
  }
}
function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}
function clearDashboardStats() {
  updateElementText('weeklySpent', '$0.00');
  updateElementText('monthlySpent', '$0.00');
  updateElementText('pendingCount', '0');
  updateElementText('remainingBudget', '$0.00');
  
  const remainingElement = document.getElementById('remainingBudget');
  if (remainingElement) {
    remainingElement.style.color = '#fff';
  }
}
function generateMockTransactions(childId) {
  const transactions = [];
  const categories = ['Food', 'Entertainment', 'School Supplies', 'Transportation', 'Clothing'];
  const descriptions = [
    'Lunch at school cafeteria',
    'Movie tickets with friends',
    'Notebooks and pens',
    'Bus fare',
    'New school shirt',
    'Snacks from vending machine',
    'Gaming subscription',
    'Art supplies for project'
  ];
  
  // Generate transactions for the past month
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    transactions.push({
      id: Date.now() + i,
      userId: childId,
      type: 'expense',
      amount: (Math.random() * 50 + 5).toFixed(2),
      category: categories[Math.floor(Math.random() * categories.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      date: date.toISOString(),
      status: Math.random() > 0.8 ? 'pending' : 'approved'
    });
  } 
  return transactions;
}
function loadExpensesForChild() {
  const selectedChildId = localStorage.getItem('selectedChild');
  const expensesContent = document.getElementById('expensesContent');
  if (!expensesContent) return;
  if (!selectedChildId) {
    expensesContent.innerHTML = '<div class="empty-state">Select a child from the overview section to view their expenses.</div>';
    return;
  }
  const children = JSON.parse(localStorage.getItem('parentChildren') || '[]');
  const selectedChild = children.find(child => child.id == selectedChildId);
  
  if (!selectedChild) {
    expensesContent.innerHTML = '<div class="empty-state">Child not found.</div>';
    return;
  }
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  if (transactions.length === 0) {
    transactions = generateMockTransactions(selectedChildId);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
  
  const childTransactions = transactions.filter(tx => tx.userId == selectedChildId);
  
  if (childTransactions.length === 0) {
    expensesContent.innerHTML = `<div class="empty-state">No expenses found for ${selectedChild.username}.</div>`;
    return;
  }
  let html = `
    <div class="expenses-header">
      <h3>Expenses for ${selectedChild.username}</h3>
      <button onclick="exportExpenses()" class="export-btn">Export CSV</button>
    </div>
    <div class="table-container">
      <table class="expenses-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;
  childTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(tx => {
      const statusColor = tx.status === 'approved' ? '#4caf50' : 
                         tx.status === 'pending' ? '#ff9800' : '#f44336';
      
      html += `
        <tr>
          <td>${new Date(tx.date).toLocaleDateString()}</td>
          <td style="text-transform: capitalize;">${tx.type}</td>
          <td class="amount">$${parseFloat(tx.amount).toFixed(2)}</td>
          <td>${tx.category || 'N/A'}</td>
          <td>${tx.description || 'N/A'}</td>
          <td>
            <span class="status-badge" style="color: ${statusColor}; background-color: ${statusColor}20; padding: 4px 8px; border-radius: 12px; font-size: 0.85em;">
              ${(tx.status || 'completed').toUpperCase()}
            </span>
          </td>
        </tr>
      `;
    });
  
  html += '</tbody></table></div>';
  expensesContent.innerHTML = html;
}
function exportExpenses() {
  const selectedChildId = localStorage.getItem('selectedChild');
  if (!selectedChildId) return;
  
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const childTransactions = transactions.filter(tx => tx.userId == selectedChildId);
  
  if (childTransactions.length === 0) {
    showMessage('No expenses to export', 'error');
    return;
  }
  const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Status'];
  const csvContent = [
    headers.join(','),
    ...childTransactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.amount,
      tx.category || '',
      `"${tx.description || ''}"`,
      tx.status || 'completed'
    ].join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses_${selectedChildId}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showMessage('Expenses exported successfully', 'success');
}
function loadApprovalRequests() {
  const approvalRequestsDiv = document.getElementById('approvalRequests');
  if (!approvalRequestsDiv) return;
  let pendingApprovals = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  const children = JSON.parse(localStorage.getItem('parentChildren') || '[]');
  if (pendingApprovals.length === 0 && children.length > 0) {
    pendingApprovals = generateMockApprovalRequests(children);
    localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
  }
  if (pendingApprovals.length === 0) {
    approvalRequestsDiv.innerHTML = '<div class="empty-state">✅ No pending approval requests. All caught up!</div>';
    return;
  }
  let html = '<div class="approval-requests-container">';
  pendingApprovals.forEach((request, index) => {
    const child = children.find(c => c.id == request.userId);
    const childName = child ? child.username : 'Unknown Child';  
    html += `
      <div class="approval-request" id="approval-${index}">
        <div class="approval-header">
          <h4>💳 Expense Request from ${childName}</h4>
          <span class="request-date">${new Date(request.date).toLocaleDateString()}</span>
        </div>
        <div class="approval-details">
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value amount">$${parseFloat(request.amount).toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${request.category}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${request.description || 'No description provided'}</span>
          </div>
          ${request.location ? `
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${request.location}</span>
          </div>` : ''}
        </div>
        
        <div class="approval-buttons">
          <button class="approve-btn" onclick="approveExpense(${index})">
            ✅ Approve
          </button>
          <button class="deny-btn" onclick="denyExpense(${index})">
            ❌ Deny
          </button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  approvalRequestsDiv.innerHTML = html;
}
function generateMockApprovalRequests(children) {
  const requests = [];
  const categories = ['Food', 'Entertainment', 'School Supplies', 'Transportation'];
  const descriptions = [
    'Need money for lunch with friends',
    'Want to buy a new book for school project',
    'Need bus fare for field trip',
    'Snacks for study group'
  ];
  const locations = ['School Cafeteria', 'Local Bookstore', 'Bus Station', 'Corner Store'];
  for (let i = 0; i < Math.min(3, children.length * 2); i++) {
    const randomChild = children[Math.floor(Math.random() * children.length)];
    requests.push({
      id: Date.now() + i,
      userId: randomChild.id,
      amount: (Math.random() * 30 + 10).toFixed(2),
      category: categories[Math.floor(Math.random() * categories.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      date: new Date().toISOString(),
      status: 'pending'
    });
  }
  return requests;
}
function approveExpense(index) {
  const pendingApprovals = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  const request = pendingApprovals[index];
  if (!request) return;
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const newTransaction = {
    ...request,
    type: 'expense',
    status: 'approved',
    approvedDate: new Date().toISOString()
  };
  transactions.push(newTransaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  pendingApprovals.splice(index, 1);
  localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
  loadApprovalRequests();
  loadDashboardStats();
  showMessage('Expense approved successfully!', 'success');
}
function denyExpense(index) {
  const pendingApprovals = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
  const request = pendingApprovals[index];
  if (!request) return;
  if (confirm('Are you sure you want to deny this expense request?')) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const newTransaction = {
      ...request,
      type: 'expense',
      status: 'denied',
      deniedDate: new Date().toISOString()
    };   
    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    pendingApprovals.splice(index, 1);
    localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
    loadApprovalRequests();
    loadDashboardStats();
    showMessage('Expense denied.', 'info');
  }
}
function showMessage(message, type = 'info') {
  const existingMessages = document.querySelectorAll('.message');
  existingMessages.forEach(msg => msg.remove());
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;
  switch (type) {
    case 'success':
      messageDiv.style.backgroundColor = '#4caf50';
      break;
    case 'error':
      messageDiv.style.backgroundColor = '#f44336';
      break;
    case 'warning':
      messageDiv.style.backgroundColor = '#ff9800';
      break;
    default:
      messageDiv.style.backgroundColor = '#2196f3';
  }
  
  document.body.appendChild(messageDiv);
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.style.opacity = '0';
      messageDiv.style.transform = 'translateX(100%)';
      setTimeout(() => messageDiv.remove(), 300);
    }
  }, 3000);
}
function refreshDashboard() {
  loadDashboardStats();
  loadApprovalRequests();
  showMessage('Dashboard refreshed', 'success');
}
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  });
}

function showTooltip(event) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = event.target.getAttribute('data-tooltip');
  tooltip.style.cssText = `
    position: absolute;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1001;
    pointer-events: none;
  `;
  
  document.body.appendChild(tooltip);
  
  const rect = event.target.getBoundingClientRect();
  tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
  tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
}
function hideTooltip() {
  const tooltips = document.querySelectorAll('.tooltip');
  tooltips.forEach(tooltip => tooltip.remove());
}
window.parentLogout = parentLogout;
window.showSection = showSection;
window.loadChildData = loadChildData;
window.approveExpense = approveExpense;
window.denyExpense = denyExpense;
window.exportExpenses = exportExpenses;
window.refreshDashboard = refreshDashboard;
