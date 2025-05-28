// File: frontend/dashboard/dashboard.js

let incomeData = [];
let expenseData = [];

const incomeInput = document.getElementById("income");
const expenseInput = document.getElementById("expense");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");
const barTooltip = document.getElementById("barTooltip");

// Chart instances
let barChart, lineChart, pieChart;

function addData() {
  const income = parseFloat(incomeInput.value);
  const expense = parseFloat(expenseInput.value);

  if (!isNaN(income)) incomeData.push(income);
  if (!isNaN(expense)) expenseData.push(expense);

  incomeInput.value = '';
  expenseInput.value = '';

  updateSummary();
  updateCharts();
}

function updateSummary() {
  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);

  totalIncome.textContent = `$${incomeTotal.toFixed(2)}`;
  totalExpense.textContent = `$${expenseTotal.toFixed(2)}`;
  balance.textContent = `$${(incomeTotal - expenseTotal).toFixed(2)}`;
}

function updateCharts() {
  const labels = Array.from({ length: Math.max(incomeData.length, expenseData.length) }, (_, i) => `Entry ${i + 1}`);

  const incomeTotal = incomeData.reduce((a, b) => a + b, 0);
  const expenseTotal = expenseData.reduce((a, b) => a + b, 0);

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
      plugins: {
        tooltip: {
          enabled: false,
          external: function(context) {
            const tooltip = context.tooltip;
            const tooltipEl = document.getElementById('barTooltip');

            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = 0;
              return;
            }

            const incomeVal = tooltip.dataPoints[0].raw;
            const expenseVal = tooltip.dataPoints[1]?.raw || 0;

            tooltipEl.innerHTML = `<strong>Income:</strong> $${incomeVal}<br><strong>Expense:</strong> $${expenseVal}`;
            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = tooltip.caretX + 'px';
            tooltipEl.style.top = tooltip.caretY + 'px';
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
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
      responsive: true
    }
  });

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [incomeTotal, expenseTotal],
        backgroundColor: [incomeColor, expenseColor],
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true
    }
  });
}
