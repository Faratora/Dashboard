const fs = require('fs');

let content = fs.readFileSync('JS/module/modal.js', 'utf8');

// Add assignProjectCapacity variable declaration
let old = "const assignPredictedCapacity = $('#assign-predicted-capacity');\n    const assignCalculationsContainer = $('#assign-calculations-container');";
let newS = "const assignPredictedCapacity = $('#assign-predicted-capacity');\n    const assignProjectCapacity = $('#assign-project-capacity');\n    const assignCalculationsContainer = $('#assign-calculations-container');";
content = content.replace(old, newS);

// Update updateAssignCalculations to use assignProjectCapacity
old = "if (assignPredictedCapacity) assignPredictedCapacity.textContent = predictedTotal.toFixed(2);\n        if (assignAvailableCapacity) {\n            const available = Math.max(0, 1.5 - currentTotalCapacity);\n            assignAvailableCapacity.textContent = `Available: ${available.toFixed(2)}`;\n        }\n\n        // Show sliders";
newS = "if (assignPredictedCapacity) assignPredictedCapacity.textContent = predictedTotal.toFixed(2);\n        \n        // Update project capacity display\n        if (assignProjectCapacity && assignProjectSelect && assignProjectSelect.value) {\n            const projects = getProjects();\n            const project = projects.find((p) => p.projectName === assignProjectSelect.value);\n            if (project) {\n                const projectCapacity = project.employeeCapacity || 0;\n                assignProjectCapacity.textContent = `${projectCapacity.toFixed(2)} / ${projectCapacity.toFixed(0)}`;\n            } else {\n                assignProjectCapacity.textContent = `0.00 / 0`;\n            }\n        }\n        \n        // Show sliders";
content = content.replace(old, newS);

// Update openAssignModal to set assignCurrentCapacity
old = "if (assignEmployeeName) {\n            assignEmployeeName.textContent = `${currentAssignEmployee.name} ${currentAssignEmployee.surname}`;\n        }\n\n\n\n        if (assignCapacitySlider) {";
newS = "if (assignEmployeeName) {\n            assignEmployeeName.textContent = `${currentAssignEmployee.name} ${currentAssignEmployee.surname}`;\n        }\n\n        if (assignCurrentCapacity) {\n            assignCurrentCapacity.textContent = currentTotalCapacity.toFixed(2);\n        }\n\n        if (assignCapacitySlider) {";
content = content.replace(old, newS);

fs.writeFileSync('JS/module/modal.js', content, 'utf8');
console.log('Done');
