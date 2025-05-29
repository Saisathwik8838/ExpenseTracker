// --- Global variables ---
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

let barChart, lineChart, pieChart;

// --- DOM elements ---
const incomeInput = document.getElementById("income");
const expenseInput = document.getElementById("expense");
const categorySelect = document.getElementById("category");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");

// --- Initialization without authentication check ---
window.addEventListener('load', () => {
  // No authentication check here!

  loadUserData();
  loadStoredData();
  updateSummary();
  updateCharts();
  generateReport();
  setupReportPeriodListener();
  setupAddDataListener();
  checkTemporaryAccess();
});

// Load user data and update UI
function loadUserData() {
  // Try to get userData from localStorage if available, else fallback
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const userName = userData.name || currentUser.email?.split('@')[0] || 'User';
  const userEmail = userData.email || currentUser.email || 'user@example.com';

  document.getElementById('userName').textContent = userName;
  document.getElementById('profileName').textContent = userName;
  document.getElementById('profileEmail').textContent = userEmail;

  if (userData.age) {
    document.getElementById('profileAge').textContent = `Age: ${userData.age}`;
  }

  if(document.getElementById('updateName')) document.getElementById('updateName').value = userName;
  if(document.getElementById('updateEmail')) document.getElementById('updateEmail').value = userEmail;
}

// Load transactions from localStorage and rebuild data arrays
function loadStoredData() {
  const storedTransactions = localStorage.getItem('transactions');
  if (storedTransactions) {
    transactions = JSON.parse(storedTransactions);

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

    transactions.forEach(t => {
      if (t.type === 'income') {
        incomeData.push(t.amount);
      } else if (t.type === 'expense') {
        expenseData.push(t.amount);
        if (categories.hasOwnProperty(t.category)) {
          categories[t.category] += t.amount;
        } else {
          categories['Other'] += t.amount;
        }
      }
    });
  }
}

// Add income/expense data from inputs
function addData() {
  const income = parseFloat(incomeInput.value);
  const expense = parseFloat(expenseInput.value);
  const category = categorySelect.value || 'Other';
  const timestamp = new Date().toISOString();

  let added = false;

  if (!isNaN(income) && income > 0) {
    incomeData.push(income);
    transactions.push({
      type: 'income',
      amount: income,
      category: 'Income',
      date: timestamp,
      id: Date.now() + Math.random()
    });
    added = true;
  }

  if (!isNaN(expense) && expense > 0) {
    expenseData.push(expense);
    if (categories.hasOwnProperty(category)) {
      categories[category] += expense;
    } else {
      categories['Other'] += expense;
    }
    transactions.push({
      type: 'expense',
      amount: expense,
      category: category,
      date: timestamp,
      id: Date.now() + Math.random()
    });
    added = true;
  }

  if (added) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    incomeInput.value = '';
    expenseInput.value = '';
    updateSummary();
    updateCharts();
    generateReport();
  }
}

// Update income, expense, and balance summary UI
function updateSummary() {
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  const balanceAmount = incomeTotal - expenseTotal;

  totalIncome.textContent = `$${incomeTotal.toFixed(2)}`;
  totalExpense.textContent = `$${expenseTotal.toFixed(2)}`;
  balance.textContent = `$${balanceAmount.toFixed(2)}`;

  if (balanceAmount > 0) {
    balance.style.color = '#3eaf7c';
  } else if (balanceAmount < 0) {
    balance.style.color = '#e04f5f';
  } else {
    balance.style.color = '#ccc';
  }
}

// Update Bar, Line, and Pie charts with current data
function updateCharts() {
  const labels = Array.from({ length: Math.max(incomeData.length, expenseData.length) }, (_, i) => `Entry ${i + 1}`);

  const incomeColor = '#3eaf7c';
  const expenseColor = '#e04f5f';

  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

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
      plugins: { legend: { labels: { color: '#fff' } } },
      scales: {
        x: { ticks: { color: '#fff' }, grid: { color: '#333' } },
        y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
      }
    }
  });

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
      plugins: { legend: { labels: { color: '#fff' } } },
      scales: {
        x: { ticks: { color: '#fff' }, grid: { color: '#333' } },
        y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
      }
    }
  });

  const pieData = Object.entries(categories)
    .filter(([, amount]) => amount > 0);

  if (pieData.length > 0) {
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: pieData.map(([cat]) => cat),
        datasets: [{
          data: pieData.map(([, amt]) => amt),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384'
          ],
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#fff' } } }
      }
    });
  }
}

// Generate report based on selected period
function generateReport() {
  const period = document.getElementById('reportPeriod')?.value || 'all';
  const now = new Date();
  let filteredTransactions = transactions;

  switch (period) {
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
      break;
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
      break;
    case 'year':
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= yearAgo);
      break;
  }

  const tbody = document.querySelector('#reportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  filteredTransactions.forEach(t => {
    const tr = document.createElement('tr');

    const typeTd = document.createElement('td');
    typeTd.textContent = t.type.charAt(0).toUpperCase() + t.type.slice(1);
    tr.appendChild(typeTd);

    const categoryTd = document.createElement('td');
    categoryTd.textContent = t.category;
    tr.appendChild(categoryTd);

    const amountTd = document.createElement('td');
    amountTd.textContent = `$${t.amount.toFixed(2)}`;
    tr.appendChild(amountTd);

    const dateTd = document.createElement('td');
    dateTd.textContent = new Date(t.date).toLocaleString();
    tr.appendChild(dateTd);

    tbody.appendChild(tr);
  });
}

function checkTemporaryAccess() {
  if (sessionStorage.getItem('tempDashboardAccess') === 'granted') {
    alert('You have temporary dashboard access; some features are disabled.');

    document.querySelectorAll('.sensitive-feature').forEach(elem => {
      elem.disabled = true;
      elem.style.opacity = '0.5';
    });
  }
}

function setupReportPeriodListener() {
  const reportPeriodSelect = document.getElementById('reportPeriod');
  if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener('change', generateReport);
  }
}

function setupAddDataListener() {
  const addDataBtn = document.getElementById('addDataBtn');
  if (addDataBtn) {
    addDataBtn.addEventListener('click', addData);
  }
}

function switchSection(sectionId) {
  document.querySelectorAll('section').forEach(s => {
    s.style.display = s.id === sectionId ? 'block' : 'none';
  });
}

function exportReport() {
  alert("Export report functionality to be implemented.");
}
