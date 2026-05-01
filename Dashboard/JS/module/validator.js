import { $, log } from './utils.js';

export function validateProject() {
    let isValid = true;
    clearValidationErrors();
    
    const projectName = $('#project-name');
    const companyName = $('#company-name');
    const projectBudget = $('#project-budget');
    const employeeCapacity = $('#employee-capacity');
    
    // Project Name: required, min 3 chars, alphanumeric
    if (!projectName || !projectName.value.trim()) {
        showFieldError(projectName, 'Project Name is required');
        isValid = false;
    } else if (projectName.value.trim().length < 3) {
        showFieldError(projectName, 'Project Name must be at least 3 characters');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s-]+$/.test(projectName.value.trim())) {
        showFieldError(projectName, 'Project Name must be alphanumeric');
        isValid = false;
    }
    
    // Company Name: required, min 2 chars, alphanumeric
    if (!companyName || !companyName.value.trim()) {
        showFieldError(companyName, 'Company Name is required');
        isValid = false;
    } else if (companyName.value.trim().length < 2) {
        showFieldError(companyName, 'Company Name must be at least 2 characters');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s-]+$/.test(companyName.value.trim())) {
        showFieldError(companyName, 'Company Name must be alphanumeric');
        isValid = false;
    }
    
    // Budget: required, positive number, 2 decimal places
    if (!projectBudget || !projectBudget.value) {
        showFieldError(projectBudget, 'Budget is required');
        isValid = false;
    } else {
        const budgetValue = parseFloat(projectBudget.value);
        if (isNaN(budgetValue) || budgetValue <= 0) {
            showFieldError(projectBudget, 'Budget must be a positive number');
            isValid = false;
        } else {
            
            const parts = projectBudget.value.split('.');
            if (parts[1] && parts[1].length > 2) {
                showFieldError(projectBudget, 'Budget must have maximum 2 decimal places');
                isValid = false;
            }
        }
    }
    
    // Employee Capacity: required, integer, minimum 1
    if (!employeeCapacity || !employeeCapacity.value) {
        showFieldError(employeeCapacity, 'Employee Capacity is required');
        isValid = false;
    } else {
        const capacityValue = parseInt(employeeCapacity.value, 10);
        if (isNaN(capacityValue) || capacityValue < 1) {
            showFieldError(employeeCapacity, 'Employee Capacity must be an integer ≥ 1');
            isValid = false;
        } else if (!Number.isInteger(parseFloat(employeeCapacity.value))) {
            showFieldError(employeeCapacity, 'Employee Capacity must be an integer');
            isValid = false;
        }
    }
    
    updateSubmitButtonState('project', isValid);
    
    if (!isValid) {
        log('Project validation failed');
    }
    
    return isValid;
}

function updateSubmitButtonState(formType, isValid) {
    const submitBtn = $('#submit-btn');
    if (submitBtn) {
        
        const projectFormFields = $('#project-form-fields');
        const employeeFormFields = $('#employee-form-fields');
        
        let isRelevant = false;
        if (formType === 'project' && projectFormFields && projectFormFields.style.display !== 'none') {
            isRelevant = true;
        } else if (formType === 'employee' && employeeFormFields && employeeFormFields.style.display !== 'none') {
            isRelevant = true;
        }
        
        if (isRelevant) {
            submitBtn.disabled = !isValid;
                        if (isValid) {
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
        }
    }
}

export function validateEmployee() {
    let isValid = true;
    clearValidationErrors();
    
    const name = $('#employee-name');
    const surname = $('#employee-surname');
    const birthDate = $('#employee-age');
    const position = $('#employee-position');
    const salary = $('#employee-salary');
    
    if (!name || !name.value.trim()) {
        showFieldError(name, 'Name is required');
        isValid = false;
    } else if (name.value.trim().length < 3) {
        showFieldError(name, 'Name must be at least 3 characters');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(name.value.trim())) {
        showFieldError(name, 'Name must contain only letters');
        isValid = false;
    }
    
    if (!surname || !surname.value.trim()) {
        showFieldError(surname, 'Surname is required');
        isValid = false;
    } else if (surname.value.trim().length < 3) {
        showFieldError(surname, 'Surname must be at least 3 characters');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(surname.value.trim())) {
        showFieldError(surname, 'Surname must contain only letters');
        isValid = false;
    }
    
    if (!birthDate || !birthDate.value) {
        showFieldError(birthDate, 'Date of Birth is required');
        isValid = false;
    } else {
        const birth = new Date(birthDate.value);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        if (age < 18) {
            showFieldError(birthDate, 'Employee must be at least 18 years old');
            isValid = false;
        }
    }
    
    if (!position || !position.value) {
        showFieldError(position, 'Position is required');
        isValid = false;
    }
    
    if (!salary || !salary.value) {
        showFieldError(salary, 'Salary is required');
        isValid = false;
    } else if (parseFloat(salary.value) < 0) {
        showFieldError(salary, 'Salary must be non-negative');
        isValid = false;
    }
    
    if (!isValid) {
        log('Employee validation failed');
    }
    
    return isValid;
}

function showFieldError(field, message) {
    if (!field) return;
    
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #cc0000; font-size: 12px; margin-top: 4px; font-weight: bold;';
    errorDiv.textContent = message;
    
    field.parentElement.appendChild(errorDiv);
    field.style.borderColor = '#cc0000';
    
    const handler = function() {
        field.style.borderColor = '#ddd';
        field.style.boxShadow = 'none';
        const error = field.parentElement.querySelector('.field-error');
        if (error) {
            error.remove();
        }
    };
    
    field.addEventListener('input', handler);
    field.addEventListener('change', handler);
}

function clearValidationErrors() {
    const errors = document.querySelectorAll('.field-error');
    errors.forEach(e => e.remove());
    
    const inputs = document.querySelectorAll('#add-project-form input, #add-project-form select');
    inputs.forEach(input => {
        input.style.borderColor = '#ddd';
    });
}

export function setupInputRestrictions() {
    
    const letterFields = [
        'project-name',
        'company-name',
        'employee-name',
        'employee-surname'
    ];
    
    letterFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            
            field.addEventListener('input', (e) => {
                const oldValue = e.target.value;
                const newValue = oldValue.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/g, '');
                if (oldValue !== newValue) {
                    e.target.value = newValue;
                }
            });
        }
    });
    
    
    const budgetField = $('#project-budget');
    if (budgetField) {
        budgetField.addEventListener('input', (e) => {
            let value = e.target.value;
            
            
            value = value.replace(/[^0-9.]/g, '');
            
           
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
           
            if (parts[1] && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            
            if (value.startsWith('-')) {
                value = value.substring(1);
            }
            
            e.target.value = value;
        });
    }
    
    
    const capacityField = $('#employee-capacity');
    if (capacityField) {
        capacityField.addEventListener('input', (e) => {
            let value = e.target.value;
            
            
            value = value.replace(/[^0-9]/g, '');
            
            
            e.target.value = value;
        });
    }
    
    setupRealTimeValidation();
}

function setupRealTimeValidation() {
    const projectFields = ['project-name', 'company-name', 'project-budget', 'employee-capacity'];
    const employeeFields = ['employee-name', 'employee-surname', 'employee-age', 'employee-position', 'employee-salary'];
    
    projectFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            field.addEventListener('input', () => validateProject());
            field.addEventListener('blur', () => validateProject());
        }
    });
    
    employeeFields.forEach(id => {
        const field = $(`#${id}`);
        if (field) {
            field.addEventListener('input', () => validateEmployee());
            field.addEventListener('blur', () => validateEmployee());
        }
    });
}