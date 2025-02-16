from js import document, window, alert 
from math import sin, tan, radians, pi, sqrt, asin

#!-- # Define a global variable to track if analysis has been run
#analysis_run = False -->

# Function to perform linear interpolation
def linear_interpolation(data, within_limits):
    interpolated_data = data.copy()
    indices_to_interpolate = [i for i, value in enumerate(within_limits) if not value]
    
    for i in indices_to_interpolate:
        # Find the closest True values before and after the current index
        prev_index = max([idx for idx in range(i, -1, -1) if within_limits[idx]], default=0)
        next_index = min([idx for idx in range(i, len(within_limits)) if within_limits[idx]], default=len(within_limits) - 1)
        
        # Perform linear interpolation
        x0, y0 = prev_index, data[prev_index]
        x1, y1 = next_index, data[next_index]
        interpolated_data[i] = y0 + (y1 - y0) * (i - x0) / (x1 - x0)

    return interpolated_data

def standard_deviation(data):
    n = len(data)
    if n < 2:
        return 0
    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / (n - 1)
    return variance ** 0.5

def median(data):
    sorted_data = sorted(data)
    n = len(sorted_data)
    if n % 2 == 0:
        return (sorted_data[n//2 - 1] + sorted_data[n//2]) / 2
    else:
        return sorted_data[n//2]
        
def load_data():
    filter_yes = document.getElementById('filterYes').checked
    filter_no = document.getElementById('filterNo').checked

    num_layers_value = document.getElementById('numLayers').value
    num_layers = int(num_layers_value) if num_layers_value else 1

    num_segments_value = document.getElementById('num_seg').value
    num_segments = int(num_segments_value) if num_segments_value else 5

    num_Subgroups_value = document.getElementById('numSubgroups').value
    num_Subgroups = int(num_Subgroups_value) if num_Subgroups_value else 5
    
    filter_cohesion = document.getElementById('filterCohesion').checked
    filter_friction_angle = document.getElementById('filterFrictionAngle').checked

    pile_data = {
        'R': float(document.getElementById('R').value) if document.getElementById('R').value else 0.5,
        'ah': float(document.getElementById('ah').value) if document.getElementById('ah').value else 0,
        'av': float(document.getElementById('av').value) if document.getElementById('av').value else 0,
        'a_i': float(document.getElementById('a_i').value) if document.getElementById('a_i').value else 1,
    }

    layer_parameters = []
    for i in range(1,num_layers+1):
        Z_id = f'Z_{i}'
        c_id = f'c_{i}'
        phi_id = f'φ_{i}'  
        gamma_id = f'γ_{i}' 
        # Get the value of c (cohesion)
        c = float(document.getElementById(c_id).value) if document.getElementById(c_id).value else 0
        # Check if c is 0, and if so, set it to a small non-zero value
        if c == 0:
            c = 0.0001
        # Get the value of φ_d (friction angle)
        phi_d = float(document.getElementById(phi_id).value) if document.getElementById(phi_id).value else 0
        # Check if φ_d is 0, and if so, set it to a small non-zero value
        if phi_d == 0:
            phi_d = 0.0001
        if phi_d > 45:
            phi_d = 45      
        # Get the value of γ (unit weight of soil)
        gamma = float(document.getElementById(gamma_id).value) if document.getElementById(gamma_id).value else 0
        # Check if γ is 0, and if so, set it to a small non-zero value
        if gamma == 0:
            gamma = 0.0001
        layer_data = {
            'Z': float(document.getElementById(Z_id).value) if document.getElementById(Z_id).value else 0,
            'c': c,
            'φ_d': phi_d,
            'γ': gamma,
        }
        layer_parameters.append(layer_data)
        # Print the c values
    if filter_yes:
        if filter_cohesion:
            c_values = [layer_data['c'] for layer_data in layer_parameters]
            c_groups = [c_values[i:i+num_Subgroups] for i in range(0, len(c_values), num_Subgroups)]
            # Calculate the median and standard deviation for each group
            medians = [median(group) for group in c_groups]
            sample_std_deviations = [standard_deviation(group) for group in c_groups]
            if sample_std_deviations:
                half_si_si_plus_1 = [(sample_std_deviations[i] + sample_std_deviations[i+1]) / 2 for i in range(len(sample_std_deviations) - 1)]
                half_si_minus_1_si_plus_1 = [(sample_std_deviations[i-1] + sample_std_deviations[i+1]) / 2 for i in range(1, len(sample_std_deviations) - 1)]
                half_si_si_minus_1 = [(sample_std_deviations[i] + sample_std_deviations[i-1]) / 2 for i in range(1, len(sample_std_deviations))]
            else:
                # Handle the case when sample_std_deviations is empty
                half_si_si_plus_1 = []
                half_si_minus_1_si_plus_1 = []
                half_si_si_minus_1 = []
            # Initialize the data list with the first group's data, which doesn't have the two previous std devs
            data_in_columns_with_min = [(round(half_si_si_plus_1[0], 3), 'None', 'None', round(half_si_si_plus_1[0], 3))]
            # Add the rest of the data with the calculated minimum values
            for i in range(1, len(half_si_si_plus_1)):
                min_value = round(min(
                    half_si_si_plus_1[i],
                    half_si_minus_1_si_plus_1[i-1] if i-1 < len(half_si_minus_1_si_plus_1) else float('inf'),
                    half_si_si_minus_1[i-1]), 3)
                data_in_columns_with_min.append((round(half_si_si_plus_1[i], 3), 
                                                round(half_si_minus_1_si_plus_1[i-1], 3) if i-1 < len(half_si_minus_1_si_plus_1) else 'None', 
                                                round(half_si_si_minus_1[i-1], 3) if i-1 < len(half_si_si_minus_1) else 'None', 
                                                min_value))
            # Add the last group which doesn't have the next std devs
            last_group_min_value = round(half_si_si_minus_1[-1], 3)
            data_in_columns_with_min.append(('None','None', last_group_min_value,last_group_min_value))
            # Calculate Md+Sd and Md-Sd for each group
            md_plus_sd = [round(medians[i] + data_in_columns_with_min[i][3], 3) for i in range(len(medians))]
            md_minus_sd = [round(medians[i] - data_in_columns_with_min[i][3], 3) for i in range(len(medians))] 
            # Check if each data point is within Md+Sd and Md-Sd and create the table data
            table_data = []
            for group_index, (group, md_p_sd, md_m_sd) in enumerate(zip(c_groups, md_plus_sd, md_minus_sd)):
                for data_point in group:
                    within_limits = md_m_sd <= data_point <= md_p_sd
                    table_data.append([group_index+1, data_point, within_limits])
            # Perform linear interpolation on the data points
            within_limits = [item[2] for item in table_data]
            # Perform linear interpolation on the data points
            interpolated_data = linear_interpolation(c_values, within_limits)
            # Update layer parameters with interpolated c values
            for i, layer_data in enumerate(layer_parameters):
                layer_data['c'] = interpolated_data[i]
            # Print the interpolated data
            print("Filtered Cohesion Data:")
            print(interpolated_data)    
            
        if filter_friction_angle:
            phi_values = [layer_data['φ_d'] for layer_data in layer_parameters]
            phi_groups = [phi_values[i:i+num_Subgroups] for i in range(0, len(phi_values), num_Subgroups)]
            phi_medians = [median(group) for group in phi_groups]
            phi_std_deviations = [standard_deviation(group) for group in phi_groups]
            if phi_std_deviations:
                half_si_si_plus_1_phi = [(phi_std_deviations[i] + phi_std_deviations[i+1]) / 2 for i in range(len(phi_std_deviations) - 1)]
                half_si_minus_1_si_plus_1_phi = [(phi_std_deviations[i-1] + phi_std_deviations[i+1]) / 2 for i in range(1, len(phi_std_deviations) - 1)]
                half_si_si_minus_1_phi = [(phi_std_deviations[i] + phi_std_deviations[i-1]) / 2 for i in range(1, len(phi_std_deviations))]
            else:
                half_si_si_plus_1_phi = []
                half_si_minus_1_si_plus_1_phi = []
                half_si_si_minus_1_phi = []
            # Initialize φ_d data with min values, akin to c value processing
            data_in_columns_with_min_phi = [(round(half_si_si_plus_1_phi[0], 3), 'None', 'None', round(half_si_si_plus_1_phi[0], 3))]
            for i in range(1, len(half_si_si_plus_1_phi)):
                min_value_phi = round(min(
                    half_si_si_plus_1_phi[i],
                    half_si_minus_1_si_plus_1_phi[i-1] if i-1 < len(half_si_minus_1_si_plus_1_phi) else float('inf'),
                    half_si_si_minus_1_phi[i-1]), 3)
                data_in_columns_with_min_phi.append((round(half_si_si_plus_1_phi[i], 3), 
                                                    round(half_si_minus_1_si_plus_1_phi[i-1], 3) if i-1 < len(half_si_minus_1_si_plus_1_phi) else 'None', 
                                                    round(half_si_si_minus_1_phi[i-1], 3) if i-1 < len(half_si_si_minus_1_phi) else 'None', 
                                                    min_value_phi))
            last_group_min_value_phi = round(half_si_si_minus_1_phi[-1], 3)
            data_in_columns_with_min_phi.append(('None', 'None', last_group_min_value_phi, last_group_min_value_phi))
            md_plus_sd_phi = [round(phi_medians[i] + data_in_columns_with_min_phi[i][3], 3) for i in range(len(phi_medians))]
            md_minus_sd_phi = [round(phi_medians[i] - data_in_columns_with_min_phi[i][3], 3) for i in range(len(phi_medians))]
            # Check if each φ_d data point is within Md+Sd and Md-Sd
            table_data_phi = []
            for group_index, (group, md_p_sd, md_m_sd) in enumerate(zip(phi_groups, md_plus_sd_phi, md_minus_sd_phi)):
                for data_point in group:
                    within_limits_phi = md_m_sd <= data_point <= md_p_sd
                    table_data_phi.append([group_index+1, data_point, within_limits_phi])
            # Perform linear interpolation on the φ_d data points
            within_limits_phi = [item[2] for item in table_data_phi]
            interpolated_phi = linear_interpolation(phi_values, within_limits_phi)
            for i, layer_data in enumerate(layer_parameters):
                layer_data['φ_d'] = interpolated_phi[i]
            print("Filtered Friction Angle Data:")
            print(interpolated_phi)
                        
    return pile_data, layer_parameters, num_segments

def divide_layers_into_segments(layer_parameters, num_segments):
    segmented_layers = []
    accumulated_height = 0

    # New: Incrementing layer number outside the loop
    layer_number = 1

    for layer_data in layer_parameters:
        layer_Z = layer_data['Z']
        segment_height = layer_Z / num_segments
        Z_DOWN = accumulated_height

        for _ in range(num_segments):
            segment_data = layer_data.copy()  # Make a copy of layer data
            Z_UP = Z_DOWN
            Z_DOWN += segment_height

            # Retain the original layer number in each segment
            segment_data['Layer Number'] = layer_number
            segment_data['Z'] = segment_height
            segment_data['Accumulated Height'] = Z_DOWN
            segment_data['Z_UP'] = Z_UP
            segmented_layers.append(segment_data)

        accumulated_height = Z_DOWN
        layer_number += 1  # Increment the layer number for the next layer

    return segmented_layers
   

def calculate_coefficients(pile_data, segment_data, z_value):
    if z_value == 0 or segment_data['Accumulated Height'] == 0:
        return 0, 0, 0  # Set K_OE to 0 if z_value or Accumulated Height is 0
    
    φ_r = radians(segment_data['φ_d'])
    ah_av = pile_data['ah'] / (1 - pile_data['av'])
    Rankine_A = (1 - sin(φ_r)) / (1 + sin(φ_r))
    Rankine_P = 1 / Rankine_A
    Jaky = 1 - sin(φ_r)
    mA = 1
    ξA = (mA - 1) / (mA + 1) - 1

    A0_A = (Rankine_A * (1 - ξA * sin(φ_r) + ah_av * tan(φ_r) * (2 + ξA * Jaky)))

    if A0_A <  1:
        λ = 1
    else:
        λ = 0

    two_λ_1 = (2 * λ - 1)
    B1_A = ((two_λ_1 * 2 * segment_data['c'] / ((1 - pile_data['av']) * (segment_data['γ'] * z_value))) * tan(pi / 4 - φ_r / 2))

    e1 = ((1 - A0_A) / B1_A)
    e2 = (1 + A0_A) / (two_λ_1 * B1_A) + 2 * segment_data['c'] / ((1 - pile_data['av']) * segment_data['γ'] * z_value * two_λ_1 * B1_A * tan(φ_r))

    α0 = (1 + (e2 ** 2) * (tan(φ_r)) ** 2)
    b0 = (1 - (2 * two_λ_1 * e1 * e2 + e2 ** 2) * (tan(φ_r)) ** 2)
    c0 = (e1 ** 2 + 2 * two_λ_1 * e1 * e2) * (tan(φ_r)) ** 2
    d0 = (-e1 ** 2 * (tan(φ_r)) ** 2)

    D0 = (b0 ** 2 - 3 * α0 * c0)
    D1 = (2 * b0 ** 3 - 9 * α0 * b0 * c0 + 27 * α0 ** 2 * d0)
    IMSQRT = ((((D1 ** 2) - (4 * (D0 ** 3)))) ** 0.5)
    D1_sqrt = ((D1 - IMSQRT) / 2)
    C0 = (D1_sqrt ** (1 / 3))
    ζ = complex(-0.5, (sqrt(3)) / 2)
    ζ_λ_C0 = ((ζ ** λ) * C0)

    twoλ_1_3α0 = (-1 / (3 * two_λ_1 * α0))

    D0_ζλC0 = (D0 / ζ_λ_C0)

    bo_ζλC0 = (b0 + ζ_λ_C0 + D0_ζλC0)

    colV_colX = (bo_ζλC0.real * twoλ_1_3α0.real)

    φm = (asin(colV_colX))
    φm_deg = (φm * (180 / pi))

    cm_o = (segment_data['c'] * tan(φm) / tan(φ_r))

    Κ_OE = ((1 - two_λ_1 * sin(φm)) / (1 + two_λ_1 * sin(φm)) - two_λ_1 * 2 * cm_o * tan(pi / 4 - two_λ_1 * φm / 2) / (segment_data['γ'] * z_value * (1 - pile_data['av'])))
    σ_ΧΕ = (Κ_OE * (1 - pile_data['av']) * segment_data['γ'] * z_value)

    return Κ_OE, φm_deg, σ_ΧΕ

def print_table(table_data, headers):
    # Find the maximum width for each column
    col_widths = [len(header) for header in headers]
    for row in table_data:
        for idx, cell in enumerate(row):
            col_widths[idx] = max(col_widths[idx], len(str(cell)))

    # Create a format string with dynamic padding
    row_format = " | ".join(["{:<" + str(width) + "}" for width in col_widths])

    # Print the header
    print(row_format.format(*headers))
    print("-" * (sum(col_widths) + len(col_widths) * 3 - 1))  # Adjust for the separators

    # Print the rows
    for row in table_data:
        print(row_format.format(*row))
        
def results_python(*args, **kwargs):
    from js import document
    # Get the necessary data from the form
    pile_data, layer_parameters, num_segments = load_data()
    segmented_layers = divide_layers_into_segments(layer_parameters, num_segments)

    # Define table headers
    headers = ["Layer", "Z Up [m]", "K OE, Up", "Z Down [m]", "K OE, Down", "Average K OE", "Delta z [m]", "Z Average [m]", "QS [kN]"]
    
    # Start building the HTML table
    tableHTML = "<table border='1' style='border-collapse: collapse; width: 100%;'>"
    tableHTML += "<thead><tr>"
    for header in headers:
        tableHTML += f"<th>{header}</th>"
    tableHTML += "</tr></thead><tbody>"
    
    total_QS = 0
    total_QS_total = 0
    
    for segment in segmented_layers:
        K_OE_up, _, _ = calculate_coefficients(pile_data, segment, segment['Z_UP'])
        K_OE_up = max(K_OE_up, 0)  # Ensure non-negative
        K_OE_down, _, _ = calculate_coefficients(pile_data, segment, segment['Accumulated Height'])
        K_OE_down = max(K_OE_down, 0)  # Ensure non-negative
        avg_K_OE = (K_OE_up + K_OE_down) / 2
        delta_x = segment['Accumulated Height'] - segment['Z_UP']
        z_average = (segment['Z_UP'] + segment['Accumulated Height']) / 2
        QS = pi * 2 * pile_data['R'] * delta_x * pile_data['a_i'] * (
             segment['c'] + avg_K_OE * segment['γ'] * z_average * tan(radians(segment['φ_d']))
             )
        Qs_for_tot = QS / (pi * (pile_data['R'] ** 2))
    
        total_QS += QS
        total_QS_total += Qs_for_tot
    
        tableHTML += "<tr>"
        tableHTML += f"<td>{segment['Layer Number']}</td>"
        tableHTML += f"<td>{segment['Z_UP']:.2f}</td>"
        tableHTML += f"<td>{K_OE_up:.3f}</td>"
        tableHTML += f"<td>{segment['Accumulated Height']:.2f}</td>"
        tableHTML += f"<td>{K_OE_down:.3f}</td>"
        tableHTML += f"<td>{avg_K_OE:.3f}</td>"
        tableHTML += f"<td>{delta_x:.2f}</td>"
        tableHTML += f"<td>{z_average:.2f}</td>"
        tableHTML += f"<td>{QS:.2f}</td>"
        tableHTML += "</tr>"
    
    tableHTML += "</tbody></table>"
    tableHTML += f"<p>Total QS: {total_QS:.2f} kN</p>"
    tableHTML += f"<p>q_s,tot: {total_QS_total:.2f} kPa</p>"
    
    # Output the HTML table to the designated element
    document.getElementById("uploadResults").innerHTML = tableHTML

