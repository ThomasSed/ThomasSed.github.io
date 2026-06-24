const bingoHTML = `
    <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <button onclick="openAdminModal()" style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#1557b0'" onmouseout="this.style.background='#1a73e8'"><span class="material-symbols-outlined" style="font-size: 20px;">settings</span>Admin</button>
    </div>
    <div id="bingo-container" style="text-align: center; padding: 20px; color: #5f6368;">
        <h2>Bingo</h2>
        <p>Page en construction...</p>
    </div>

    <!-- Admin Modal -->
    <div id="admin-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
        <div id="admin-modal" style="background: white; width: 80%; height: 80%; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; animation: fadeIn 0.2s ease-in-out;">
            <div style="padding: 16px 24px; border-bottom: 1px solid #dadce0; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;">
                <h2 style="margin: 0; font-family: 'Google Sans', sans-serif; font-size: 20px; color: #202124; display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="color: #1a73e8;">settings</span>Administration Bingo</h2>
                <button onclick="closeAdminModal()" style="background: none; border: none; cursor: pointer; color: #5f6368; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#e8eaed'" onmouseout="this.style.background='none'"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div style="padding: 24px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 24px;">
                <!-- Dropzone -->
                <div id="drop-zone" style="border: 2px dashed #dadce0; border-radius: 8px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; background: #ffffff;" 
                     onclick="document.getElementById('csvFileInput').click()"
                     ondragover="this.style.borderColor='#1a73e8'; this.style.background='#f4f8fe'; event.preventDefault();"
                     ondragleave="this.style.borderColor='#dadce0'; this.style.background='#ffffff'; event.preventDefault();"
                     ondrop="handleDrop(event); this.style.borderColor='#dadce0'; this.style.background='#ffffff'; event.preventDefault();">
                    <span class="material-symbols-outlined" style="font-size: 48px; color: #1a73e8; margin-bottom: 12px;">upload_file</span>
                    <p style="margin: 0; color: #202124; font-family: 'Google Sans', sans-serif; font-size: 18px; font-weight: 500;">Cliquez ou glissez-déposez un fichier CSV ici</p>
                    <p style="margin: 8px 0 0; color: #5f6368; font-size: 14px;">Format: Horodateur, qui, quoi, qui, quoi...</p>
                    <input type="file" id="csvFileInput" accept=".csv" style="display: none;" onchange="handleCSVUpload(event)">
                </div>

                <!-- Preview Grid -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0; font-family: 'Google Sans', sans-serif; font-size: 18px; color: #202124;">Aperçu des données</h3>
                        <button onclick="createBingoSheets()" style="background: #34A853; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#2d9047'" onmouseout="this.style.background='#34A853'"><span class="material-symbols-outlined" style="font-size: 20px;">print</span>Créer les feuilles de bingo</button>
                    </div>
                    <div id="bingo-preview-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #dadce0; border: 1px solid #dadce0; border-radius: 6px; overflow: hidden;">
                        <!-- Les champs seront injectés ici -->
                        <div style="grid-column: 1 / -1; text-align: center; color: #9aa0a6; padding: 40px; background: #ffffff;">
                            Aucune donnée chargée.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    const bingoApp = document.getElementById('bingo-app');
    if (bingoApp) {
        bingoApp.innerHTML = bingoHTML;
    }
});

// Admin Modal Logic
window.openAdminModal = function() {
    document.getElementById('admin-modal-overlay').style.display = 'flex';
}

window.closeAdminModal = function() {
    document.getElementById('admin-modal-overlay').style.display = 'none';
}

window.createBingoSheets = function() {
    alert("Fonctionnalité de création de feuilles de bingo à venir !");
}

// CSV Parsing Logic for Bingo
window.handleDrop = function(event) {
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        processFile(file);
    } else {
        alert("Veuillez déposer un fichier CSV valide.");
    }
}

window.handleCSVUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const fields = [];
    
    // Skip the first line (header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV split (assuming no quotes with commas inside for now)
        const values = line.split(','); 
        if (values.length < 2) continue; // Needs at least Horodateur

        // Pairs start at index 1
        for (let j = 1; j < values.length; j += 2) {
            const qui = values[j] ? values[j].trim() : '';
            const quoi = values[j+1] ? values[j+1].trim() : '';
            
            if (qui || quoi) {
                fields.push({ qui, quoi });
            }
        }
    }

    renderBingoPreview(fields);
}

function renderBingoPreview(fields) {
    const grid = document.getElementById('bingo-preview-grid');
    grid.innerHTML = ''; // clear

    if (fields.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #9aa0a6; padding: 40px; background: #ffffff;">Aucune donnée valide trouvée.</div>';
        return;
    }

    fields.forEach(field => {
        const div = document.createElement('div');
        div.style.padding = '16px';
        div.style.background = '#ffffff';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.textAlign = 'center';
        div.style.gap = '6px';
        div.style.transition = 'background 0.2s';
        div.onmouseover = () => { div.style.background = '#f1f3f4'; };
        div.onmouseout = () => { div.style.background = '#ffffff'; };
        
        const quiEl = document.createElement('div');
        quiEl.style.fontSize = '16px';
        quiEl.style.fontWeight = '500';
        quiEl.style.color = '#202124';
        quiEl.textContent = field.qui || '-';

        const quoiEl = document.createElement('div');
        quoiEl.style.fontSize = '12px';
        quoiEl.style.color = '#5f6368';
        quoiEl.style.lineHeight = '1.4';
        quoiEl.textContent = field.quoi || '-';

        div.appendChild(quiEl);
        div.appendChild(quoiEl);
        grid.appendChild(div);
    });
}
