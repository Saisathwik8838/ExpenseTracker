let incomeData = [];
let expenseData = [];
let allEntries = []; // Store all entries with details

const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");
const entriesList = document.getElementById("entriesList");

let lineChart, pieChart;

// Navigation between steps
function selectType(type) {
  document.getElementById('step1').style.display = 'none';
  
  if (type === 'income') {
    document.getElementById('incomeForm').style.display = 'block';
    document.getElementById('incomeSource').focus();
  } else if (type === 'expense') {
    document.getElementById('expenseForm').style.display = 'block';
    document.getElementById('expensePurpose').focus();
  }
}

function goBack() {
  document.getElementById('incomeForm').style.display = 'none';
  document.getElementById('expenseForm').style.display = 'none';
  document.getElementById('step1').style.display = 'block';
  
  // Clear form inputs
  clearFormInputs();
}

function clearFormInputs() {
  document.getElementById('incomeSource').value = '';
  document.getElementById('incomeAmount').value = '';
  document.getElementById('expensePurpose').value = '';
  document.getElementById('expenseAmount').value = '';
}

// Add income entry
function addIncomeEntry() {
  const source = document.getElementById('incomeSource').value.trim();
  const amount = parseFloat(document.getElementById('incomeAmount').value);

  if (!source) {
    alert('Please enter the source of income');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  // Add to data arrays
  incomeData.push(amount);
  
  // Add to entries with details
  allEntries.unshift({
    type: 'income',
    description: source,
    amount: amount,
    date: new Date().toLocaleDateString()
  });

  // Update UI
  updateCharts();
  updateRecentEntries();
  
  // Show success message and go back
  showSuccessMessage(`Income of $${amount.toFixed(2)} from ${source} added successfully!`);
  
  setTimeout(() => {
    goBack();
  }, 1500);
}

// Add expense entry
function addExpenseEntry() {
  const purpose = document.getElementById('expensePurpose').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);

  if (!purpose) {
    alert('Please enter the purpose of expense');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  // Add to data arrays
  expenseData.push(amount);
  
  // Add to entries with details
  allEntries.unshift({
    type: 'expense',
    description: purpose,
    amount: amount,
    date: new Date().toLocaleDateString()
  });

  // Update UI
  updateCharts();
  updateRecentEntries();
  
  // Show success message and go back
  showSuccessMessage(`Expense of $${amount.toFixed(2)} for ${purpose} added successfully!`);
  
  setTimeout(() => {
    goBack();
  }, 1500);
}

function showSuccessMessage(message) {
  // Create and show a temporary success message
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(145deg, #4dff88, #3eaf7c);
    color: #1a1a1a;
    padding: 1rem 2rem;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    z-index: 1001;
    font-weight: bold;
    text-align: center;
    max-width: 300px;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    document.body.removeChild(messageDiv);
  }, 1500);
}

function updateSummary() {
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  const balanceAmount = incomeTotal - expenseTotal;

  totalIncome.textContent = `$${incomeTotal.toFixed(2)}`;
  totalExpense.textContent = `$${expenseTotal.toFixed(2)}`;
  balance.textContent = `$${balanceAmount.toFixed(2)}`;
  
  // Change balance color based on positive/negative
  if (balanceAmount >= 0) {
    balance.style.color = '#4dff88';
  } else {
    balance.style.color = '#ff4d4d';
  }
}

function updateRecentEntries() {
  if (allEntries.length === 0) {
    entriesList.innerHTML = '<div class="no-data">No entries yet. Add your first income or expense!</div>';
    return;
  }

  const recentEntries = allEntries.slice(0, 5); // Show last 5 entries
  
  entriesList.innerHTML = recentEntries.map(entry => `
    <div class="entry-item">
      <div class="entry-info">
        <div class="entry-type">${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</div>
        <div class="entry-description">${entry.description}</div>
        <div style="font-size: 0.7rem; color: #888;">${entry.date}</div>
      </div>
      <div class="entry-amount ${entry.type}-amount">
        ${entry.type === 'expense' ? '-' : '+'}$${entry.amount.toFixed(2)}
      </div>
    </div>
  `).join('');
}

function createBarcodeVisualization() {
  const container = document.getElementById('barcodeContainer');
  container.innerHTML = '';
  
  if (incomeData.length === 0 && expenseData.length === 0) {
    container.innerHTML = '<div class="no-data">Add income or expense entries to see visualization</div>';
    return;
  }

  const containerHeight = container.clientHeight - 40;
  const maxValue = Math.max(...incomeData, ...expenseData, 10);
  const entriesCount = Math.max(incomeData.length, expenseData.length);
  
  for (let i = 0; i < entriesCount; i++) {
    const income = incomeData[i] || 0;
    const expense = expenseData[i] || 0;
    
    const expenseHeight = Math.max((expense / maxValue) * containerHeight, 10);
    const incomeHeight = Math.max((income / maxValue) * containerHeight, 10);
    
    const bar = document.createElement('div');
    bar.className = 'barcode-bar';
    bar.innerHTML = `
      <div class="barcode-expense" style="height: ${expenseHeight}px"></div>
      <div class="barcode-income" style="height: ${incomeHeight}px"></div>
      <div class="barcode-tooltip">
        Entry ${i+1}<br>
        Income: $${income.toFixed(2)}<br>
        Expense: $${expense.toFixed(2)}
      </div>
    `;
    
    container.appendChild(bar);
  }
}

function updateCharts() {
  updateSummary();
  updateRecentEntries();
  createBarcodeVisualization();

  const labels = Array.from({ length: Math.max(incomeData.length, expenseData.length) }, (_, i) => `Entry ${i + 1}`);
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);
  const incomeColor = '#3eaf7c';
  const expenseColor = '#e04f5f';

  // Update Line Chart
  if (lineChart) lineChart.destroy();
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
          borderWidth: 3,
          pointBackgroundColor: incomeColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: expenseColor,
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: expenseColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#fff',
            font: {
              size: 14
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ccc'
          },
          grid: {
            color: '#333'
          }
        },
        y: {
          ticks: {
            color: '#ccc'
          },
          grid: {
            color: '#333'
          }
        }
      }
    }
  });

  // Update Pie Chart
  if (pieChart) pieChart.destroy();
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [incomeTotal, expenseTotal],
        backgroundColor: [incomeColor, expenseColor],
        hoverOffset: 10,
        borderWidth: 3,
        borderColor: '#1a1a1a'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#fff',
            font: {
              size: 14
            }
          }
        }
      }
    }
  });
}

// Keyboard event listeners
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const activeElement = document.activeElement;
    
    if (activeElement.id === 'incomeAmount') {
      addIncomeEntry();
    } else if (activeElement.id === 'expenseAmount') {
      addExpenseEntry();
    }
  }
  
  if (e.key === 'Escape') {
    goBack();
  }
});

// Initialize with some sample data if empty
if (incomeData.length === 0 && expenseData.length === 0) {
  // Add some sample data
  incomeData = [1200, 1500, 1800];
  expenseData = [800, 950, 1200];
  
  // Add sample entries
  allEntries = [
    { type: 'expense', description: 'Groceries', amount: 1200, date: new Date().toLocaleDateString() },
    { type: 'income', description: 'Freelance Project', amount: 1800, date: new Date().toLocaleDateString() },
    { type: 'expense', description: 'Rent', amount: 950, date: new Date().toLocaleDateString() },
    { type: 'income', description: 'Salary', amount: 1500, date: new Date().toLocaleDateString() },
    { type: 'expense', description: 'Utilities', amount: 800, date: new Date().toLocaleDateString() },
    { type: 'income', description: 'Side Business', amount: 1200, date: new Date().toLocaleDateString() }
  ];
  
  updateCharts();
}