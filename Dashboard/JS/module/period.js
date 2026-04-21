// Заполнения выпадающего списка
function populateMonthSelect() {
    const monthSelect = document.getElementById('month-select');
    if (!monthSelect) return;

    const months = [
        'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
    ];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    const currentMonth = new Date().getMonth() + 1;
    monthSelect.value = currentMonth;
}


function populateYearSelect() {
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear;
}


function onPeriodChange() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    console.log(`Выбран период: ${month}.${year}`);

    
    localStorage.setItem('selectedMonth', month);
    localStorage.setItem('selectedYear', year);
}


function initPeriodSelector() {
    populateMonthSelect();
    populateYearSelect();

    
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');

    const savedMonth = localStorage.getItem('selectedMonth');
    const savedYear = localStorage.getItem('selectedYear');
    
    if (savedMonth && monthSelect) monthSelect.value = savedMonth;
    if (savedYear && yearSelect) yearSelect.value = savedYear;

    if (monthSelect) {
        monthSelect.addEventListener('change', onPeriodChange);
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', onPeriodChange);
    }
}

export { initPeriodSelector };