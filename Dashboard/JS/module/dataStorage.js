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
                vacationDays: Array.isArray(employeeData.vacationDays) 
                    ? employeeData.vacationDays 
                    : parseInt(employeeData.vacationDays) || 0,
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
    const employees = [...monthData.employees];

    // Calculate estimatedIncome for each employee
    const projects = getProjects();

    return employees.map((emp) => {
        if (!emp.project) {
            return { ...emp, estimatedIncome: 0, estimatedPayment: emp.salary };
        }

        const project = projects.find((p) => p.projectName === emp.project);
        if (!project) {
            return { ...emp, estimatedIncome: 0, estimatedPayment: emp.salary };
        }

        // Calculate total effective capacity for the project
        const projectEmployees = employees.filter((e) => e.project === emp.project);
        const totalEffectiveCapacity = projectEmployees.reduce((sum, e) => {
            const capacity = e.capacity || 1;
            const fit = e.fit || 1;
            const vacationDaysCount = Array.isArray(e.vacationDays) ? e.vacationDays.length : (e.vacationDays || 0);
            const vacation = (20 - vacationDaysCount) / 20;
            return sum + capacity * fit * vacation;
        }, 0);

        // Capacity for revenue = max(project capacity, total effective capacity used)
        const projectCapacity = project.employeeCapacity || 0;
        const capacityForRevenue = Math.max(projectCapacity, totalEffectiveCapacity);

        // If no capacity, no revenue
        if (capacityForRevenue === 0) {
            return { ...emp, estimatedIncome: 0, estimatedPayment: emp.salary };
        }

        // Revenue per effective capacity = budget ÷ capacity for revenue
        const revenuePerEffectiveCapacity = project.budget / capacityForRevenue;

        // Calculate this employee's effective capacity
        const empCapacity = emp.capacity || 1;
        const empFit = emp.fit || 1;
        const empVacationDaysCount = Array.isArray(emp.vacationDays) ? emp.vacationDays.length : (emp.vacationDays || 0);
        const empVacation = (20 - empVacationDaysCount) / 20;
        const empEffectiveCapacity = empCapacity * empFit * empVacation;

        // Employee's revenue = revenue per effective capacity × employee's effective capacity
        const estimatedIncome = revenuePerEffectiveCapacity * empEffectiveCapacity;
        const estimatedPayment = emp.salary;

        return { ...emp, estimatedIncome, estimatedPayment };
    });
}

export { formatCurrency, escapeHtml };
