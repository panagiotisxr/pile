let isCsvUpload = false; // Global flag
let globalDataset = []; // This will store the entire dataset from the CSV
let currentEditingRow = null; // To keep track of the row being edited

// This function is triggered when the user uploads a file
function handleCSVFileUpload() {
    console.log("handleCSVFileUpload function called");
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file first!');
        return false;
    }

    console.log("File selected, starting to read...");

    const reader = new FileReader();
    reader.onload = function(e) {
        console.log("File read successfully, processing data...");
        const data = e.target.result;
        processDataFromCSV(data); // Call processDataFromCSV here
    };
    reader.onerror = function() {
        console.error("Error reading file");
        document.getElementById('uploadStatus').innerHTML = "Error reading file.";
    };
    reader.readAsText(file);
}

function processDataFromCSV(csvData) {
    const rows = csvData.split('\n').filter(row => row.trim());
    globalDataset = []; // Reset for new CSV data
    let rowsWithMissingData = []; // Track rows with missing data

    rows.forEach((row, index) => {
        // Skip the header row
        if (index === 0) return;

        const values = row.split(',');
        const hasMissingData = values.some(value => value.trim() === "");
        if (hasMissingData) {
            // Save the index (1-based for user readability) of rows with missing data
            rowsWithMissingData.push(index + 1);
        }
        // Push every row into globalDataset, including those with missing data for now
        globalDataset.push(values);
    });

    if (rowsWithMissingData.length > 0) {
        // If any rows with missing data are found, handle them
        console.log(`Missing data found in rows: ${rowsWithMissingData.join(", ")}.`);
        document.getElementById('uploadStatus').innerHTML = `Missing data found in rows: ${rowsWithMissingData.join(", ")}. Please correct the data.`;
        displayMissingDataRows(rowsWithMissingData);
    } else {
        // If no missing data, proceed to render the table
        checkAndProcessData();
    }
}


function displayMissingDataRows(rowsWithMissingData) {
    const missingDataSection = document.getElementById('missingDataSection');
    missingDataSection.innerHTML = ''; // Clear previous content

    // Create a table for headings and missing data inputs
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create headings for soil properties including SBTn
    const headings = ["Row with missing data", "Δz (m)", "Cohesion, c [kPa]", "Friction angle, φ [°]", "Unit weight, γ [kN/m³]", "SBTn (Robertson 1990)"];
    const headingsRow = document.createElement('tr');
    headings.forEach(heading => {
        const th = document.createElement('th');
        th.textContent = heading;
        headingsRow.appendChild(th);
    });
    thead.appendChild(headingsRow);
    table.appendChild(thead); // Append the headings row to the table

    // Now, proceed to display input fields for rows with missing data
    rowsWithMissingData.forEach(rowIndex => {
        const row = globalDataset[rowIndex - 2]; // Adjusting index because globalDataset doesn't include header row
        const tr = document.createElement('tr');

        // Add a header cell at the start of the row for the row number with missing data
        const rowHeaderCell = document.createElement('th');
        rowHeaderCell.textContent = rowIndex;
        tr.appendChild(rowHeaderCell);

        row.forEach((value, columnIndex) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.dataset.rowIndex = rowIndex - 1;
            input.dataset.columnIndex = columnIndex;
            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody); // Append tbody to table
    missingDataSection.appendChild(table); // Append table to the missing data section

    // Add a save button to submit corrections
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Corrections';
    createSBTReferenceTable();
    saveButton.onclick = saveAllCorrections;
    missingDataSection.appendChild(saveButton);
}

function checkAndProcessData() {
    // Example condition: Check if globalDataset is populated and corrections are made
    if (globalDataset.length > 0) {
        finalizeDataProcessing(); // Process the data if conditions are met
    } else {
        // Inform the user or take other actions if conditions are not met
        alert('Please complete all necessary corrections before proceeding.');
    }
}


// Ensure to call checkAndProcessData at the end of your saveAllCorrections function:
function saveAllCorrections() {
    const inputs = document.querySelectorAll('#missingDataSection input');
    inputs.forEach((input) => {
        const rowIndex = parseInt(input.dataset.rowIndex-1, 10);
        const columnIndex = parseInt(input.dataset.columnIndex, 10);
        let updatedValue = input.value.trim();

        // Convert numeric values from string to number if necessary
        if (!isNaN(parseFloat(updatedValue))) {
            updatedValue = parseFloat(updatedValue);
        }

        if (globalDataset[rowIndex] && globalDataset[rowIndex][columnIndex] !== undefined) {
            globalDataset[rowIndex][columnIndex] = updatedValue;
        }
    });
    const referenceSection = document.getElementById('sbtReferenceSection');
    if (referenceSection) {
        referenceSection.innerHTML = '';
    }
    document.getElementById('missingDataSection').innerHTML = ''; // Clear the section
    document.getElementById('uploadStatus').innerHTML = 'Corrections saved successfully.';

    // Log the updated globalDataset to the console for examination
    console.log("Updated globalDataset after corrections:");

    // Check if data is ready for the final processing step
    checkAndProcessData();
}

function finalizeDataProcessing() {
    // Calculate depth differences for all layers except the last one
    for (let i = 0; i < globalDataset.length - 1; i++) {
        // Assuming depth (Z) is the first column in each row of globalDataset
        const currentZ = parseFloat(globalDataset[i][0]);
        const nextZ = parseFloat(globalDataset[i + 1][0]);
        // Calculate depth difference and update the current row's depth value
        const depthDifference = (nextZ - currentZ).toFixed(2); // Keep two decimal places
        globalDataset[i][0] = depthDifference;
    }

    // Handle the last row's depth
    // Example: Use the same depth difference as the second-to-last row
    // You might need to adjust this logic based on your specific requirements
    if (globalDataset.length > 1) { // Check to ensure there's more than one row
        globalDataset[globalDataset.length - 1][0] = globalDataset[globalDataset.length - 2][0];
    }

    // Now that globalDataset has been updated, proceed with other processing
    // For example, update the UI or perform further calculations

    // Update the number of layers and segments based on the dataset
    let numLayers = globalDataset.length;
    document.getElementById('numLayers').value = numLayers;
    document.getElementById('num_seg').value = 1; // Example fixed value

    // Optionally, update the UI to reflect the processed data
    // console.log('Data processing complete, updated dataset:', globalDataset);
    // renderTable(); // Refresh the table display based on the updated globalDataset
    populateTableFromDataset();
}

function populateTableFromDataset() {
    const tableBody = document.getElementById("layersTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    // Iterate over each row in the globalDataset
    globalDataset.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        // Process only the first 4 values in each row as per the Python script requirement
        row.slice(0, 4).forEach((value, columnIndex) => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.value = value; // Set the value of the input to the data from globalDataset
            // Creating IDs based on the columnIndex to match the expected pattern by Python script
            switch (columnIndex) {
                case 0: // Δz
                    input.id = `Z_${rowIndex + 1}`;
                    break;
                case 1: // Cohesion
                    input.id = `c_${rowIndex + 1}`;
                    break;
                case 2: // Friction angle
                    input.id = `φ_${rowIndex + 1}`;
                    break;
                case 3: // Unit weight
                    input.id = `γ_${rowIndex + 1}`;
                    break;
            }
            input.name = input.id; // Use ID as the name for form submission if necessary
            input.className = "form-control"; // Assuming Bootstrap for styling

            td.appendChild(input);
            tr.appendChild(td);
        });

        tableBody.appendChild(tr); // Add the completed row to the table body
    });
}


function createSBTReferenceTable() {
    const referenceSection = document.getElementById('sbtReferenceSection');
    referenceSection.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'reference-table'; // Add your own styling class here

    // Create the header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        'SBTn Zone',
        'Common SBT Description',
        'USCS Designation',
        'c min (kPa)',
        'c max (kPa)',
        'φ min (°)',
        'φ max (°)',
        'γ min (kN/m³)',
        'γ max (kN/m³)'
    ];

    headers.forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.innerHTML = headerText; // We can use innerHTML since we control the content
        headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create the body of the table
    const tbody = document.createElement('tbody');
    const sbtValues = [
        { SBT: '1', Descr: 'Sensitive fine grained', USCS: 'ML or CL - (ML)', cMin: '0', cMax: '5', phiMin: '26', phiMax: '30', gammaMin: '15', gammaMax: '19' },
        { SBT: '1', Descr: 'Sensitive fine grained', USCS: 'ML or CL - (CL)', cMin: '10', cMax: '20', phiMin: '15', phiMax: '27', gammaMin: '16', gammaMax: '20' },
        { SBT: '2', Descr: 'Clay - Organic soil', USCS: 'OL', cMin: '0', cMax: '5', phiMin: '0', phiMax: '5', gammaMin: '10', gammaMax: '15' },
        { SBT: '3', Descr: 'Clays: clay to silty clay', USCS: 'CL', cMin: '10', cMax: '20', phiMin: '15', phiMax: '27', gammaMin: '16', gammaMax: '20' },
        { SBT: '4', Descr: 'Silt mixtures: Clayey silt and silty clay', USCS: 'ML or CL - (ML)', cMin: '0', cMax: '5', phiMin: '26', phiMax: '30', gammaMin: '15', gammaMax: '19' },
        { SBT: '4', Descr: 'Silt mixtures: Clayey silt and silty clay', USCS: 'ML or CL - (CL)', cMin: '10', cMax: '20', phiMin: '15', phiMax: '27', gammaMin: '16', gammaMax: '20' },
        { SBT: '5', Descr: 'Sand mixtures: Silty sand to sandy silt', USCS: 'SM', cMin: '0', cMax: '15', phiMin: '29', phiMax: '34', gammaMin: '18', gammaMax: '21' },
        { SBT: '6', Descr: 'Sands: clean sands to silty sands', USCS: 'SP-SM - SP', cMin: '0', cMax: '0', phiMin: '33', phiMax: '38', gammaMin: '19', gammaMax: '22' },
        { SBT: '6', Descr: 'Sands: clean sands to silty sands', USCS: 'SP-SM - SM', cMin: '0', cMax: '15', phiMin: '29', phiMax: '34', gammaMin: '18', gammaMax: '21' },
        { SBT: '7', Descr: 'Dense sand to gravelly sand', USCS: 'GW-GP - GW', cMin: '0', cMax: '0', phiMin: '38', phiMax: '45', gammaMin: '20', gammaMax: '23' },
        { SBT: '7', Descr: 'Dense sand to gravelly sand', USCS: 'GW-GP - GP', cMin: '0', cMax: '0', phiMin: '36', phiMax: '44', gammaMin: '20', gammaMax: '23' },
        { SBT: '8', Descr: 'Stiff sand to clayey sand - Overconsolidated or cemented', USCS: 'SC', cMin: '0', cMax: '20', phiMin: '27', phiMax: '32', gammaMin: '18', gammaMax: '21' },
        { SBT: '9', Descr: 'Stiff fine grained - Overconsolidated or cemented', USCS: 'CL-CH - CL', cMin: '10', cMax: '20', phiMin: '15', phiMax: '27', gammaMin: '16', gammaMax: '20' },
        { SBT: '9', Descr: 'Stiff fine grained - Overconsolidated or cemented', USCS: 'CL-CH - CH', cMin: '20', cMax: '40', phiMin: '9', phiMax: '15', gammaMin: '16', gammaMax: '20' },

            ];

    sbtValues.forEach(sbtValue => {
        const row = document.createElement('tr');
        Object.values(sbtValue).forEach(val => {
            const cell = document.createElement('td');
            cell.textContent = val;
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    referenceSection.appendChild(table); // Append the table to the container
}

function clearAll() {
    document.getElementById("numLayers").value = "";
    clearLayerData();
}
function clearLayerData() {
    const tableBody = document.getElementById("layersTableBody");
    tableBody.innerHTML = ""; // Clear existing rows
}
