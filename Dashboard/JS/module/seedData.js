import { $, log } from './utils.js';
import { getCurrentPeriod } from './dataStorage.js';

let seedDataModal = null;
let seedBackdrop = null;

function initSeedData() {
    log('initSeedData called');

    seedBackdrop = document.getElementById('seed-data-backdrop');
    seedDataModal = document.getElementById('seed-data-modal');

    closeSeedModal();

    const seedBtn = document.getElementById('seed-data-btn');
    const closeBtn = document.getElementById('seed-close-btn');

    log('seedBtn:', seedBtn);
    log('closeBtn:', closeBtn);

    if (seedBtn) {
        seedBtn.onclick = function () {
            log('Seed button clicked');
            openSeedModal();
        };
    }
    if (closeBtn) {
        closeBtn.onclick = function () {
            closeSeedModal();
        };
    }
    if (seedBackdrop) {
        seedBackdrop.onclick = closeSeedModal;
    }
}

function openSeedModal() {
    log('openSeedModal called');
    if (!seedBackdrop || !seedDataModal) {
        log('Modal elements not found');
        return;
    }

    const monthSelect = $('#month-select');
    const yearSelect = $('#year-select');
    const currentPeriodLabel = $('#current-period-label');

    if (monthSelect && yearSelect && currentPeriodLabel) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(monthSelect.value) - 1;
        currentPeriodLabel.textContent = `(${monthNames[monthIndex]} ${yearSelect.value})`;
    }

    renderSeedTable();
    seedBackdrop.classList.remove('hidden');
    seedDataModal.classList.remove('hidden');
    log('Seed modal opened');
}

const closeSeedModal = () => {
    if (!seedBackdrop || !seedDataModal) return;

    seedBackdrop.classList.add('hidden');
    seedDataModal.classList.add('hidden');
    log('Seed modal closed');
};

function renderSeedTable() {
    const tbody = $('#seed-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const stored = localStorage.getItem('monthlyData');
    const allData = stored ? JSON.parse(stored) : { monthlyData: {} };

    const periods = Object.keys(allData.monthlyData).sort();

    periods.forEach((period) => {
        const data = allData.monthlyData[period];
        const [year, month] = period.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            const targetPeriod = getCurrentPeriod();
            showConfirmDialog(period, targetPeriod);
        });

        tbody.appendChild(tr);
    });
}

function copyDataFromPeriod(sourcePeriod) {
    let currentPeriod = getCurrentPeriod();
    log('copyDataFromPeriod: source=' + sourcePeriod + ', target=' + currentPeriod);

    if (sourcePeriod === currentPeriod) {
        log('Source and target are the same, skipping');
        closeSeedModal();
        return;
    }

    const stored = localStorage.getItem('monthlyData');
    const allData = stored ? JSON.parse(stored) : { monthlyData: {} };

    log('All periods in storage:', Object.keys(allData.monthlyData));
    log('Source data exists:', !!allData.monthlyData[sourcePeriod]);
    log('Source projects:', allData.monthlyData[sourcePeriod]?.projects?.length || 0);
    log('Source employees:', allData.monthlyData[sourcePeriod]?.employees?.length || 0);

    if (
        !allData.monthlyData[sourcePeriod] ||
        (!allData.monthlyData[sourcePeriod].projects?.length && !allData.monthlyData[sourcePeriod].employees?.length)
    ) {
        log('No data to copy from source period');
        closeSeedModal();
        return;
    }

    const sourceData = allData.monthlyData[sourcePeriod];
    if (!sourceData) {
        log('No data found for period: ' + sourcePeriod);
        return;
    }

    if (!sourceData.projects) {
        sourceData.projects = [];
    }
    if (!sourceData.employees) {
        sourceData.employees = [];
    }

    log('Source data validated: projects=' + sourceData.projects.length + ', employees=' + sourceData.employees.length);

    // Preserve existing data in target period, then add/update from source
    if (!allData.monthlyData[currentPeriod]) {
        allData.monthlyData[currentPeriod] = { employees: [], projects: [] };
    }

    // Merge projects (replace if same id)
    const targetProjects = [...allData.monthlyData[currentPeriod].projects];
    sourceData.projects.forEach((srcProj) => {
        const idx = targetProjects.findIndex((p) => p.id === srcProj.id);
        if (idx >= 0) {
            targetProjects[idx] = srcProj;
        } else {
            targetProjects.push(srcProj);
        }
    });

    // Merge employees (replace if same id, but clear vacationDays)
    const targetEmployees = [...allData.monthlyData[currentPeriod].employees];
    sourceData.employees.forEach((srcEmp) => {
        const idx = targetEmployees.findIndex((e) => e.id === srcEmp.id);
        const empCopy = { ...srcEmp, vacationDays: [] }; // Clear vacation days for new month
        if (idx >= 0) {
            targetEmployees[idx] = empCopy;
        } else {
            targetEmployees.push(empCopy);
        }
    });

    allData.monthlyData[currentPeriod].projects = targetProjects;
    allData.monthlyData[currentPeriod].employees = targetEmployees;

    localStorage.setItem('monthlyData', JSON.stringify(allData));

    const verify = localStorage.getItem('monthlyData');
    const verifyData = JSON.parse(verify);
    log('After copy - target projects:', verifyData.monthlyData[currentPeriod]?.projects?.length || 0);
    log('After copy - target employees:', verifyData.monthlyData[currentPeriod]?.employees?.length || 0);

    log('Data copied from ' + sourcePeriod + ' to ' + currentPeriod);
    closeSeedModal();

    setTimeout(() => {
        log('Dispatching periodChanged event');
        window.dispatchEvent(new CustomEvent('periodChanged'));
    }, 100);
}

function showConfirmDialog(sourcePeriod, targetPeriod) {
    const [sourceYear, sourceMonth] = sourcePeriod.split('-');
    const [targetYear, targetMonth] = targetPeriod.split('-');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sourceMonthName = monthNames[parseInt(sourceMonth) - 1];
    const targetMonthName = monthNames[parseInt(targetMonth) - 1];

    const message = `Copy data from ${sourceMonthName} ${sourceYear} to ${targetMonthName} ${targetYear}?`;

    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'confirm-dialog';
    confirmDiv.style.cssText =
        'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:3000;display:flex;align-items:center;justify-content:center;';
    confirmDiv.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;text-align:center;max-width:400px;">
            <p style="font-size:18px;margin-bottom:20px;font-weight:bold;">${message}</p>
            <div style="display:flex;gap:15px;justify-content:center;">
                <button id="confirm-yes" style="background:#27ae60;color:white;padding:12px 30px;border:none;border-radius:8px;cursor:pointer;font-size:16px;">Yes</button>
                <button id="confirm-cancel" style="background:#95a5a6;color:white;padding:12px 30px;border:none;border-radius:8px;cursor:pointer;font-size:16px;">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDiv);

    confirmDiv.querySelector('#confirm-yes').addEventListener('click', () => {
        log('Confirm Yes clicked');
        copyDataFromPeriod(sourcePeriod);
        confirmDiv.remove();
    });

    confirmDiv.querySelector('#confirm-cancel').addEventListener('click', () => {
        log('Confirm Cancel clicked');
        confirmDiv.remove();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            confirmDiv.remove();
        }
    });
}

export { initSeedData };
