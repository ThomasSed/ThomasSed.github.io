let currentParsedFields = [];

const bingoHTML = `
    <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <button onclick="openAdminModal()" style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#1557b0'" onmouseout="this.style.background='#1a73e8'"><span class="material-symbols-outlined" style="font-size: 20px;">settings</span>Admin</button>
    </div>
    <div id="bingo-container" style="text-align: center; padding: 20px; color: #5f6368; display: flex; flex-direction: column; align-items: center;">
        <h2 style="font-family: 'Google Sans', sans-serif; color: #202124; margin-top: 0;">Bingo</h2>
        
        <div style="margin-top: 32px; display: inline-flex; align-items: center; gap: 12px; background: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(60,64,67,0.1); border: 1px solid #dadce0;">
            <label for="qui-select" style="font-size: 16px; font-weight: 500; color: #202124;">Qui :</label>
            <select id="qui-select" style="padding: 8px 16px; font-size: 16px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #f8f9fa; color: #202124; cursor: pointer; min-width: 200px; transition: border-color 0.2s;" onfocus="this.style.borderColor='#1a73e8'" onblur="this.style.borderColor='#dadce0'" onchange="handleQuiChange(event)">
                <option value="">Choisir</option>
                <option value="thomas">Thomas</option>
            </select>
        </div>
        <div id="main-bingo-grid" style="margin-top: 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%; max-width: 900px;"></div>
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
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <h3 style="margin: 0; font-family: 'Google Sans', sans-serif; font-size: 18px; color: #202124;">Aperçu des données</h3>
                            <label style="display: flex; align-items: center; cursor: pointer; gap: 8px;">
                                <div style="position: relative; width: 36px; height: 20px;">
                                    <input type="checkbox" id="toggle-preview" style="opacity: 0; width: 0; height: 0; position: absolute;" onchange="togglePreviewGrid()">
                                    <span id="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 20px;"></span>
                                    <span id="toggle-knob" style="position: absolute; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
                                </div>
                                <span style="font-size: 14px; color: #5f6368;">Afficher</span>
                            </label>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <select id="admin-qui-select" style="padding: 8px 12px; font-size: 14px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #ffffff; color: #202124; cursor: pointer; transition: border-color 0.2s;" onfocus="this.style.borderColor='#1a73e8'" onblur="this.style.borderColor='#dadce0'" onchange="document.getElementById('create-bingo-btn').disabled = !this.value; document.getElementById('create-bingo-btn').style.opacity = this.value ? '1' : '0.5'; document.getElementById('create-bingo-btn').style.cursor = this.value ? 'pointer' : 'not-allowed';">
                                <option value="">Pour qui ?</option>
                                <option value="thomas">Thomas</option>
                            </select>
                            <button id="create-bingo-btn" onclick="createBingoSheets()" disabled style="background: #34A853; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: not-allowed; opacity: 0.5; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s, opacity 0.2s; white-space: nowrap;" onmouseover="if(!this.disabled) this.style.background='#2d9047'" onmouseout="if(!this.disabled) this.style.background='#34A853'"><span class="material-symbols-outlined" style="font-size: 20px;">print</span>Créer la feuille</button>
                        </div>
                    </div>
                    <div id="bingo-preview-grid" style="display: none; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #dadce0; border: 1px solid #dadce0; border-radius: 6px; overflow: hidden;">
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

window.createBingoSheets = async function() {
    const selectedPerson = document.getElementById('admin-qui-select').value;
    if (!selectedPerson) return;

    if (currentParsedFields.length === 0) {
        alert("Veuillez d'abord charger un fichier CSV avec des données.");
        return;
    }

    const btn = document.getElementById('create-bingo-btn');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; animation: spin 2s linear infinite;">sync</span>Enregistrement...';

    try {
        const payload = {
            username: selectedPerson,
            grid: currentParsedFields
        };

        const apiUrl = 'https://zhwlknt3qg.execute-api.eu-north-1.amazonaws.com/default/crud-bingo';

        // Use POST with text/plain to completely bypass the browser's CORS preflight (OPTIONS) request
        let res = await fetch(apiUrl, {
            method: 'POST',
            // Browsers don't send OPTIONS preflight for text/plain POSTs
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error("Erreur de l'API (" + res.status + ")");
        }

        alert("Données enregistrées avec succès pour " + selectedPerson + " !");
        
        // Refresh grid if this person is currently selected
        const mainSelect = document.getElementById('qui-select');
        if (mainSelect && mainSelect.value === selectedPerson) {
            handleQuiChange({ target: { value: selectedPerson } });
        }
        
        closeAdminModal();
    } catch (err) {
        console.error(err);
        alert("Erreur lors de la sauvegarde de la grille.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

window.togglePreviewGrid = function() {
    const grid = document.getElementById('bingo-preview-grid');
    const checkbox = document.getElementById('toggle-preview');
    const slider = document.getElementById('toggle-slider');
    const knob = document.getElementById('toggle-knob');
    if (checkbox.checked) {
        grid.style.display = 'grid';
        slider.style.backgroundColor = '#1a73e8';
        knob.style.transform = 'translateX(16px)';
    } else {
        grid.style.display = 'none';
        slider.style.backgroundColor = '#ccc';
        knob.style.transform = 'translateX(0)';
    }
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
        
        // Simple CSV split
        const values = line.split(','); 
        if (values.length < 2) continue;

        for (let j = 1; j < values.length; j += 2) {
            const qui = values[j] ? values[j].trim() : '';
            const quoi = values[j+1] ? values[j+1].trim() : '';
            
            if (qui || quoi) {
                fields.push({ qui, quoi });
            }
        }
    }

    currentParsedFields = fields;
    renderBingoPreview(fields);
}

function renderBingoPreview(fields) {
    const grid = document.getElementById('bingo-preview-grid');
    grid.innerHTML = ''; 

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

// Main View API Logic
window.handleQuiChange = function(event) {
    const username = event.target.value;
    const container = document.getElementById('main-bingo-grid');
    
    if (username) {
        fetchBingoGrid(username, container);
    } else {
        if (container) container.innerHTML = '';
    }
}

window.fetchBingoGrid = async function(username, container) {
    if (!container) container = document.getElementById('main-bingo-grid');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #5f6368; padding: 40px;"><span class="material-symbols-outlined" style="animation: spin 2s linear infinite; display: block; margin-bottom: 12px; font-size: 32px;">sync</span> Chargement de la grille...</div>';
    
    try {
        const res = await fetch('https://zhwlknt3qg.execute-api.eu-north-1.amazonaws.com/default/crud-bingo?username=' + encodeURIComponent(username));
        
        if (res.status === 404) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #5f6368; padding: 40px; background: white; border-radius: 8px; border: 1px solid #dadce0;">Aucune grille trouvée pour ' + username + '</div>';
            return;
        }
        
        if (!res.ok) {
            throw new Error('Erreur API');
        }
        
        const data = await res.json();
        const fields = data.grid || [];
        renderMainBingoGrid(fields, container);
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #c5221f; padding: 40px; background: #fce8e6; border-radius: 8px; border: 1px solid #fad2cf;">Erreur lors du chargement de la grille.</div>';
    }
}

window.renderMainBingoGrid = function(fields, container) {
    container.innerHTML = '';
    
    if (fields.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #5f6368; padding: 40px; background: white; border-radius: 8px; border: 1px solid #dadce0;">La grille est vide.</div>';
        return;
    }
    
    fields.forEach(field => {
        const div = document.createElement('div');
        div.style.background = 'white';
        div.style.border = '1px solid #dadce0';
        div.style.borderRadius = '8px';
        div.style.padding = '16px';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.textAlign = 'center';
        div.style.gap = '8px';
        div.style.minHeight = '120px';
        div.style.cursor = 'pointer';
        div.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        div.style.boxShadow = '0 1px 2px rgba(60,64,67,0.1)';
        
        // Hover effects
        div.onmouseover = function() { 
            if (this.dataset.selected !== 'true') {
                this.style.boxShadow = '0 4px 8px rgba(60,64,67,0.15)'; 
                this.style.transform = 'translateY(-2px)'; 
            }
        };
        div.onmouseout = function() { 
            if (this.dataset.selected !== 'true') {
                this.style.boxShadow = '0 1px 2px rgba(60,64,67,0.1)'; 
                this.style.transform = 'translateY(0)'; 
            }
        };
        
        // Click interaction (toggle selected state)
        div.onclick = function() {
            if (this.dataset.selected === 'true') {
                this.dataset.selected = 'false';
                this.style.background = 'white';
                this.style.borderColor = '#dadce0';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 1px 2px rgba(60,64,67,0.1)';
            } else {
                this.dataset.selected = 'true';
                this.style.background = '#e6f4ea'; // Google green light
                this.style.borderColor = '#34A853'; // Google green
                this.style.transform = 'scale(0.98)';
                this.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
            }
        };

        const quiEl = document.createElement('div');
        quiEl.style.fontSize = '18px';
        quiEl.style.fontWeight = '500';
        quiEl.style.color = '#202124';
        quiEl.textContent = field.qui || '-';

        const quoiEl = document.createElement('div');
        quoiEl.style.fontSize = '14px';
        quoiEl.style.color = '#5f6368';
        quoiEl.style.lineHeight = '1.4';
        quoiEl.textContent = field.quoi || '-';

        div.appendChild(quiEl);
        div.appendChild(quoiEl);
        container.appendChild(div);
    });
}
