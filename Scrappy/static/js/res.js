document.addEventListener('DOMContentLoaded', () => {
    setupConfirmationOnExit();
    hideAllSiteAContents();
    setupContentFiltering();
    setupDashboardAndSiteALinks();
});

// this is for the toggle button to close the sidebar
$(document).ready(function () {
    $("#toggleSidebar").on("click", function () {
        $("#sidebar").toggleClass("d-none");
    });
});

// not used
function showLoading() {
    document.getElementById("scan-btn").style.display = "none";
    document.getElementById("loading-overlay").style.display = "flex";
}

function confirmScanAgain() {
    var isConfirmed = confirm("Voulez-vous effectuer un nouveau scan?");
    if (isConfirmed) {
        // Navigate to the new scan page
        window.location.replace("/");  // Adjust the URL to your actual new scan page path
    }
    return false;  // This ensures the button doesn't follow through with any default behavior
}
// window.addEventListener('popstate', function(event) {
//   if (!confirm("Voulez-vous vraiment quitter cette page?")) {
//       event.preventDefault();
//   }
// });

// // The following line is necessary to initialize the popstate detection
// history.pushState(null, null, document.URL);

function setupConfirmationOnExit() {
    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        e.returnValue = "Des modifications non enregistrées pourraient être perdues. Voulez-vous vraiment quitter?";
    });
}

function hideAllSiteAContents() {
    const siteAContent = document.querySelectorAll('.site-a-content');
    siteAContent.forEach(content => content.style.display = 'none');
}

function setupContentFiltering() {
    const filterOptions = document.querySelectorAll('.filter-option');

    document.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('filter-option')) {
            const section = target.closest('.site-a-content');
            const tableRows = section.querySelectorAll('.tbody-all-pages .tr-all-pages');
            
            filterContentBasedOnSelection(target, tableRows, filterOptions);
        }
    });
}

function filterContentBasedOnSelection(target, tableRows, filterOptions) {
    const selectedComponent = target.getAttribute('data-component');
    let anyRowVisible = false;

    tableRows.forEach(row => {
        const components = Array.from(row.querySelectorAll('.badge.bg-gradient-success'));
        const isComponentMatched = selectedComponent === 'Tout Les Composants' || 
                                components.some(component => component.textContent.includes(selectedComponent));
        
        if (isComponentMatched) {
            row.style.display = 'table-row';
            anyRowVisible = true;
    
            if (selectedComponent !== 'Tout Les Composants') {
                components.forEach(comp => {
                    if (comp.textContent.includes(selectedComponent)) {
                        comp.classList.add('activeHighlight');
                    } else {
                        comp.classList.remove('activeHighlight');
                    }
                });
            } else {
                components.forEach(comp => comp.classList.remove('activeHighlight'));
            }
    
        } else {
            row.style.display = 'none';
        }
                           
    });

    const section = target.closest('.site-a-content');
    const noContentMessage = section.querySelector('.no-content-message');
    noContentMessage.style.display = anyRowVisible ? 'none' : 'block';

    filterOptions.forEach(option => option.classList.remove('active'));
    target.classList.add('active');
}


function setupDashboardAndSiteALinks() {
    const siteAContent = document.querySelectorAll('.site-a-content');
    const dashboardContent = document.getElementById('dashboard-content');
    const dashboardLink = document.getElementById('dashboard-link');

    document.addEventListener('click', (event) => {
        const target = event.target;

        if (target.id === 'dashboard-link') {
            toggleDashboardContent(siteAContent, dashboardContent, dashboardLink);
        }

        for (let index = 1; index <= siteAContent.length; index++) {
            if (target.id === `site-a-link-${index}`) {
                toggleSiteAContent(siteAContent, dashboardContent, dashboardLink, index);
            }
        }
    });
}

function toggleDashboardContent(siteAContent, dashboardContent, dashboardLink) {
    siteAContent.forEach(content => content.style.display = 'none');
    dashboardContent.style.display = 'block';
    deactivateAllLinks();
    dashboardLink.classList.add('active');
}

function toggleSiteAContent(siteAContent, dashboardContent, dashboardLink, index) {
    siteAContent.forEach(content => content.style.display = 'none');
    dashboardContent.style.display = 'none'; // hide the dashboard content
    document.getElementById(`site-a-content-${index}`).style.display = 'block';
    deactivateAllLinks();
    document.getElementById(`site-a-link-${index}`).classList.add('active');
}

function deactivateAllLinks() {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
}

// Counter Management
const sections = document.querySelectorAll('.site-a-content');

const sectionCountMap = new Map();

sections.forEach(section => {
    sectionCountMap.set(section, 0);  // Initialize each section's count to 0 in the map
    
    section.querySelectorAll('.rowCheckbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const currentCount = sectionCountMap.get(section);
            const newCount = this.checked ? currentCount + 1 : currentCount - 1;
            sectionCountMap.set(section, newCount);
            updateCounterDisplay(section, newCount);
        });
    });
});

function updateCounterDisplay(section, countSelected) {
    // Get all the selectedCount elements within the current section and update them
    section.querySelectorAll('.selectedCount').forEach(countDisplay => {
        countDisplay.textContent = `${countSelected}`;
    });
}

function resetCounterForSection(section) {
    // Reset the counter in the map
    sectionCountMap.set(section, 0);
    
    // Reset the visual display
    section.querySelectorAll('.selectedCount').forEach(countDisplay => {
        countDisplay.textContent = '0';
    });
}


let currentSectionContext;  // variable to store the section context

// File Generation
document.querySelectorAll('.generateFiles').forEach(element => {
    element.addEventListener('click', function() {
        const { rows, section } = getSelectedRowsData(this);
        
        if (rows.length > 0) {
            currentSectionContext = section; // store the section context
            document.getElementById('confirmDownload').dataset.selectedRows = JSON.stringify(rows);
            populateConfirmationModal(rows);
            $('#confirmationModal').modal('show');
        } else {
            alert('Veuillez sélectionner les pages avant de valider l\'échantillon.');
        }
    });
});

document.getElementById('confirmDownload').addEventListener('click', function() {
    if (currentSectionContext) {
        const selectedRows = JSON.parse(this.dataset.selectedRows || "[]");
        if (selectedRows.length > 0) sendDataToServer(selectedRows, currentSectionContext);
    } else {
        console.error('No section context available');
    }
});

function getSelectedRowsData(buttonElement) {
    const section = buttonElement.closest('.site-a-content');
    if (!section) {
        console.error('Unable to find .site-a-content');
        return [];
    }

    console.log("getting rows");
    console.log(section);

    const allRowsData = [];
    section.querySelectorAll('.tr-sample-pages').forEach(row => {
        const url = row.querySelector('.lien-page') ? row.querySelector('.lien-page').href.trim() : '';
        const pageName = row.cells[2].textContent.trim(); // Adjusted assuming URL is in the first cell

        // Collecting components associated with the row
        const componentsContainer = row.cells[3]; // Adjusted assuming components are in the third cell
        let components = [];
        if (componentsContainer) {
            components = Array.from(componentsContainer.querySelectorAll('span')).map(span => span.textContent.trim()).join(', ');
        }

        const chargeSelect = row.cells[4].querySelector('select');
        // const charge = chargeSelect ? chargeSelect.value : ''; 
        const charge = chargeSelect ? chargeSelect.options[chargeSelect.selectedIndex].text : '';

        // Only add rows with a non-empty URL and Page Name to the results
        if (url && pageName) {
            allRowsData.push({ url, pageName, components, charge });
        }
    });

    return {
        section,
        rows: allRowsData
    };
}


function populateConfirmationModal(data) {
    const table = document.getElementById('confirmationTable');
    table.innerHTML = ''; // Clear table

    const thead = document.createElement('thead');
    thead.classList.add('thead-side-color');

    const headerRow = createHeaderRow();
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createBodyRows(data);
    table.appendChild(tbody);
}

function createHeaderRow() {
    const headerRow = document.createElement('tr');
    const columns = ['ID', 'URL', 'Nom de la page', 'Composants', 'Charge'];

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });

    return headerRow;
}

function createBodyRows(data) {
    const tbody = document.createElement('tbody');

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('tr-all-pages');

        const tdId = document.createElement('td');
        tdId.textContent = index + 1;
        tr.appendChild(tdId);

        const tdUrl = document.createElement('td');
        tdUrl.innerHTML = `<a class="lien-page mb-0 text-sm" href="${row.url}" target="_blank">${row.url} <i class="fas fa-external-link-alt"></i></a>`;
        tr.appendChild(tdUrl);

        const tdPageName = document.createElement('td');
        const p = document.createElement('p');
        p.classList.add('text-sm', 'font-weight-bold', 'mb-0');
        p.textContent = row.pageName;
        tdPageName.appendChild(p);
        tr.appendChild(tdPageName);

        const tdComponents = document.createElement('td');
        tdComponents.innerHTML = row.components.split(', ').map(comp => `<span class="badge badge-sm bg-gradient-success">${comp}</span>`).join(' ');
        tr.appendChild(tdComponents);

        const tdCharge = document.createElement('td');
        tdCharge.innerHTML = `<div class="complexity-dropdown ${row.charge.toLowerCase().replace(/\s+/g, '-')}">${row.charge}</div>`;
        tr.appendChild(tdCharge);

        tbody.appendChild(tr);
    });

    return tbody;
}

function sendDataToServer(data, section) {
    fetch('/scan/generate/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
    })
    .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = "output.xlsx";
        link.click();
        uncheckSelectedRows(section);
        closeModal();
        resetCounterForSection(section);
    })
    .catch(error => console.error('Error:', error));
}

function uncheckSelectedRows(section) {
    section.querySelectorAll('.rowCheckbox:checked').forEach(checkbox => checkbox.checked = false);
}

function closeModal() {
    const closeButton = document.querySelector('[data-dismiss="modal"]');
    if (closeButton) closeButton.click();
}

$('.rowCheckbox').change(function() {
    var $checkbox = $(this);
    var isChecked = $checkbox.is(':checked');
    var $row = $checkbox.closest('tr').clone();

    // Remove the checkbox from the cloned row
    $row.find('td:first').remove();

    // Reorder: Move the second column to be the first
    var $secondTd = $row.find('td:eq(0)').detach();
    $row.prepend($secondTd);

    // Append a new select element and button to the end of the row
    var $select = $('<select class="complexity-dropdown ultra-simple" data-default="Ultra Simple">' +
                        '<option value="ultra-simple">Ultra Simple</option>' +
                        '<option value="simple">Simple</option>' +
                        '<option value="complexe">Complexe</option>' +
                    '</select>');

                    
    var $button = $('<button class="btn-edit" title="Modifier">' +
                        '<img src="/static/images/icon-edit.png" height="20px" alt="">' +
                    '</button>');

    var $beforeLastTd = $('<td></td>').append($select);
    var $lastTd = $('<td></td>').append($button);
    $row.append($beforeLastTd);
    $row.append($lastTd);

    if (isChecked) {
        // Prepend a count cell to the cloned row before appending it
        $row.prepend('<td class="row-count"></td>');
        $row.addClass('tr-sample-pages');
        $('#sample-pages-body').append($row);

        $('#alert-container').html('<div class="alert alert-success" role="alert">Ajouté!</div>');
        setTimeout(() => { $('#alert-container').html(''); }, 3000);
    } else {
        // Find and remove the matching row in the first table based on URL
        var url = $row.find('td:eq(0)').text().trim(); // Adjust index to account for the new count cell
        // console.log("URL to match:", url);
        $('#sample-pages-body tr').each(function() {
            var rowUrl = $(this).find('td:eq(1)').text().trim(); // Adjust index accordingly
            // console.log("Comparing with:", rowUrl);
            if (url === rowUrl) {
                $(this).remove();
                $('#alert-container').html('<div class="alert alert-danger" role="alert">Supprimé!</div>');
                setTimeout(() => { $('#alert-container').html(''); }, 3000);
            }
        });
    }

    // Update counts for all rows in the first table
    $('#sample-pages-body tr').each(function(index) {
        $(this).find('td.row-count').text(index + 1);
    });
});

$(document).on('change', '.complexity-dropdown', function() {
    // Remove all specific option-related classes first
    $(this).removeClass('ultra-simple simple complexe');
    
    // Add class based on the selected option's value
    var selectedValueClass = $(this).val();
    $(this).addClass(selectedValueClass);
});


var currentEditingRow;

// Event listener for the "Modify" button
$(document).on('click', '.btn-edit', function() {
    currentEditingRow = $(this).closest('tr'); // Store the reference to the row
    var $row = $(this).closest('tr');
    var url = $row.find('td:eq(1)').text().trim(); // Adjust the index if needed
    var pageName = $row.find('td:eq(2)').text().trim(); // Adjust the index if needed
    // Populate the modal fields
    $('#modalUrl').val(url);
    $('#modalPageName').val(pageName);

    // Clear previously checked checkboxes in the modal
    $('#modificationModal .custom-checkbox input[type="checkbox"]').prop('checked', false);

    // Extract components from the third column
    var components = $row.find('td:eq(3) .badge').map(function() {
        // Return the text content of the badge instead of a data attribute
        return $(this).text().trim();
    }).get();

    // Check the corresponding checkboxes in the modal based on extracted components
    $('#modificationModal .custom-checkbox input[type="checkbox"]').each(function() {
        var checkboxValue = $(this).val();
        // Check if the checkbox value is in the components array
        if (components.includes(checkboxValue)) {
            $(this).prop('checked', true);
        }
    });    
    // Show the modal
    $('#modificationModal').modal('show');
});

$('#modificationModal .btn-primary-modal').click(function() {
    // Collect updated data from the modal
    var updatedPageName = $('#modalPageName').val();
    
    // Collect the states of checkboxes
    var updatedComponents = [];
    $('#modificationModal .custom-checkbox input[type="checkbox"]:checked').each(function() {
        updatedComponents.push($(this).val());
    });

    // Update the original row with the new values
    if (currentEditingRow) {
        currentEditingRow.find('td:eq(2)').text(updatedPageName);

        // Update components - this example replaces all components with new spans
        // This might need to be adjusted based on how you want to display updated components
        var componentsHtml = updatedComponents.map(function(component) {
            return '<span class="badge badge-sm bg-gradient-success">' + component + '</span>';
        }).join('');

        currentEditingRow.find('td:eq(3)').html(componentsHtml);

        // Optionally, clear the reference to the current row being edited
        currentEditingRow = null;
    }
    // Close the modal
    $('#modificationModal').modal('hide');
});


