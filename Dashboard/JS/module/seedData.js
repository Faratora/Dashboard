import { $, log } from './utils.js';

let seedDataModal = null;
let seedBackdrop = null;

function initSeedData() {
    log('initSeedData called');
    seedBackdrop = $('#seed-data-backdrop');
    seedDataModal = $('#seed-data-modal');
    
    closeSeedModal();
    
    const seedBtn = $('#seed-data-btn');
    const closeBtn = $('#seed-close-btn');
    const copyBtn = $('#seed-copy-btn');
    
    if (seedBtn) {
        seedBtn.addEventListener('click', openSeedModal);
        log('seedBtn listener added');
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            log('closeBtn clicked');
            closeSeedModal();
        });
        log('closeBtn listener added');
    }
    if (seedBackdrop) {
        seedBackdrop.addEventListener('click', () => {
            log('backdrop clicked');
            closeSeedModal();
        });
    }
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copyDataFromPeriod();
        });
    }
}

function openSeedModal() {
    if (!seedBackdrop || !seedDataModal) return;
    
    const monthSelect = $('#month-select');
    const yearSelect = $('#year-select');
    const currentPeriodLabel = $('#current-period-label');
    
    if (monthSelect && yearSelect && currentPeriodLabel) {
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthIndex = parseInt(monthSelect.value) - 1;
        currentPeriodLabel.textContent = `(${monthNames[monthIndex]} ${yearSelect.value})`;
    }
    
    renderSeedTable();
    seedBackdrop.style.display = 'block';
    seedDataModal.style.display = 'block';
    log('Seed modal opened');
}

function closeSeedModal() {
    if (!seedBackdrop || !seedDataModal) return;
    
    seedBackdrop.style.display = 'none';
    seedDataModal.style.display = 'none';
    log('Seed modal closed');
}

function renderSeedTable() {
    const tbody = $('#seed-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const stored = localStorage.getItem('monthlyData');
    const allData = stored ? JSON.parse(stored) : { monthlyData: {} };
    
    const periods = Object.keys(allData.monthlyData).sort();
    
    periods.forEach(period => {
        const data = allData.monthlyData[period];
        const [year, month] = period.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${year}</td>
            <td>${monthNames[parseInt(month) - 1]}</td>
            <td>${data.projects?.length || 0}</td>
            <td>${data.employees?.length || 0}</td>
            <td>$0.00</td>
            <td><button class="copy-btn" data-period="${period}">Seed</button></td>
        `;
        
        tr.querySelector('.copy-btn').addEventListener('click', (e) => {
            copyDataFromPeriod(period);
        });
        
        tbody.appendChild(tr);
    });
}

function copyDataFromPeriod(sourcePeriod) {
    const stored = localStorage.getItem('monthlyData');
    const allData = stored ? JSON.parse(stored) : { monthlyData: {} };
    
    if (!sourcePeriod) {
        const month = $('#month-select')?.value;
        const year = $('#year-select')?.value;
        sourcePeriod = `${year}-${month}`;
    }
    
    const sourceData = allData.monthlyData[sourcePeriod];
    if (!sourceData) {
        log('No data found for period: ' + sourcePeriod);
        return;
    }
    
    const currentPeriod = getCurrentPeriod();
    
    if (!allData.monthlyData[currentPeriod]) {
        allData.monthlyData[currentPeriod] = { employees: [], projects: [] };
    }
    
    allData.monthlyData[currentPeriod] = {
        projects: [...sourceData.projects],
        employees: [...sourceData.employees]
    };
    
    localStorage.setItem('monthlyData', JSON.stringify(allData));
    
    log('Data copied from ' + sourcePeriod + ' to ' + currentPeriod);
    closeSeedModal();
    
    window.dispatchEvent(new CustomEvent('periodChanged'));
}

function getCurrentPeriod() {
    const month = $('#month-select')?.value || (new Date().getMonth() + 1).toString();
    const year = $('#year-select')?.value || new Date().getFullYear().toString();
    return `${year}-${month}`;
}

export { initSeedData };