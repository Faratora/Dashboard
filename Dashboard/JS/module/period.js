import { $ } from './utils.js';

function populateMonthSelect() {
    const monthSelect = $('#month-select');
    if (!monthSelect) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    const yearSelect = $('#year-select');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const endYear = currentYear + 1;

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear;
}

function onPeriodChange() {
    const month = $('#month-select').value;
    const year = $('#year-select').value;
    console.log(`Selected period: ${month}.${year}`);

    localStorage.setItem('selectedMonth', month);
    localStorage.setItem('selectedYear', year);
}

function initPeriodSelector() {
    populateMonthSelect();
    populateYearSelect();

    const monthSelect = $('#month-select');
    const yearSelect = $('#year-select');

    console.log('initPeriodSelector called');
    console.log('Current month options count:', monthSelect?.options?.length);
    console.log('Current month select value BEFORE localStorage:', monthSelect?.value);

    localStorage.removeItem('selectedMonth');
    localStorage.removeItem('selectedYear');

    if (monthSelect) {
        monthSelect.addEventListener('change', onPeriodChange);
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', onPeriodChange);
    }
}

export { initPeriodSelector };