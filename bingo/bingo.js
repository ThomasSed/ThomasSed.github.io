let currentParsedFields = [];
let currentGridFields = [];
let currentUsername = '';
let adminEditFields = [];
let adminEditUsername = '';
let adminVerifiedPassword = '';

const BINGO_API_URL = 'https://tc3q8oigfk.execute-api.eu-north-1.amazonaws.com/default/crud-bingo';

const bingoHTML = `
    <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <button onclick="openAdminModal()" style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='#1557b0'" onmouseout="this.style.background='#1a73e8'"><span class="material-symbols-outlined" style="font-size: 20px;">settings</span>Admin</button>
    </div>
    <div id="bingo-container" style="text-align: center; padding: 20px; color: #5f6368; display: flex; flex-direction: column; align-items: center;">
        <h2 style="font-family: 'Google Sans', sans-serif; color: #202124; margin-top: 0;">Bingo</h2>
        
        <div style="margin-top: 32px; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 12px; background: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(60,64,67,0.1); border: 1px solid #dadce0;">
            <label for="qui-select" style="font-size: 16px; font-weight: 500; color: #202124;">Qui :</label>
            <select id="qui-select" style="padding: 8px 16px; font-size: 16px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #f8f9fa; color: #202124; cursor: pointer; min-width: 200px; transition: border-color 0.2s;" onfocus="this.style.borderColor='#1a73e8'" onblur="this.style.borderColor='#dadce0'" onchange="handleMainUserChange()">
                <option value="">Choisir</option>
            </select>
            <input type="password" id="main-password" placeholder="Mot de passe" style="padding: 8px 16px; font-size: 16px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #f8f9fa; color: #202124; min-width: 180px;" onkeydown="if(event.key==='Enter') unlockMainGrid()">
            <button id="unlock-main-btn" onclick="unlockMainGrid()" style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined" style="font-size: 20px;">lock_open</span>Accéder
            </button>
        </div>
        <div id="main-access-message" style="margin-top: 12px; color: #5f6368; font-size: 14px;"></div>
        <div id="main-bingo-grid" style="margin-top: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 900px;"></div>
    </div>

    <!-- Admin Modal -->
    <div id="admin-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
        <div id="admin-modal" style="background: white; width: 80%; height: 80%; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; animation: fadeIn 0.2s ease-in-out;">
            <div style="padding: 16px 24px; border-bottom: 1px solid #dadce0; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;">
                <h2 style="margin: 0; font-family: 'Google Sans', sans-serif; font-size: 20px; color: #202124; display: flex; align-items: center; gap: 8px;"><span class="material-symbols-outlined" style="color: #1a73e8;">settings</span>Administration Bingo</h2>
                <button onclick="closeAdminModal()" style="background: none; border: none; cursor: pointer; color: #5f6368; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#e8eaed'" onmouseout="this.style.background='none'"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div style="padding: 24px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 32px;">
                <!-- Edit existing grid -->
                <div style="background: #f8f9fa; border: 1px solid #dadce0; border-radius: 8px; padding: 24px;">
                    <h3 style="margin: 0 0 16px; font-family: 'Google Sans', sans-serif; font-size: 18px; color: #202124; display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: #1a73e8; font-size: 22px;">edit</span>
                        Modifier une grille
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <select id="edit-qui-select" style="padding: 8px 12px; font-size: 14px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #ffffff; color: #202124; cursor: pointer; min-width: 160px;" onchange="handleAdminEditUserChange()">
                            <option value="">Pour qui ?</option>
                        </select>
                        <input type="password" id="admin-password" placeholder="Mot de passe" style="padding: 8px 12px; font-size: 14px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #ffffff; color: #202124; min-width: 180px;" onkeydown="if(event.key==='Enter') unlockAdminGrid()">
                        <button id="unlock-admin-btn" onclick="unlockAdminGrid()" style="background: #1a73e8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                            <span class="material-symbols-outlined" style="font-size: 20px;">lock_open</span>Accéder
                        </button>
                    </div>
                    <div id="admin-edit-section" style="display: none;">
                        <div id="admin-edit-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;"></div>
                        <div style="display: flex; justify-content: flex-end;">
                            <button id="save-admin-grid-btn" onclick="saveAdminGrid()" style="background: #34A853; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="font-size: 20px;">save</span>Enregistrer la grille
                            </button>
                        </div>
                    </div>
                    <div id="admin-edit-message" style="color: #5f6368; font-size: 14px; text-align: center; padding: 24px;">
                        Sélectionnez un utilisateur et entrez le mot de passe pour modifier sa grille.
                    </div>
                </div>

                <!-- Create from CSV -->
                <div style="border-top: 1px solid #dadce0; padding-top: 24px;">
                    <h3 style="margin: 0 0 16px; font-family: 'Google Sans', sans-serif; font-size: 18px; color: #202124; display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="color: #1a73e8; font-size: 22px;">upload_file</span>
                        Créer depuis un CSV
                    </h3>
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
                            </select>
                            <input type="password" id="create-password" placeholder="Mot de passe" style="padding: 8px 12px; font-size: 14px; font-family: 'Google Sans', sans-serif; border: 1px solid #dadce0; border-radius: 6px; outline: none; background: #ffffff; color: #202124; min-width: 160px;">
                            <button id="create-bingo-btn" onclick="createBingoSheets()" disabled style="background: #34A853; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: not-allowed; opacity: 0.5; font-family: 'Google Sans', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s, opacity 0.2s; white-space: nowrap;" onmouseover="if(!this.disabled) this.style.background='#2d9047'" onmouseout="if(!this.disabled) this.style.background='#34A853'"><span class="material-symbols-outlined" style="font-size: 20px;">print</span>Créer la feuille</button>
                        </div>
                    </div>
                    <div id="bingo-preview-grid" style="display: none; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #dadce0; border: 1px solid #dadce0; border-radius: 6px; overflow: hidden;">
                        <!-- Les champs seront injectés ici -->
                        <div style="grid-column: 1 / -1; text-align: center; color: #9aa0a6; padding: 40px; background: #ffffff;">
                            Aucune donnée chargée.
                        </div>
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
        loadUsers();
    }
});

function formatUserLabel(username) {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1);
}

function populateUserSelects(users) {
    const configs = [
        { id: 'qui-select', placeholder: 'Choisir' },
        { id: 'edit-qui-select', placeholder: 'Pour qui ?' },
        { id: 'admin-qui-select', placeholder: 'Pour qui ?' },
    ];

    configs.forEach(({ id, placeholder }) => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        users.forEach((user) => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = formatUserLabel(user);
            select.appendChild(option);
        });

        if (users.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

async function loadUsers() {
    try {
        const res = await fetch(BINGO_API_URL);
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        populateUserSelects(data.users || []);
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

// Admin Modal Logic
window.openAdminModal = function() {
    document.getElementById('admin-modal-overlay').style.display = 'flex';
    loadUsers();
}

window.closeAdminModal = function() {
    document.getElementById('admin-modal-overlay').style.display = 'none';
    resetAdminEditState();
}

function resetAdminEditState() {
    adminEditFields = [];
    adminEditUsername = '';
    adminVerifiedPassword = '';
    const editSection = document.getElementById('admin-edit-section');
    const editMessage = document.getElementById('admin-edit-message');
    if (editSection) editSection.style.display = 'none';
    if (editMessage) {
        editMessage.style.display = 'block';
        editMessage.style.color = '#5f6368';
        editMessage.textContent = 'Sélectionnez un utilisateur et entrez le mot de passe pour modifier sa grille.';
    }
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) passwordInput.value = '';
}

window.handleAdminEditUserChange = function() {
    resetAdminEditState();
}

window.unlockAdminGrid = async function() {
    const username = document.getElementById('edit-qui-select').value;
    const password = document.getElementById('admin-password').value;
    const btn = document.getElementById('unlock-admin-btn');
    const messageEl = document.getElementById('admin-edit-message');
    const editSection = document.getElementById('admin-edit-section');

    if (!username) {
        alert('Veuillez sélectionner un utilisateur.');
        return;
    }
    if (!password) {
        alert('Veuillez entrer le mot de passe.');
        return;
    }

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; animation: spin 2s linear infinite;">sync</span>Vérification...';

    try {
        const verifyRes = await fetch(BINGO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verify', username, password })
        });

        if (verifyRes.status === 401) {
            messageEl.style.display = 'block';
            messageEl.style.color = '#c5221f';
            messageEl.textContent = 'Mot de passe incorrect.';
            editSection.style.display = 'none';
            return;
        }

        if (!verifyRes.ok) {
            const err = await verifyRes.json().catch(() => ({}));
            throw new Error(err.message || 'Erreur de vérification');
        }

        const gridRes = await fetch(BINGO_API_URL + '?username=' + encodeURIComponent(username));
        if (gridRes.status === 404) {
            messageEl.style.display = 'block';
            messageEl.style.color = '#c5221f';
            messageEl.textContent = 'Aucune grille trouvée pour ' + username + '.';
            editSection.style.display = 'none';
            return;
        }
        if (!gridRes.ok) throw new Error('Erreur lors du chargement');

        const data = await gridRes.json();
        adminEditUsername = username;
        adminVerifiedPassword = password;
        adminEditFields = (data.grid || []).map(field => ({
            qui: field.qui || '',
            quoi: field.quoi || '',
            checked: !!field.checked
        }));

        messageEl.style.display = 'none';
        editSection.style.display = 'block';
        renderAdminEditGrid();
    } catch (err) {
        console.error(err);
        messageEl.style.display = 'block';
        messageEl.style.color = '#c5221f';
        messageEl.textContent = 'Erreur lors de la vérification.';
        editSection.style.display = 'none';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

function renderAdminEditGrid() {
    const grid = document.getElementById('admin-edit-grid');
    grid.innerHTML = '';

    if (adminEditFields.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #5f6368; padding: 24px; background: white; border-radius: 8px; border: 1px solid #dadce0;">La grille est vide.</div>';
        return;
    }

    adminEditFields.forEach((field, index) => {
        const tile = document.createElement('div');
        tile.style.background = 'white';
        tile.style.border = '1px solid #dadce0';
        tile.style.borderRadius = '8px';
        tile.style.padding = '12px';
        tile.style.display = 'flex';
        tile.style.flexDirection = 'column';
        tile.style.gap = '8px';
        tile.style.minHeight = '120px';

        const quiInput = document.createElement('input');
        quiInput.type = 'text';
        quiInput.value = field.qui;
        quiInput.placeholder = 'Qui';
        quiInput.style.fontSize = '16px';
        quiInput.style.fontWeight = '500';
        quiInput.style.fontFamily = "'Google Sans', sans-serif";
        quiInput.style.border = '1px solid #dadce0';
        quiInput.style.borderRadius = '4px';
        quiInput.style.padding = '6px 8px';
        quiInput.style.textAlign = 'center';
        quiInput.style.outline = 'none';
        quiInput.onfocus = () => { quiInput.style.borderColor = '#1a73e8'; };
        quiInput.onblur = () => { quiInput.style.borderColor = '#dadce0'; };
        quiInput.oninput = (e) => { adminEditFields[index].qui = e.target.value; };

        const quoiInput = document.createElement('textarea');
        quoiInput.value = field.quoi;
        quoiInput.placeholder = 'Quoi';
        quoiInput.rows = 2;
        quoiInput.style.fontSize = '13px';
        quoiInput.style.fontFamily = "'Google Sans', sans-serif";
        quoiInput.style.border = '1px solid #dadce0';
        quoiInput.style.borderRadius = '4px';
        quoiInput.style.padding = '6px 8px';
        quoiInput.style.textAlign = 'center';
        quoiInput.style.resize = 'vertical';
        quoiInput.style.outline = 'none';
        quoiInput.onfocus = () => { quoiInput.style.borderColor = '#1a73e8'; };
        quoiInput.onblur = () => { quoiInput.style.borderColor = '#dadce0'; };
        quoiInput.oninput = (e) => { adminEditFields[index].quoi = e.target.value; };

        tile.appendChild(quiInput);
        tile.appendChild(quoiInput);
        grid.appendChild(tile);
    });
}

window.saveAdminGrid = async function() {
    if (!adminEditUsername || !adminVerifiedPassword) return;

    const btn = document.getElementById('save-admin-grid-btn');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; animation: spin 2s linear infinite;">sync</span>Enregistrement...';

    try {
        const res = await fetch(BINGO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                username: adminEditUsername,
                grid: adminEditFields,
                password: adminVerifiedPassword
            })
        });

        if (res.status === 401) {
            alert('Mot de passe incorrect. Veuillez vous reconnecter.');
            resetAdminEditState();
            return;
        }

        if (!res.ok) {
            throw new Error("Erreur de l'API (" + res.status + ")");
        }

        alert('Grille enregistrée avec succès pour ' + adminEditUsername + ' !');

        await loadUsers();

        const mainSelect = document.getElementById('qui-select');
        if (mainSelect && mainSelect.value === adminEditUsername && currentUsername === adminEditUsername) {
            await fetchBingoGrid(adminEditUsername, document.getElementById('main-bingo-grid'));
        }
    } catch (err) {
        console.error(err);
        alert('Erreur lors de la sauvegarde de la grille.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

window.createBingoSheets = async function() {
    const selectedPerson = document.getElementById('admin-qui-select').value;
    const password = document.getElementById('create-password').value;
    if (!selectedPerson) return;

    if (!password) {
        alert('Veuillez entrer le mot de passe.');
        return;
    }

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
            grid: currentParsedFields.map(f => ({ qui: f.qui, quoi: f.quoi, checked: false })),
            password
        };

        let res = await fetch(BINGO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            alert('Mot de passe incorrect.');
            return;
        }

        if (!res.ok) {
            throw new Error("Erreur de l'API (" + res.status + ")");
        }

        alert("Données enregistrées avec succès pour " + selectedPerson + " !");

        await loadUsers();

        const mainSelect = document.getElementById('qui-select');
        if (mainSelect && mainSelect.value === selectedPerson && currentUsername === selectedPerson) {
            await fetchBingoGrid(selectedPerson, document.getElementById('main-bingo-grid'));
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

function applyTileSelectedStyles(tile, selected) {
    tile.dataset.selected = selected ? 'true' : 'false';
    if (selected) {
        tile.style.background = '#e6f4ea';
        tile.style.borderColor = '#34A853';
        tile.style.transform = 'scale(0.98)';
        tile.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
    } else {
        tile.style.background = 'white';
        tile.style.borderColor = '#dadce0';
        tile.style.transform = 'translateY(0)';
        tile.style.boxShadow = '0 1px 2px rgba(60,64,67,0.1)';
    }
}

async function saveBingoGrid(username, grid) {
    const res = await fetch(BINGO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ username, grid })
    });

    if (!res.ok) {
        throw new Error("Erreur de l'API (" + res.status + ")");
    }
}

// Main View API Logic
window.handleMainUserChange = function() {
    currentUsername = '';
    currentGridFields = [];
    const container = document.getElementById('main-bingo-grid');
    const messageEl = document.getElementById('main-access-message');
    if (container) container.innerHTML = '';
    if (messageEl) {
        messageEl.style.color = '#5f6368';
        messageEl.textContent = '';
    }
}

window.unlockMainGrid = async function() {
    const username = document.getElementById('qui-select').value;
    const password = document.getElementById('main-password').value;
    const btn = document.getElementById('unlock-main-btn');
    const messageEl = document.getElementById('main-access-message');
    const container = document.getElementById('main-bingo-grid');

    if (!username) {
        alert('Veuillez sélectionner un utilisateur.');
        return;
    }
    if (!password) {
        alert('Veuillez entrer le mot de passe.');
        return;
    }

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px; animation: spin 2s linear infinite;">sync</span>Vérification...';

    try {
        const verifyRes = await fetch(BINGO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verify', username, password })
        });

        if (verifyRes.status === 401) {
            messageEl.style.color = '#c5221f';
            messageEl.textContent = 'Mot de passe incorrect.';
            currentUsername = '';
            currentGridFields = [];
            if (container) container.innerHTML = '';
            return;
        }

        if (!verifyRes.ok) {
            const err = await verifyRes.json().catch(() => ({}));
            throw new Error(err.message || 'Erreur de vérification');
        }

        messageEl.style.color = '#5f6368';
        messageEl.textContent = '';
        await fetchBingoGrid(username, container);
    } catch (err) {
        console.error(err);
        messageEl.style.color = '#c5221f';
        messageEl.textContent = 'Erreur lors de la vérification.';
        currentUsername = '';
        currentGridFields = [];
        if (container) container.innerHTML = '';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

window.fetchBingoGrid = async function(username, container) {
    if (!container) container = document.getElementById('main-bingo-grid');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #5f6368; padding: 40px;"><span class="material-symbols-outlined" style="animation: spin 2s linear infinite; display: block; margin-bottom: 12px; font-size: 32px;">sync</span> Chargement de la grille...</div>';
    
    try {
        const res = await fetch(BINGO_API_URL + '?username=' + encodeURIComponent(username));
        
        if (res.status === 404) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #5f6368; padding: 40px; background: white; border-radius: 8px; border: 1px solid #dadce0;">Aucune grille trouvée pour ' + username + '</div>';
            return;
        }
        
        if (!res.ok) {
            throw new Error('Erreur API');
        }
        
        const data = await res.json();
        const fields = (data.grid || []).map(field => ({
            qui: field.qui,
            quoi: field.quoi,
            checked: !!field.checked
        }));
        currentUsername = username;
        currentGridFields = fields;
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
    
    fields.forEach((field, index) => {
        const div = document.createElement('div');
        div.dataset.index = String(index);
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
        
        applyTileSelectedStyles(div, !!field.checked);

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
        
        div.onclick = async function() {
            const tileIndex = parseInt(this.dataset.index, 10);
            const wasSelected = this.dataset.selected === 'true';
            const newSelected = !wasSelected;

            applyTileSelectedStyles(this, newSelected);
            currentGridFields[tileIndex].checked = newSelected;

            try {
                await saveBingoGrid(currentUsername, currentGridFields);
            } catch (err) {
                console.error(err);
                currentGridFields[tileIndex].checked = wasSelected;
                applyTileSelectedStyles(this, wasSelected);
                alert('Erreur lors de la sauvegarde de la case.');
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
