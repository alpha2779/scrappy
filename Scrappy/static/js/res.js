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
        const pageName = row.cells[2].textContent.trim();

        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                const url = links[index].textContent.trim();

                // Collecting components associated with the selected link
                const componentsContainer = row.cells[3];

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
                    selectedRows.push({ url, pageName, components });
                } else {
                    // Case without <hr>
                    const componentsList = Array.from(componentsContainer.querySelectorAll('span')).map(span => span.textContent.trim());
                    const components = componentsList.join(', ');
                    selectedRows.push({ url, pageName, components });
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
    const columns = ['ID', 'URL', 'Nom de la page', 'Composants'];

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
