import { $, log, generateId, formatCurrency, escapeHtml } from './utils.js';

const STORAGE_KEY = 'monthlyData';


function getWeekdaysInMonth() {
    const period = getCurrentPeriod();
    const [year, month] = period.split('-').map(Number);
    
    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let weekdays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        date.setDate(day);
        const dayOfWeek = date.getDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            weekdays++;
        }
    }
    return weekdays;
}


function getWeekdayVacationDays(vacationDays, year, month) {
    if (!Array.isArray(vacationDays) || vacationDays.length === 0) {
        return 0;
    }
    let weekdayVacations = 0;
    for (const vacDay of vacationDays) {
        const vacDate = new Date(vacDay);
        
        if (vacDate.getFullYear() === year && vacDate.getMonth() + 1 === month) {
            const dayOfWeek = vacDate.getDay();
            
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdayVacations++;
            }
        }
    }
    return weekdayVacations;
}

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
    
    const project = data.monthlyData[period].projects.find((p) => p.id === id);
    const projectName = project ? project.projectName : null;
    
    data.monthlyData[period].projects = data.monthlyData[period].projects.filter((p) => p.id !== id);
    
    if (projectName) {
        data.monthlyData[period].employees = data.monthlyData[period].employees.filter((e) => e.project !== projectName);
    }
    saveData(data);
}

export function updateProject(id, projectData) {
    const data = loadData();
    const period = getCurrentPeriod();
    const project = data.monthlyData[period].projects.find((p) => p.id === id);
    if (project) {
        Object.assign(project, projectData);
        saveData(data);
    }
}

export function getProjects() {
    return getMonthData().projects;
}

export function addEmployee(employeeData) {
    log('addEmployee called');
    const data = loadData();
    const period = getCurrentPeriod();

    if (!data.monthlyData[period]) {
        data.monthlyData[period] = { employees: [], projects: [] };
    }

    const newEmployee = {
        id: generateId(),
        name: employeeData.name,
        surname: employeeData.surname,
        age: parseInt(employeeData.age),
        birthDate: employeeData.birthDate,
        position: employeeData.position,
        salary: parseFloat(employeeData.salary) || 0,
        capacity: 1,
        fit: 1,
        vacationDays: [],
        project: employeeData.project || '',
        assignedCapacity: 0,
    };

    data.monthlyData[period].employees.push(newEmployee);
    saveData(data);

    return newEmployee;
}

export function deleteEmployee(id) {
    const data = loadData();
    const period = getCurrentPeriod();
    data.monthlyData[period].employees = data.monthlyData[period].employees.filter((e) => e.id !== id);
    saveData(data);
}

export function updateEmployee(id, employeeData) {
    const data = loadData();
    const period = getCurrentPeriod();
    const employeeIndex = data.monthlyData[period].employees.findIndex((e) => e.id === id);
    if (employeeIndex !== -1) {
        Object.assign(data.monthlyData[period].employees[employeeIndex], employeeData);
        saveData(data);
    }
}


function calculateAssignedCapacity(employee, currentYear, currentMonth, weekdaysInMonth) {
   
    if (!employee.project) {
        return 0;
    }

    const capacity = employee.capacity || 1;
    const fit = employee.fit || 1;
    const weekdayVacations = getWeekdayVacationDays(employee.vacationDays || [], currentYear, currentMonth);
    const vacationCoefficient = weekdaysInMonth > 0
        ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth
        : 0;

   
    return capacity * fit * vacationCoefficient;
}

export function getEmployees() {
    const period = getCurrentPeriod();
    const monthData = getMonthData();
    const employees = [...monthData.employees];

    
    const projects = getProjects();
    const [currentYear, currentMonth] = period.split('-').map(Number);
    const weekdaysInMonth = getWeekdaysInMonth();

    return employees.map((emp) => {
       
        const assignedCapacity = calculateAssignedCapacity(emp, currentYear, currentMonth, weekdaysInMonth);
        
        let age = emp.age;
        if (emp.birthDate) {
            const birth = new Date(emp.birthDate);
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
        }

        if (!emp.project) {
            
            const benchCost = (emp.salary || 0) * 0.5;
            
            const benchProfit = 0 - benchCost;
            return { ...emp, age, assignedCapacity: 0, estimatedIncome: 0, estimatedPayment: benchCost, profit: benchProfit };
        }

        const project = projects.find((p) => p.projectName === emp.project);
        if (!project) {
            
            const benchCost = (emp.salary || 0) * 0.5;
            const benchProfit = 0 - benchCost;
            return { ...emp, age, assignedCapacity, estimatedIncome: 0, estimatedPayment: benchCost, profit: benchProfit };
        }

        
        const projectEmployees = employees.filter((e) => e.project === emp.project);
        const totalEffectiveCapacity = projectEmployees.reduce((sum, e) => {
            const capacity = e.capacity || 1;
            const fit = e.fit || 1;
            const weekdayVacations = getWeekdayVacationDays(e.vacationDays, currentYear, currentMonth);
            const vacationCoefficient = weekdaysInMonth > 0 
                ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
                : 0;
            return sum + capacity * fit * vacationCoefficient;
        }, 0);

        
        const projectCapacity = project.employeeCapacity || 0;
        const capacityForRevenue = Math.max(projectCapacity, totalEffectiveCapacity);

        
        if (capacityForRevenue === 0) {
            
            const empCapacity = emp.capacity || 1;
            const cost = (emp.salary || 0) * Math.max(0.5, empCapacity);
           
            const profit = 0 - cost;
            return { ...emp, age, assignedCapacity, estimatedIncome: 0, estimatedPayment: cost, profit };
        }

        
        const revenuePerEffectiveCapacity = project.budget / capacityForRevenue;

        
        const empCapacity = emp.capacity || 1;
        const empFit = emp.fit || 1;
        const empWeekdayVacations = getWeekdayVacationDays(emp.vacationDays, currentYear, currentMonth);
        const empVacationCoefficient = weekdaysInMonth > 0
            ? (weekdaysInMonth - empWeekdayVacations) / weekdaysInMonth
            : 0;
        const empEffectiveCapacity = empCapacity * empFit * empVacationCoefficient;

        
        const estimatedIncome = revenuePerEffectiveCapacity * empEffectiveCapacity;
        
        
        const cost = (emp.salary || 0) * Math.max(0.5, empCapacity);
        const estimatedPayment = cost;

        
        const profit = estimatedIncome - cost;

        return { ...emp, age, assignedCapacity, estimatedIncome, estimatedPayment, profit };
    });
}

export { formatCurrency, escapeHtml, getWeekdaysInMonth, getWeekdayVacationDays };
