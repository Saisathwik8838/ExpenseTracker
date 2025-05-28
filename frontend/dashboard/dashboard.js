// Enhanced Dashboard JavaScript
let incomeData = [];
let expenseData = [];
let transactions = [];
let categories = {
  'Food': 0,
  'Transportation': 0,
  'Entertainment': 0,
  'Shopping': 0,
  'Bills': 0,
  'Healthcare': 0,
  'Other': 0
};

const incomeInput = document.getElementById("income");
const expenseInput = document.getElementById("expense");
const categorySelect = document.getElementById("category");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");

// Chart instances
let barChart, lineChart, pieChart;

// Initialize dashboard on load
window.addEventListener('load', function() {
  checkAuthentication();
  loadUserData();
  loadStoredData();
  updateSummary();
  updateCharts();
  generateReport();
});

function checkAuthentication() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  if (isLoggedIn !== 'true') {
    window.location.href = "../login/login.html";
    return;
  }
}

function loadUserData() {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  const userName = userData.name || currentUser.email?.split('@')[0] || 'User';
  const userEmail = userData.email || currentUser.email || 'user@example.com';
  
  // Update navigation
  document.getElementById('userName').textContent = userName;
  
  // Update profile section
  document.getElementById('profileName').textContent = userName;
  document.getElementById('profileEmail').textContent = userEmail;
  
  if (userData.age) {
    document.getElementById('profileAge').textContent = `Age: ${userData.age}`;
  }
  
  // Pre-fill profile update form
  document.getElementById('updateName').value = userName;
  document.getElementById('updateEmail').value = userEmail;
}

function loadStoredData() {
  const storedTransactions = localStorage.getItem('transactions');
  if (storedTransactions) {
    transactions = JSON.parse(storedTransactions);
    
    // Rebuild data arrays from transactions
    incomeData = [];
    expenseData = [];
    categories = {
      'Food': 0,
      'Transportation': 0,
      'Entertainment': 0,
      'Shopping': 0,
      'Bills': 0,
      'Healthcare': 0,
      'Other': 0
    };
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        incomeData.push(transaction.amount);
      } else {
        expenseData.push(transaction.amount);
        categories[transaction.category] += transaction.amount;
      }
    });
  }
}

function addData() {
  const income = parseFloat(incomeInput.value);
  const expense = parseFloat(expenseInput.value);
  const category = categorySelect.value;
  const timestamp = new Date().toISOString();

  if (!isNaN(income) && income > 0) {
    incomeData.push(income);
    transactions.push({
      type: 'income',
      amount: income,
      category: 'Income',
      date: timestamp,
      id: Date.now() + Math.random()
    });
  }

  if (!isNaN(expense) && expense > 0) {
    expenseData.push(expense);
    categories[category] += expense;
    transactions.push({
      type: 'expense',
      amount: expense,
      category: category,
      date: timestamp,
      id: Date.now() + Math.random()
    });
  }

  // Save to localStorage
  localStorage.setItem('transactions', JSON.stringify(transactions));

  incomeInput.value = '';
  expenseInput.value = '';

  updateSummary();
  updateCharts();
  generateReport();
}

function updateSummary() {
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  const balanceAmount = incomeTotal - expenseTotal;

  totalIncome.textContent = `$${incomeTotal.toFixed(2)}`;
  totalExpense.textContent = `$${expenseTotal.toFixed(2)}`;
  balance.textContent = `$${balanceAmount.toFixed(2)}`;
  
  // Color code the balance
  if (balanceAmount > 0) {
    balance.style.color = '#3eaf7c';
  } else if (balanceAmount < 0) {
    balance.style.color = '#e04f5f';
  } else {
    balance.style.color = '#ccc';
  }
}

function updateCharts() {
  const labels = Array.from({ length: Math.max(incomeData.length, expenseData.length) }, (_, i) => `Entry ${i + 1}`);
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  const incomeColor = '#3eaf7c';
  const expenseColor = '#e04f5f';

  // Destroy existing charts
  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  // Bar Chart
  const barCtx = document.getElementById('barChart').getContext('2d');
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: incomeColor,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: expenseColor,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#fff'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        },
        y: {
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        }
      }
    }
  });

  // Line Chart
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: incomeColor,
          backgroundColor: 'transparent',
          tension: 0.4,
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: expenseColor,
          backgroundColor: 'transparent',
          tension: 0.4,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#fff'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        },
        y: {
          ticks: { color: '#fff' },
          grid: { color: '#333' }
        }
      }
    }
  });

  // Pie Chart for Categories
  const pieData = Object.entries(categories)
    .filter(([category, amount]) => amount > 0)
    .map(([category, amount]) => ({ category, amount }));

  if (pieData.length > 0) {
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: pieData.map(item => item.category),
        datasets: [{
          data: pieData.map(item => item.amount),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384'
          ],
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          }
        }
      }
    });
  }
}

// Section Management
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.remove('active'));
  
  // Show selected section
  document.getElementById(`${sectionName}-section`).classList.add('active');
  
  // Update navigation active state
  const navItems = document.querySelectorAll('nav ul li a');
  navItems.forEach(item => item.classList.remove('active'));
}

// Reports functionality
function generateReport() {
  const period = document.getElementById('reportPeriod')?.value || 'all';
  const now = new Date();
  let filteredTransactions = transactions;

  // Filter transactions based on period
  switch(period) {
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
      break;
    case 'year':
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filteredTransactions = transactions.filter(t => new Date(t.date) >= yearAgo);
      break;
  }

  // Calculate totals
  const reportIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const reportExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Update report display
  if (document.getElementById('reportIncome')) {
    document.getElementById('reportIncome').textContent = `$${reportIncome.toFixed(2)}`;
    document.getElementById('reportExpenses').textContent = `$${reportExpenses.toFixed(2)}`;
    document.getElementById('reportSavings').textContent = `$${(reportIncome - reportExpenses).toFixed(2)}`;
  }

  // Update transactions list
  updateTransactionsList(filteredTransactions);
}

function updateTransactionsList(transactionList) {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;

  if (transactionList.length === 0) {
    transactionsList.innerHTML = '<p>No transactions for this period.</p>';
    return;
  }

  const sortedTransactions = transactionList
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10); // Show last 10 transactions

  transactionsList.innerHTML = sortedTransactions.map(transaction => `
    <div class="transaction-item">
      <div>
        <span class="transaction-type ${transaction.type}">${transaction.type.toUpperCase()}</span>
        <span>${transaction.category}</span>
      </div>
      <div>
        <strong>$${transaction.amount.toFixed(2)}</strong>
        <small>${new Date(transaction.date).toLocaleDateString()}</small>
      </div>
    </div>
  `).join('');
}

function exportReport() {
  alert('Export functionality would be implemented with a PDF library in a real application.');
}

// Settings functionality
function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    localStorage.removeItem('transactions');
    incomeData = [];
    expenseData = [];
    transactions = [];
    categories = {
      'Food': 0,
      'Transportation': 0,
      'Entertainment': 0,
      'Shopping': 0,
      'Bills': 0,
      'Healthcare': 0,
      'Other': 0
    };
    
    updateSummary();
    updateCharts();
    generateReport();
    alert('All data has been cleared.');
  }
}

function exportData() {
  const dataToExport = {
    transactions,
    userData: JSON.parse(localStorage.getItem('userData') || '{}'),
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'expense-tracker-data.json';
  link.click();
}

// Profile functionality
function updateProfile() {
  const newName = document.getElementById('updateName').value.trim();
  const newEmail = document.getElementById('updateEmail').value.trim();
  
  if (!newName || !newEmail) {
    alert('Please fill in all fields.');
    return;
  }
  
  // Update stored user data
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  userData.name = newName;
  userData.email = newEmail;
  localStorage.setItem('userData', JSON.stringify(userData));
  
  // Update current user data
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  currentUser.email = newEmail;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  // Reload user data
  loadUserData();
  
  alert('Profile updated successfully!');
}

// Logout functionality
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = "../login/login.html";
  }
}