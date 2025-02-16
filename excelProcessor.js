(function() {
  // Global variables (local to the IIFE)
  let isCsvUpload = false; // Global flag
  let globalDataset = [];  // This will store the entire dataset from the CSV
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
      processDataFromCSV(data); // Process CSV data
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
      // Process and round values
      const values = row.split(',').map(value => {
        const floatValue = parseFloat(value.trim());
        return !isNaN(floatValue) ? parseFloat(floatValue.toFixed(1)) : value.trim();
      });
      const hasMissingData = values.some(value => value === "");
      if (hasMissingData) {
        // Save the index (1-based for user readability)
        rowsWithMissingData.push(index + 1);
      }
      // Push every row into globalDataset, including those with missing data
      globalDataset.push(values);
    });

    if (rowsWithMissingData.length > 0) {
      console.log(`Missing data found in rows: ${rowsWithMissingData.join(", ")}.`);
      document.getElementById('uploadStatus').innerHTML = `Missing data found in rows: ${rowsWithMissingData.join(", ")}. Please correct the data.`;
      displayMissingDataRows(rowsWithMissingData);
    } else {
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
    const headings = [
      "Row with missing data", "Δz (m)", "Cohesion, c [kPa]",
      "Friction angle, φ [°]", "Unit weight, γ [kN/m³]", "SBTn (Robertson 1990)"
    ];
    const headingsRow = document.createElement('tr');
    headings.forEach(heading => {
      const th = document.createElement('th');
      th.textContent = heading;
      headingsRow.appendChild(th);
    });
    thead.appendChild(headingsRow);
    table.appendChild(thead);

    // Display input fields for rows with missing data
    rowsWithMissingData.forEach(rowIndex => {
      const row = globalDataset[rowIndex - 2]; // Adjust because globalDataset excludes header
      const tr = document.createElement('tr');

      // Row number header
      const rowHeaderCell = document.createElement('th');
      rowHeaderCell.textContent = rowIndex;
      tr.appendChild(rowHeaderCell);

      row.forEach((value, columnIndex) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.dataset.rowIndex = rowIndex - 1; // Adjusted for globalDataset index
        input.dataset.columnIndex = columnIndex;
        td.appendChild(input);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    missingDataSection.appendChild(table);

    // Add a save button for corrections
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Corrections';
    createSBTReferenceTable();
    saveButton.onclick = saveAllCorrections;
    missingDataSection.appendChild(saveButton);
  }

  function checkAndProcessData() {
    if (globalDataset.length > 0) {
      finalizeDataProcessing(); // Process the data if ready
    } else {
      alert('Please complete all necessary corrections before proceeding.');
    }
  }

  function saveAllCorrections() {
    const inputs = document.querySelectorAll('#missingDataSection input');
    inputs.forEach((input) => {
      const rowIndex = parseInt(input.dataset.rowIndex - 1, 10);
      const columnIndex = parseInt(input.dataset.columnIndex, 10);
      let updatedValue = input.value.trim();
      // Convert numeric values if applicable
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
    document.getElementById('missingDataSection').innerHTML = ''; // Clear corrections area
    document.getElementById('uploadStatus').innerHTML = 'Corrections saved successfully.';
    console.log("Updated globalDataset after corrections:");
    checkAndProcessData();
  }

  function finalizeDataProcessing() {
    // Calculate depth differences for all rows except the last one
    for (let i = 0; i < globalDataset.length - 1; i++) {
      const currentZ = parseFloat(globalDataset[i][0]);
      const nextZ = parseFloat(globalDataset[i + 1][0]);
      const depthDifference = (nextZ - currentZ).toFixed(2);
      globalDataset[i][0] = depthDifference;
    }
    // For the last row, copy the previous depth difference
    if (globalDataset.length > 1) {
      globalDataset[globalDataset.length - 1][0] = globalDataset[globalDataset.length - 2][0];
    }
    // Update UI elements with processed data
    let numLayers = globalDataset.length;
    document.getElementById('numLayers').value = numLayers;
    document.getElementById('num_seg').value = 1; // Example fixed value
    populateTableFromDataset();
  }

  function populateTableFromDataset() {
    const tableBody = document.getElementById("layersTableBody");
    tableBody.innerHTML = ""; // Clear existing rows
    globalDataset.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      // Process only the first 4 values (Δz, c, φ, γ)
      row.slice(0, 4).forEach((value, columnIndex) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.value = value;
        // Set IDs to match the expected pattern by your Python script
        switch (columnIndex) {
          case 0:
            input.id = `Z_${rowIndex + 1}`;
            break;
          case 1:
            input.id = `c_${rowIndex + 1}`;
            break;
          case 2:
            input.id = `φ_${rowIndex + 1}`;
            break;
          case 3:
            input.id = `γ_${rowIndex + 1}`;
            break;
        }
        input.name = input.id;
        input.className = "form-control";
        td.appendChild(input);
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function createSBTReferenceTable() {
    const referenceSection = document.getElementById('sbtReferenceSection');
    referenceSection.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'reference-table';
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
      headerCell.innerHTML = headerText;
      headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
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
    referenceSection.appendChild(table);
  }
  
  function clearAll() {
    document.getElementById("numLayers").value = "";
    clearLayerData();
  }
  function clearLayerData() {
    const tableBody = document.getElementById("layersTableBody");
    tableBody.innerHTML = ""; // Clear existing rows
  }

  // Expose functions to the global scope:
  window.handleCSVFileUpload = handleCSVFileUpload;
  window.processDataFromCSV = processDataFromCSV;
  window.displayMissingDataRows = displayMissingDataRows;
  window.checkAndProcessData = checkAndProcessData;
  window.saveAllCorrections = saveAllCorrections;
  window.finalizeDataProcessing = finalizeDataProcessing;
  window.populateTableFromDataset = populateTableFromDataset;
  window.createSBTReferenceTable = createSBTReferenceTable;
  window.clearAll = clearAll;
  window.clearLayerData = clearLayerData;

  // Define and expose generateLayerRows so inline onchange works.
  function generateLayerRows() {
    const numLayers = parseInt(document.getElementById("numLayers").value, 10);
    const tableBody = document.getElementById("layersTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    for (let i = 0; i < numLayers; i++) {
      const rowIndex = i + 1; // 1-based index
      const tr = document.createElement("tr");

      // Δz input cell
      const zCell = document.createElement("td");
      zCell.innerHTML = `<input type="number" id="Z_${rowIndex}" name="Layer_Height_${rowIndex}" min="0" placeholder="e.g. 3 m" step="0.5">`;
      tr.appendChild(zCell);

      // Cohesion input cell
      const cCell = document.createElement("td");
      cCell.innerHTML = `<input type="number" id="c_${rowIndex}" name="Cohesion_${rowIndex}" min="0" placeholder="e.g. 20 kPa" step="5">`;
      tr.appendChild(cCell);

      // Friction angle input cell
      const phiCell = document.createElement("td");
      phiCell.innerHTML = `<input type="number" id="φ_${rowIndex}" name="Friction_angle_${rowIndex}" min="0" placeholder="e.g. 30 °" step="5">`;
      tr.appendChild(phiCell);

      // Unit weight input cell
      const gammaCell = document.createElement("td");
      gammaCell.innerHTML = `<input type="number" id="γ_${rowIndex}" name="Unit_Weight_${rowIndex}" min="0" placeholder="e.g. 20 kN/m³" step="5">`;
      tr.appendChild(gammaCell);

      tableBody.appendChild(tr);
    }
  }
  window.generateLayerRows = generateLayerRows;
})();
