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
        processDataFromCSV(data);
        // Count the number of rows (excluding the header)
        const rows = data.split('\n');
        let numRows = rows.length; // Exclude the header row directly
        // Subtract 2 from numRows to adjust the number of segments
        numRows -= 2;
        // Set the number of layers to the number of rows
        document.getElementById('numLayers').value = numRows;
        // Set the number of segments to 1
        document.getElementById('num_seg').value = 1;
        document.getElementById('uploadStatus').innerHTML = "File uploaded successfully!";
    };
    reader.onerror = function() {
        console.error("Error reading file");
        document.getElementById('uploadStatus').innerHTML = "Error reading file.";
    };
    reader.readAsText(file);
}


function processDataFromCSV(csvData) {
    // Split the CSV data by newline characters to get rows
    const rows = csvData.split('\n');
    
    // Extract data starting from the second row (index 1)
    for (let i = 1; i < rows.length; i++) { // Iterate until the last row
        const row = rows[i].trim(); // Remove leading/trailing whitespace
        const nextRow = rows[i + 1]?.trim(); // Next row for calculating height
        if (row) {
            // Split row and nextRow by comma to get individual values
            const values = row.split(',');
            const nextValues = nextRow?.split(',');
            // Extract values from columns A, B, C, and D
            const Z = parseFloat(values[0]); // Column A for Z value
            let nextZ;
            if (i === rows.length - 1) { // If it's the last row
                nextZ = parseFloat(rows[1].split(',')[1]); // Take the first Z value for the last nextZ
            } else {
                nextZ = parseFloat(nextValues[0]); // Z value of next row
            }
            const cohesion = parseFloat(values[1]); // Column B
            const frictionAngle = parseFloat(values[2]); // Column C
            const unitWeight = parseFloat(values[3]); // Column D
            // Calculate layer height as the difference between subsequent Z values
            const height = (nextZ - Z).toFixed(2);

            // Create input fields for layer data
            const zInput = document.createElement("input");
            zInput.type = "number";
            zInput.id = "Z_" + i;
            zInput.name = "Layer_Height_" + i;
            zInput.min = "0";
            zInput.placeholder = "e.g. 3 m";
            zInput.step = "0.5";
            zInput.value = height; // Set calculated height

            const cInput = document.createElement("input");
            cInput.type = "number";
            cInput.id = "c_" + i;
            cInput.name = "Cohesion_" + i;
            cInput.min = "0";
            cInput.placeholder = "e.g. 20 kPa";
            cInput.step = "5";
            cInput.value = cohesion; // Set value from CSV data

            const phiInput = document.createElement("input");
            phiInput.type = "number";
            phiInput.id = "φ_" + i;
            phiInput.name = "Friction_angle_" + i;
            phiInput.min = "0";
            phiInput.placeholder = "e.g. 30 °";
            phiInput.step = "5";
            phiInput.value = frictionAngle; // Set value from CSV data

            const gammaInput = document.createElement("input");
            gammaInput.type = "number";
            gammaInput.id = "γ_" + i;
            gammaInput.name = "Unit_Weight_" + i;
            gammaInput.min = "0";
            gammaInput.placeholder = "e.g. 20 kN/m³";
            gammaInput.step = "5";
            gammaInput.value = unitWeight; // Set value from CSV data

            // Append input fields to the table row
            const tableBody = document.getElementById("layersTableBody");
            const newRow = document.createElement("tr");
            newRow.appendChild(createCell(zInput));
            newRow.appendChild(createCell(cInput));
            newRow.appendChild(createCell(phiInput));
            newRow.appendChild(createCell(gammaInput));
            tableBody.appendChild(newRow);
        }
    }
}





function createCell(element) {
    const cell = document.createElement("td");
    cell.appendChild(element);
    return cell;
}
