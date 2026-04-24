import { $, log, generateId, formatCurrency, escapeHtml } from './utils.js';

const STORAGE_KEY = 'monthlyData';

export function getCurrentPeriod() {
    const monthSelect = $('#month-select');
    const yearSelect = $('#year-select');
    const month = monthSelect ? monthSelect.value : null;
    const year = yearSelect ? yearSelect.value : null;

    if (!month || !year) {
        return new Date().getFullYear() + '-' + (new Date().getMonth() + 1);
    }
    return `${year}-${month}`;
}

export function getMonthData() {
    const data = loadData();
    const period = getCurrentPeriod();
    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
        saveData(data);
    }
    return data.monthlyData[period];
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return { monthlyData: {} };
        }
    }
    return { monthlyData: {} };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addProject(projectData) {
    log('addProject called');
    const data = loadData();
    const period = getCurrentPeriod();
    log('Period: ' + period);

    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
    }

    const newProject = {
        id: generateId(),
        companyName: projectData.companyName,
        projectName: projectData.projectName,
        budget: parseFloat(projectData.budget) || 0,
        employeeCapacity: parseInt(projectData.employeeCapacity) || 0,
        employees: [],
        estimatedIncome: 0,
    };

    data.monthlyData[period].projects.push(newProject);
    saveData(data);

    return newProject;
}

export function deleteProject(id) {
    const data = loadData();
    const period = getCurrentPeriod();

    if (data.monthlyData[period]) {
        data.monthlyData[period].projects = data.monthlyData[period].projects.filter((p) => p.id !== id);
        saveData(data);
    }
}

export function updateProject(id, projectData) {
    const data = loadData();
    const period = getCurrentPeriod();

    if (data.monthlyData[period]) {
        const index = data.monthlyData[period].projects.findIndex((p) => p.id === id);
        if (index !== -1) {
            data.monthlyData[period].projects[index] = {
                ...data.monthlyData[period].projects[index],
                companyName: projectData.companyName,
                projectName: projectData.projectName,
                budget: parseFloat(projectData.budget) || 0,
                employeeCapacity: parseInt(projectData.employeeCapacity) || 0,
            };
            saveData(data);
            return data.monthlyData[period].projects[index];
        }
    }
    return null;
}

export function getProjects() {
    const period = getCurrentPeriod();
    log('getProjects called for period: ' + period);
    const monthData = getMonthData();
    return [...monthData.projects];
}

export function addEmployee(employeeData) {
    log('addEmployee called with: ' + JSON.stringify(employeeData));
    const data = loadData();
    const period = getCurrentPeriod();
    log('Period: ' + period);

    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
    }

    const newEmployee = {
        id: generateId(),
        name: employeeData.name,
        surname: employeeData.surname,
        age: parseInt(employeeData.age) || 0,
        position: employeeData.position,
        salary: parseFloat(employeeData.salary) || 0,
        capacity: parseFloat(employeeData.capacity) || 1,
        fit: parseFloat(employeeData.fit) || 1,
        vacationDays: parseInt(employeeData.vacationDays) || 0,
        project: employeeData.project || '',
        assignedCapacity: 0,
        estimatedPayment: 0,
        estimatedIncome: 0,
    };

    data.monthlyData[period].employees.push(newEmployee);
    saveData(data);
    log(`Employee saved with id: ${newEmployee.id}, total employees: ${data.monthlyData[period].employees.length}`);

    return newEmployee;
}

export function deleteEmployee(id) {
    const data = loadData();
    const period = getCurrentPeriod();

    if (data.monthlyData[period]) {
        data.monthlyData[period].employees = data.monthlyData[period].employees.filter((e) => e.id !== id);
        saveData(data);
    }
}

export function updateEmployee(id, employeeData) {
    const data = loadData();
    const period = getCurrentPeriod();

    if (data.monthlyData[period]) {
        const index = data.monthlyData[period].employees.findIndex((e) => e.id === id);
        if (index !== -1) {
            data.monthlyData[period].employees[index] = {
                ...data.monthlyData[period].employees[index],
                name: employeeData.name,
                surname: employeeData.surname,
                age: parseInt(employeeData.age) || 0,
                position: employeeData.position,
                salary: parseFloat(employeeData.salary) || 0,
                capacity: parseFloat(employeeData.capacity) || 1,
                fit: parseFloat(employeeData.fit) || 1,
                vacationDays: parseInt(employeeData.vacationDays) || 0,
                project: employeeData.project || '',
                assignedCapacity: parseFloat(employeeData.assignedCapacity) || 0,
            };
            saveData(data);
            return data.monthlyData[period].employees[index];
        }
    }
    return null;
}

export function getEmployees() {
    const period = getCurrentPeriod();
    log('getEmployees called for period: ' + period);
    const monthData = getMonthData();
    return [...monthData.employees];
}

export { formatCurrency, escapeHtml };
