/**
 * DashStyle Custom Dashboard Element
 *
 * This class defines the custom element <dash-style> which renders a fully
 * configurable dashboard. It includes a main view (placeholder) and a
 * comprehensive admin panel for configuration.
 */
class DashStyle extends HTMLElement {

    /**
     * Constructor for the DashStyle class.
     * Initializes the shadow DOM and the default configuration object.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // This will be populated with the loaded config.
        this.config = {
            rooms: [],
            styles: {}
        };
        // A flag to ensure we only load the config once.
        this._configLoaded = false;
    }

    /**
     * The `hass` setter is called by Home Assistant when the state changes.
     * It's the main entry point for data and updates.
     * @param {object} hass The Home Assistant state object.
     */
    set hass(hass) {
        if (!hass) return;
        this._hass = hass;

        // Determine admin status from the user object.
        this.isAdmin = this._hass.user?.is_admin || false; 

        // Load the configuration from the backend, but only on the first run.
        if (!this._configLoaded) {
            this._configLoaded = true;
            this._loadConfig();
        }
        
        // The main render logic is only called once to build the initial structure.
        if (!this.content) {
            this.content = document.createElement('div');
            this.shadowRoot.appendChild(this.content);
            // Initial render call. It will be re-rendered once config is loaded.
            this.render();
        }
    }

    /**
     * Renders the initial HTML structure and CSS for the component.
     */
    render() {
        if (!this.content) return;
        
        this.content.innerHTML = `
            <style>
                .admin-panel {
                    /* The admin panel is only shown if isAdmin is true */
                    display: ${this.isAdmin ? 'block' : 'none'};
                    padding: 16px;
                    font-family: Arial, sans-serif;
                }
                .status-message {
                    padding: 10px;
                    margin-bottom: 16px;
                    border-radius: 4px;
                    display: none;
                    border: 1px solid transparent;
                }
                .status-message.success {
                    background-color: #dff0d8;
                    border-color: #d6e9c6;
                    color: #3c763d;
                }
                .status-message.error {
                    background-color: #f2dede;
                    border-color: #ebccd1;
                    color: #a94442;
                }
                .tabs { display: flex; border-bottom: 1px solid #ccc; margin-bottom: 16px; }
                .tab { padding: 8px 16px; cursor: pointer; border-radius: 4px 4px 0 0; }
                .tab.active { border-bottom: 2px solid var(--primary-color, #03a9f4); font-weight: bold; background-color: #f0f0f0; }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .config-section { background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
                h1, h2, h3, h4 { margin-top: 0; padding-bottom: 8px; }
                h3 { border-bottom: 1px solid #eee; }
                .form-group { margin-bottom: 12px; }
                label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9em; color: #555; }
                input[type="text"], input[type="color"], select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                button { background-color: var(--primary-color, #03a9f4); color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
                button:hover { opacity: 0.8; }
                button:disabled { background-color: #ccc; cursor: not-allowed; }
                button.delete { background-color: var(--error-color, #db4437); }
                .item-list { list-style: none; padding-left: 0; }
                .item-list li { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
                .item-list li:last-child { border-bottom: none; }
                .item-list ha-icon { margin-right: 8px; color: #777; }
            </style>

            <!-- Main dashboard view (to be implemented in later steps) -->
            <div id="main-view"></div>

            <!-- Admin Configuration Panel -->
            <div id="admin-view" class="admin-panel">
                <h1>DashStyle Configuration</h1>
                <div id="status-message" class="status-message"></div>
                <div class="tabs">
                    <div class="tab active" data-tab="rooms">Rooms & Entities</div>
                    <div class="tab" data-tab="styling">Styling</div>
                </div>
                <div id="tab-rooms" class="tab-content active">Loading...</div>
                <div id="tab-styling" class="tab-content">Loading...</div>
                <button id="save-config">Save Configuration</button>
            </div>
        `;

        this._addEventListeners();
        this._renderAdminTabs();
    }

    /**
     * Adds initial event listeners for the main UI components.
     */
    _addEventListeners() {
        const tabs = this.content.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this._handleTabClick(e.target));
        });
        this.content.querySelector('#save-config').addEventListener('click', () => this._saveConfig());
    }
    
    /**
     * Handles the click event on a tab to show the correct content panel.
     * @param {HTMLElement} clickedTab The tab element that was clicked.
     */
    _handleTabClick(clickedTab) {
        this.content.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        this.content.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const tabName = clickedTab.dataset.tab;
        clickedTab.classList.add('active');
        this.content.querySelector(`#tab-${tabName}`).classList.add('active');
    }

    /**
     * Central function to render the content of all admin tabs.
     */
    _renderAdminTabs() {
        if (!this.content) return;
        this._renderRoomsTab();
        this._renderStylingTab();
    }

    _renderRoomsTab() {
        const container = this.content.querySelector('#tab-rooms');
        if (!container) return;

        const addRoomHtml = `
            <div class="config-section">
                <h3>Add New Room</h3>
                <div class="form-group"><label for="new-room-name">Room Name</label><input type="text" id="new-room-name" placeholder="e.g., Living Room"></div>
                <div class="form-group"><label for="new-room-icon">Icon (e.g., mdi:sofa)</label><input type="text" id="new-room-icon" placeholder="mdi:home"></div>
                <button id="add-room">Add Room</button>
            </div>`;
        const roomsHtml = (this.config.rooms || []).map((room, roomIndex) => {
            const entitiesHtml = (room.entities || []).map((entity, entityIndex) => `
                <li data-entity-index="${entityIndex}">
                    <span><strong>ID:</strong> ${entity.id} | <strong>Type:</strong> ${entity.type} ${entity.subtype ? `| <strong>Subtype:</strong> ${entity.subtype}` : ''}</span>
                    <button class="delete delete-entity">Delete</button>
                </li>`).join('');

            return `
                <div class="config-section" data-room-index="${roomIndex}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3><ha-icon icon="${room.icon || 'mdi:alert-circle-outline'}"></ha-icon> ${room.name}</h3>
                        <button class="delete delete-room">Delete Room</button>
                    </div>
                    <h4>Entities in ${room.name}</h4>
                    ${(room.entities || []).length > 0 ? `<ul class="item-list">${entitiesHtml}</ul>` : `<p>No entities added yet.</p>`}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
                    <h4>Add New Entity to ${room.name}</h4>
                    <div class="form-group"><label>Entity ID</label><input type="text" class="new-entity-id" placeholder="e.g., light.living_room_main"></div>
                    <div class="form-group">
                        <label>Type</label>
                        <select class="new-entity-type">
                            <option value="light">Light</option><option value="cover">Cover</option><option value="sensor">Sensor</option>
                            <option value="media_player">Media Player</option><option value="scene">Scene</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Subtype (optional)</label><input type="text" class="new-entity-subtype" placeholder="temperature, humidity, etc."></div>
                    <button class="add-entity">Add Entity</button>
                </div>`;
        }).join('');

        container.innerHTML = addRoomHtml + (this.config.rooms && this.config.rooms.length > 0 ? `<h2>Existing Rooms</h2>${roomsHtml}` : '');
        
        container.querySelector('#add-room').addEventListener('click', () => this._addRoom());
        container.querySelectorAll('.delete-room').forEach(button => button.addEventListener('click', (e) => this._deleteRoom(parseInt(e.target.closest('.config-section').dataset.roomIndex, 10))));
        container.querySelectorAll('.add-entity').forEach(button => button.addEventListener('click', (e) => this._addEntity(parseInt(e.target.closest('.config-section').dataset.roomIndex, 10))));
        container.querySelectorAll('.delete-entity').forEach(button => button.addEventListener('click', (e) => this._deleteEntity(parseInt(e.target.closest('.config-section').dataset.roomIndex, 10), parseInt(e.target.closest('li').dataset.entityIndex, 10))));
    }
    
    _renderStylingTab() {
        const container = this.content.querySelector('#tab-styling');
        if (!container) return;

        const styles = this.config.styles || {};
        const primaryColor = styles['primary-color'] || '#03a9f4';
        const accentColor = styles['accent-color'] || '#ff9800';
        const primaryFont = styles['primary-font-family'] || 'Arial, sans-serif';
        const secondaryFont = styles['secondary-font-family'] || 'Verdana, sans-serif';

        container.innerHTML = `
            <div class="config-section">
                <h3>Colors</h3>
                <div class="form-group"><label for="primary-color">Primary Color</label><input type="color" id="primary-color" value="${primaryColor}"></div>
                <div class="form-group"><label for="accent-color">Accent Color</label><input type="color" id="accent-color" value="${accentColor}"></div>
            </div>
            <div class="config-section">
                <h3>Fonts</h3>
                <div class="form-group"><label for="primary-font">Primary Font Family</label><input type="text" id="primary-font" value="${primaryFont}"></div>
                <div class="form-group"><label for="secondary-font">Secondary Font Family</label><input type="text" id="secondary-font" value="${secondaryFont}"></div>
            </div>`;
            
        container.querySelector('#primary-color').addEventListener('input', (e) => { this.config.styles['primary-color'] = e.target.value; });
        container.querySelector('#accent-color').addEventListener('input', (e) => { this.config.styles['accent-color'] = e.target.value; });
        container.querySelector('#primary-font').addEventListener('input', (e) => { this.config.styles['primary-font-family'] = e.target.value; });
        container.querySelector('#secondary-font').addEventListener('input', (e) => { this.config.styles['secondary-font-family'] = e.target.value; });
    }

    _addRoom() {
        const nameInput = this.content.querySelector('#new-room-name');
        const iconInput = this.content.querySelector('#new-room-icon');
        if (nameInput.value) {
            if (!this.config.rooms) this.config.rooms = [];
            this.config.rooms.push({ name: nameInput.value, icon: iconInput.value || 'mdi:home', entities: [] });
            nameInput.value = ''; iconInput.value = '';
            this._renderRoomsTab();
        } else { alert('Room name is required.'); }
    }

    _deleteRoom(index) {
        if (confirm(`Are you sure you want to delete the room: "${this.config.rooms[index].name}"?`)) {
            this.config.rooms.splice(index, 1);
            this._renderRoomsTab();
        }
    }

    _addEntity(roomIndex) {
        const roomSection = this.content.querySelector(`.config-section[data-room-index='${roomIndex}']`);
        const idInput = roomSection.querySelector('.new-entity-id');
        if (idInput.value) {
            const entity = {
                id: idInput.value,
                type: roomSection.querySelector('.new-entity-type').value,
                subtype: roomSection.querySelector('.new-entity-subtype').value || undefined
            };
            if (!this.config.rooms[roomIndex].entities) this.config.rooms[roomIndex].entities = [];
            this.config.rooms[roomIndex].entities.push(entity);
            this._renderRoomsTab();
        } else { alert('Entity ID is required.'); }
    }

    _deleteEntity(roomIndex, entityIndex) {
        const entityId = this.config.rooms[roomIndex].entities[entityIndex].id;
        if (confirm(`Are you sure you want to delete the entity: "${entityId}"?`)) {
            this.config.rooms[roomIndex].entities.splice(entityIndex, 1);
            this._renderRoomsTab();
        }
    }

    /**
     * Fetches the configuration from the Home Assistant backend.
     */
    async _loadConfig() {
        if (!this._hass) return;
        try {
            this.config = await this._hass.callWS({ type: 'dashstyle/config/load' });
            this._renderAdminTabs(); // Re-render with the loaded config
        } catch (error) {
            console.error("Error loading DashStyle config:", error);
            this._showStatusMessage("Error loading configuration.", "error");
        }
    }

    /**
     * Sends the current configuration to the Home Assistant backend to be saved.
     */
    async _saveConfig() {
        if (!this._hass) return;
        const saveButton = this.content.querySelector('#save-config');
        saveButton.disabled = true;
        saveButton.innerText = "Saving...";
        
        try {
            const result = await this._hass.callWS({
                type: 'dashstyle/config/save',
                config: this.config
            });
            if (result.success) {
                this._showStatusMessage("Configuration saved successfully!", "success");
            } else {
                throw new Error("Save operation returned success: false");
            }
        } catch (error) {
            console.error("Error saving DashStyle config:", error);
            this._showStatusMessage(`An error occurred while saving: ${error.message}`, "error");
        } finally {
            saveButton.disabled = false;
            saveButton.innerText = "Save Configuration";
        }
    }
    
    /**
     * Displays a status message to the user (e.g., success or error).
     * @param {string} message The message to display.
     * @param {string} type 'success' or 'error'.
     */
    _showStatusMessage(message, type = 'success') {
        const messageElement = this.content.querySelector('#status-message');
        if (!messageElement) return;
        messageElement.textContent = message;
        messageElement.className = `status-message ${type}`;
        messageElement.style.display = 'block';
        setTimeout(() => { messageElement.style.display = 'none'; }, 5000);
    }
}

customElements.define('dash-style', DashStyle);
