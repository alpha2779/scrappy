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
        console.error('Unable to find .site-section');
        return [];
    }

    const selectedRows = [];
    section.querySelectorAll('.tr-all-pages').forEach(row => {
        const checkboxes = Array.from(row.querySelectorAll('.rowCheckbox'));
        const links = Array.from(row.querySelectorAll('.lien-page'));
        const pageName = row.querySelector('.page-name').value;
        const complexity = Array.from(row.querySelectorAll('.complexity-dropdown'));

        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                const url = links[index].textContent.trim();
                const comp = complexity[index].value;
                console.log(complexity[index].value);

                // Collecting components associated with the selected link
                const componentsContainer = row.querySelector('.all-components');

                if(componentsContainer.querySelector('hr')) {
                    // Case with <hr>
                    const componentsSets = Array.from(componentsContainer.querySelectorAll('span, hr')).reduce((sets, el) => {
                        if (el.tagName.toLowerCase() === 'hr' || !sets.length) {
                            sets.push([]);
                        } else {
                            sets[sets.length - 1].push(el.textContent.trim());
                        }
                        return sets;
                    }, []);
                    const components = componentsSets[index] ? componentsSets[index].join(', ') : '';
                    selectedRows.push({ url, pageName, components, comp });
                } else {
                    // Case without <hr>
                    const componentsList = Array.from(componentsContainer.querySelectorAll('span')).map(span => span.textContent.trim());
                    const components = componentsList.join(', ');
                    selectedRows.push({ url, pageName, components, comp });
                }
            }
        });
    });

    return {
        section,
        rows: selectedRows
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
    const columns = ['ID', 'URL', 'Nom de la page', 'Composants', 'Complexité'];

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

        const tdComplexity = document.createElement('td');
        tdComplexity.innerHTML = `<span class="badge badge-sm complexity-dropdown ${row.comp}">${row.comp}</span>`;
        tr.appendChild(tdComplexity);

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

// end of first bloc

function submitURL() {
    const url = document.getElementById('urlInput').value.trim(); // Added trim to remove any leading/trailing spaces

    // If the URL is empty, return early
    if (!url) {
        console.warn('URL input is empty. Exiting.');
        return;
    }

    // Show loader
    document.querySelector('.loader').style.display = 'flex';

    // Using Fetch API to send a POST request
    fetch('/scan/single/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'url': url })
    })
    .then(response => response.json())
    .then(data => {
        addRowToTable(data); // Assuming you only get one result for a single URL
        // Hide loader
        document.querySelector('.loader').style.display = 'none';
    })
    .catch((error) => {
        console.error('Error:', error);
        // Hide loader
        document.querySelector('.loader').style.display = 'none';
    });
}

document.getElementById('validerBtn').disabled = true;

function clearModalTable() {
    document.querySelector('#urlModal #add-page-table').innerHTML = '';
    // Again, disable the "Valider" button since the table is empty now
    document.getElementById('validerBtn').disabled = true;
}

function addRowToTable(row) {
    const table = document.getElementById('add-page-table');
    table.innerHTML = ''; // Clear table

    const thead = document.createElement('thead');
    thead.classList.add('thead-side-color');

    const headerRow = document.createElement('tr');
    const columns = ['URL', 'Nom de la page', 'Composants', 'Complexité'];

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });

    const tbody = document.createElement('tbody');

    thead.appendChild(headerRow);
    table.appendChild(thead);
    table.appendChild(tbody);
    
    const tr = document.createElement('tr');
    tr.classList.add('tr-all-pages');

    const tdUrl = document.createElement('td');
    tdUrl.innerHTML = `<a class="lien-page mb-0 text-sm" href="${row.absolute_url}" target="_blank">${row.absolute_url} <i class="fas fa-external-link-alt"></i></a>`;
    tr.appendChild(tdUrl);

    const tdPageName = document.createElement('td');
    const p = document.createElement('p');
    p.classList.add('text-sm', 'font-weight-bold', 'mb-0');
    p.textContent = row.page_title;
    tdPageName.appendChild(p);
    tr.appendChild(tdPageName);

    const tdComponents = document.createElement('td');
    tdComponents.innerHTML = row.page_components.map(comp => `<span class="badge badge-sm bg-gradient-success">${comp}</span>`).join(' ');
    tr.appendChild(tdComponents);

    const tdComplexity = document.createElement('td');
    tdComplexity.innerHTML = `<span class="badge badge-sm bg-gradient-success complexity-dropdown ${row.complexity}">${row.complexity}</span>`;
    tr.appendChild(tdComplexity);

    tbody.appendChild(tr);

    document.getElementById('validerBtn').disabled = false;
}
let currentRowId;  // This will store the data-id of the clicked "Add" button

document.querySelectorAll('.addBtn').forEach(button => {
    button.addEventListener('click', function() {
        currentRowId = this.getAttribute('data-id');
    });
});

// Define function to attach event to the button
function attachButtonEvent(button) {
    button.addEventListener('click', function() {
        currentRowId = button.getAttribute('data-id');
    });
}

document.getElementById('validerBtn').addEventListener('click', function() {
    if (currentRowId) {
        // Retrieve data from the modal's table
        let rowData = {};

        let trs = document.querySelectorAll('.tr-all-pages');
        trs.forEach(tr => {
            rowData.url = tr.querySelector('.lien-page');
            rowData.page_components = Array.from(tr.querySelectorAll('td:nth-child(3) .badge')).map(el => el.textContent.trim());
            rowData.complexity = Array.from(tr.querySelectorAll('td:nth-child(4) .badge')).map(el => el.textContent.trim());
        });

        // Inject the data into the corresponding row in the main table
        let targetRow = document.querySelector(`[data-id="${currentRowId}"]`).closest('tr');
        console.log(currentRowId);

        // Assuming 2nd <td> is for the URL and 3rd <td> is for the page name and 4th <td> is for components
        targetRow.querySelector('td:nth-child(3)').innerHTML = `<a class="lien-page mb-0 text-sm" href="${rowData.url}" target="_blank">${rowData.url} <i class="fas fa-external-link-alt"></i></a>`;
        
        targetRow.querySelector('td:nth-child(5)').innerHTML = rowData.page_components.map(comp => `<span class="badge badge-sm bg-gradient-success">${comp}</span>`).join(' ') + 
        `<button type="button" class="btn btn-primary btn-sm btn-comp ml-2" data-toggle="modal" data-target="#componentsModal">
            <i class="fas fa-plus"></i>
        </button>`;
        
        targetRow.querySelector('td:nth-child(6)').innerHTML = `
        <select class="complexity-dropdown ${rowData.complexity} " data-default="${rowData.complexity} ">
            <option value="ultra-simple" {% if ${rowData.complexity} == 'ultra-simple' %}selected{% endif %}>Ultra Simple</option>
            <option value="simple" {% if ${rowData.complexity} == 'simple' %}selected{% endif %}>Simple</option>
            <option value="complexe" {% if ${rowData.complexity} == 'complexe' %}selected{% endif %}>Complexe</option>
        </select>
        `;

        targetRow.querySelector('td:nth-child(7)').innerHTML = `
            <select class="charge-dropdown ${rowData.complexity}" data-default="0.25">
                <option value="0.125" >0.125</option>
                <option value="0.25" selected>0.25</option>
                <option value="0.5">0.5</option>
                <option value="0.75">0.75</option>
                <option value="1">1</option>
            </select>
        `;

        // After data from modal is added to table
        // Locate the row based on currentRow
        const rowToUpdate = document.querySelector(`[data-id="${currentRowId}"]`).parentNode.parentNode;
        
        // Add checkbox or show checkbox in the row
        const checkboxCell = rowToUpdate.children[1];  // the second TD in the row
        const checkbox = checkboxCell.querySelector('.rowCheckbox');
        checkbox.style.display = "grid"; // or you can do checkbox.removeAttribute('hidden');

        // Clear the modal table
        clearModalTable();

        // Close the modal
        $('#urlModal').modal('hide');
    }
});

$('.complexity-dropdown').on('change', function() {
    switch ($(this).val()) {
        case 'ultra-simple':
            $(this).removeClass('simple complexe').addClass('ultra-simple');
            break;
        case 'simple':
            $(this).removeClass('ultra-simple complexe').addClass('simple');
            break;
        case 'complexe':
            $(this).removeClass('ultra-simple simple').addClass('complexe');
            break;
            
    }
});

$('.complexity-dropdown').on('change', function() {
    const selectedValue = $(this).val();
    
    // Get the charge dropdown within the neighboring <td>
    const $chargeDropdown = $(this).closest('td').next().find('.charge-dropdown');
    
    let chargeValue;
    switch(selectedValue) {
        case 'ultra-simple':
            chargeValue = '0.25';
            break;
        case 'simple':
            chargeValue = '0.5';
            break;
        case 'complexe':
            chargeValue = '0.75';
            break;
    }
    $chargeDropdown.val(chargeValue).trigger('change');  // Set the value and trigger a change event
});

$('.charge-dropdown').on('change', function() {
    switch ($(this).val()) {
        case '0.125':
            $(this).removeClass('simple complexe').addClass('ultra-simple');
            break;
        case '0.25':
            $(this).removeClass('simple complexe').addClass('ultra-simple');
            break;
        case '0.5':
            $(this).removeClass('ultra-simple complexe').addClass('simple');
            break;
        case '0.75':
            $(this).removeClass('ultra-simple simple').addClass('complexe');
            break;
        case '1':
            $(this).removeClass('ultra-simple simple').addClass('complexe');
            break;
            
    }
});

// Declare counter outside of the click function
let counter = 9;

$('#ajouterBtn').click(function() {
    let pageName = $('#pageInput').val(); // Get the value from the input

    // Ensure the input isn't empty
    if (pageName.trim() !== "") {
        let newRow = `
        <tr class="tr-all-pages">
            <td>
                <button data-id="${counter}" class="btn btn-warning btn-generate addBtn" data-toggle="modal" data-target="#urlModal">
                    <i class="fas fa-plus"></i>
                </button> 
            </td>
            <td>
                <input type="checkbox" class="rowCheckbox" style="display: none;">
            </td>
            <td>
                <span class="text-danger">Introuvable</span>
            </td>
            <td>
                <input type="text" class="form-control page-name" value="${pageName}" name="url">
            </td>
            <td class="align-middle text-center text-sm all-components">
                <!-- For now, it'll be empty since we don't have the components for the new page -->
            </td>
            <td>
                <!-- Complexity Dropdown -->
            </td>
            <td>
                <!-- Charge Dropdown -->
            </td>
        </tr>
        `;

        // Append the new row to the table
        $('#comp-table tbody').append(newRow);  // Adjusted the selector to directly target the tbody of the table.

        // Attach the event to the newly added button
        let newButton = $('#comp-table tbody tr:last .addBtn')[0];
        attachButtonEvent(newButton);

        // Clear the input value
        $('#pageInput').val('');
        
        // Close the modal
        $('#addLinePage').modal('hide');

        // Increment the counter
        counter++;
    } else {
        alert("Please enter a page name");
    }
});
document.querySelectorAll('.btn-generate.addBtn').forEach(button => {
    attachButtonEvent(button);
});

// When the modal's 'Ajouter les composants' button is clicked
$("#componentsModal .btn-primary").click(function() {
    let selectedComponents = "";
    
    // Loop through checked components
    $("#componentsModal .form-check-input:checked").each(function() {
        let value = $(this).val();
        
        // Append to the selectedComponents string with the desired styling
        selectedComponents += `
        <span class="badge badge-sm bg-gradient-success">
            ${value} 
            <i class="fas fa-times delete-component" style="cursor: pointer; margin-left: 5px;"></i>
        </span> 
    `;
        });
    
    // Add the selected components to the 'Composants' cell of the current row.
    // (Assuming the modal was opened from the respective row)
    // Modify this if your structure differs.
    $(".modal.show").data("sourceRow").find(".all-components").prepend(selectedComponents);
    
    // Close the modal
    $("#componentsModal").modal('hide');
});

// When the 'Ajouter un composant' button is clicked, save the source row
$(".btn[data-target='#componentsModal']").click(function() {
    $("#componentsModal").data("sourceRow", $(this).closest("tr"));
});

$(document).on("click", ".delete-component", function() {
    $(this).closest('.badge').remove();
});
