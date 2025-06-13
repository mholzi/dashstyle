/**
 * DashStyle Custom Dashboard Element
 *
 * This class defines the custom element <dash-style> which renders a fully
 * configurable dashboard. It includes a dynamic main view for users and a
 * comprehensive admin panel for configuration.
 */
class DashStyle extends HTMLElement {

    /**
     * Constructor for the DashStyle class.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Initialize with default empty structures.
        this.config = { rooms: [], styles: {} };
        this._configLoaded = false;
        this._mainViewRendered = false;
    }

    /**
     * The `hass` setter is the main entry point for data and updates from Home Assistant.
     * @param {object} hass The Home Assistant state object.
     */
    set hass(hass) {
        if (!hass) return;
        this._hass = hass;
        this.isAdmin = this._hass.user?.is_admin || false; 

        // Load the configuration from the backend, but only on the first run.
        if (!this._configLoaded) {
            this._configLoaded = true;
            this._loadConfig();
        }
        
        // Render the skeleton structure once.
        if (!this.content) {
            this.content = document.createElement('div');
            this.shadowRoot.appendChild(this.content);
            this.render();
        }

        // After the main view exists, efficiently update its entity states.
        if (this._mainViewRendered) {
            this._updateEntityStates();
        }
    }

    /**
     * Renders the component's skeleton HTML and all necessary styles.
     */
    render() {
        this.content.innerHTML = `
            <style id="dashstyle-theme"></style>
            <style>
                /* Base variables for the dashboard */
                :host {
                    --dp-primary-color: #03a9f4;
                    --dp-accent-color: #ff9800;
                    --dp-text-color: #212121;
                    --dp-light-text-color: #ffffff;
                    --dp-bg-color: #f5f5f5;
                    --dp-card-bg-color: #ffffff;
                    --dp-primary-font: 'Arial', sans-serif;
                    --dp-card-border-radius: 12px;
                    --dp-error-color: #db4437;
                }

                /* View toggling logic */
                .admin-panel { display: none; }
                .view-wrapper.admin-mode .admin-panel { display: block; }
                .view-wrapper.admin-mode #main-view { display: none; }
                .view-wrapper.admin-mode #admin-toggle {
                    background-color: var(--dp-accent-color);
                }

                /* Main Dashboard View Styles */
                #main-view {
                    padding: 8px;
                    background-color: var(--dp-bg-color);
                    font-family: var(--dp-primary-font);
                }
                .room {
                    margin-bottom: 24px;
                }
                .room-title {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0 8px 12px;
                    color: var(--dp-text-color);
                    display: flex;
                    align-items: center;
                }
                .room-title ha-icon {
                    color: var(--dp-primary-color);
                    margin-right: 8px;
                }
                .entities {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 12px;
                }
                .card {
                    background-color: var(--dp-card-bg-color);
                    padding: 12px;
                    border-radius: var(--dp-card-border-radius);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.15s ease-in-out, background-color 0.2s;
                    color: var(--dp-text-color);
                    text-align: center;
                }
                .card:active {
                    transform: scale(0.95);
                }
                .card.on {
                    background-color: var(--dp-accent-color);
                    color: var(--dp-light-text-color);
                }
                .card.on ha-icon, .card.on .state {
                    color: var(--dp-light-text-color);
                }
                .card ha-icon {
                    font-size: 2.5em;
                    --mdc-icon-size: 2.5em;
                    color: var(--dp-primary-color);
                    margin-bottom: 8px;
                }
                .card .name {
                    font-weight: bold;
                    margin-bottom: 4px;
                    font-size: 1em;
                }
                .card .state {
                    font-size: 0.9em;
                    color: #888;
                }

                /* Admin Panel Styles */
                #admin-toggle { 
                    position: absolute; 
                    top: 16px; 
                    right: 16px; 
                    z-index: 10;
                    background-color: var(--dp-primary-color);
                    color: var(--dp-light-text-color);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 16px;
                }
                .admin-panel { padding: 16px; font-family: Arial, sans-serif; }
                .status-message { padding: 10px; margin-bottom: 16px; border-radius: 4px; display: none; border: 1px solid transparent; }
                .status-message.success { background-color: #dff0d8; border-color: #d6e9c6; color: #3c763d; }
                .status-message.error { background-color: #f2dede; border-color: #ebccd1; color: #a94442; }
                .tabs { display: flex; border-bottom: 1px solid #ccc; margin-bottom: 16px; }
                .tab { padding: 8px 16px; cursor: pointer; border-radius: 4px 4px 0 0; }
                .tab.active { border-bottom: 2px solid var(--dp-primary-color); font-weight: bold; background-color: #f0f0f0; }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .config-section { background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
                h1, h2, h3, h4 { margin-top: 0; padding-bottom: 8px; }
                h3 { border-bottom: 1px solid #eee; }
                .form-group { margin-bottom: 12px; }
                label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9em; color: #555; }
                input[type="text"], input[type="color"], select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                button:disabled { background-color: #ccc; cursor: not-allowed; }
                button.delete { background-color: var(--dp-error-color); }
                .item-list { list-style: none; padding-left: 0; }
                .item-list li { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
                .item-list li:last-child { border-bottom: none; }
                .item-list ha-icon { margin-right: 8px; color: #777; }
            </style>
            <div class="view-wrapper">
                <button id="admin-toggle" style="display: ${this.isAdmin ? 'block' : 'none'};">Admin</button>
                <div id="main-view"></div>
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
            </div>
        `;
        this._addEventListeners();
    }
    
    /**
     * Sets up all event listeners for both the main view and the admin panel.
     * Uses event delegation for efficiency.
     */
    _addEventListeners() {
        // Main view and admin toggle listeners
        this.content.querySelector('#admin-toggle').addEventListener('click', () => {
            this.content.querySelector('.view-wrapper').classList.toggle('admin-mode');
        });
        
        this.content.querySelector('#main-view').addEventListener('click', e => {
            const card = e.target.closest('.card[data-entity-id]');
            if (card) {
                this._handleCardClick(card.dataset.entityId);
            }
        });

        // Admin panel listeners (delegated)
        const adminPanel = this.content.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.addEventListener('click', e => {
                if (e.target.matches('.tab')) this._handleTabClick(e.target);
                if (e.target.matches('#save-config')) this._saveConfig();
                if (e.target.matches('#add-room')) this._addRoom();
                if (e.target.matches('.delete-room')) this._deleteRoom(parseInt(e.target.closest('.config-section').dataset.roomIndex, 10));
                if (e.target.matches('.add-entity')) this._addEntity(parseInt(e.target.closest('.config-section').dataset.roomIndex, 10));
                if (e.target.matches('.delete-entity')) this._deleteEntity(parseInt(e.target.closest('.config-section').dataset.roomIndex, 10), parseInt(e.target.closest('li').dataset.entityIndex, 10));
            });
        }
    }

    /**
     * Handles clicks on interactive cards in the main view to perform actions.
     * @param {string} entityId The ID of the entity that was clicked.
     */
    _handleCardClick(entityId) {
        const domain = entityId.split('.')[0];
        const state = this._hass.states[entityId];
        if (!state) return;

        // Map domains to their typical toggle/action service
        const serviceMap = {
            'light': 'toggle',
            'switch': 'toggle',
            'scene': 'turn_on',
            'script': 'turn_on',
            'cover': state.state === 'closed' ? 'open_cover' : 'close_cover',
        };
        
        if (serviceMap[domain]) {
            this._hass.callService(domain, serviceMap[domain], { entity_id: entityId });
        } else {
            console.log(`No default click action for domain: ${domain}`);
        }
    }

    /**
     * Renders the main dashboard view based on the current configuration.
     */
    _renderMainView() {
        const mainView = this.content.querySelector('#main-view');
        if (!mainView || !this.config || !this.config.rooms) return;
        
        mainView.innerHTML = (this.config.rooms || []).map(room => `
            <div class="room">
                <h2 class="room-title"><ha-icon icon="${room.icon || 'mdi:home'}"></ha-icon> ${room.name}</h2>
                <div class="entities">
                    ${(room.entities || []).map(entity => this._createEntityCard(entity)).join('')}
                </div>
            </div>
        `).join('');
        
        this._mainViewRendered = true;
        this._updateEntityStates();
    }

    /**
     * Creates the HTML for a single entity card.
     * @param {object} entityConf The configuration object for the entity.
     * @returns {string} The HTML string for the card.
     */
    _createEntityCard(entityConf) {
        const entityId = entityConf.id;
        const entityState = this._hass.states[entityId];

        if (!entityState) {
            return `<div class="card" data-entity-id="${entityId}">
                        <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                        <div class="name">${entityId.split('.')[1].replace(/_/g, ' ')}</div>
                        <div class="state">Not Found</div>
                    </div>`;
        }

        const name = entityState.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
        let icon = entityState.attributes.icon || 'mdi:flash';
        let stateText = entityState.state;

        // Custom logic for different domains for better representation
        const domain = entityId.split('.')[0];
        if (domain === 'sensor' && entityState.attributes.unit_of_measurement) {
            stateText = `${entityState.state} ${entityState.attributes.unit_of_measurement}`;
        }
        if (domain === 'cover') {
            icon = `mdi:window-${entityState.state === 'closed' ? 'closed' : 'open'}`;
        }

        return `<div class="card" data-entity-id="${entityId}">
                    <ha-icon icon="${icon}"></ha-icon>
                    <div class="name">${name}</div>
                    <div class="state">${stateText}</div>
                </div>`;
    }

    /**
     * Efficiently updates the state and appearance of cards in the main view.
     * This is called every time the hass object updates.
     */
    _updateEntityStates() {
        if (!this.content) return;
        const cards = this.content.querySelectorAll('.card[data-entity-id]');
        cards.forEach(card => {
            const entityId = card.dataset.entityId;
            const entityState = this._hass.states[entityId];
            if (!entityState) return;

            const stateEl = card.querySelector('.state');
            if (stateEl) {
                let stateText = entityState.state;
                if (entityState.attributes.unit_of_measurement) {
                    stateText = `${entityState.state} ${entityState.attributes.unit_of_measurement}`;
                }
                stateEl.textContent = stateText;
            }

            if (entityId.startsWith('cover.')) {
                const iconEl = card.querySelector('ha-icon');
                if (iconEl) iconEl.icon = `mdi:window-${entityState.state === 'closed' ? 'closed' : 'open'}`;
            }

            // Toggle 'on' class for entities that are considered "active"
            if (['on', 'open', 'playing'].includes(entityState.state)) {
                card.classList.add('on');
            } else {
                card.classList.remove('on');
            }
        });
    }
    
    /**
     * Injects the user-defined styles into the shadow DOM.
     */
    _applyStyles() {
        const styleEl = this.shadowRoot.getElementById('dashstyle-theme');
        if (!styleEl || !this.config || !this.config.styles) return;

        const styles = this.config.styles;
        styleEl.innerHTML = `
            :host {
                --dp-primary-color: ${styles['primary-color'] || '#03a9f4'};
                --dp-accent-color: ${styles['accent-color'] || '#ff9800'};
                --dp-primary-font: ${styles['primary-font-family'] || 'Arial, sans-serif'};
            }
        `;
    }
    
    // =====================================================================
    // Admin Panel Methods
    // =====================================================================

    _handleTabClick(clickedTab) {
        this.content.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        this.content.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const tabName = clickedTab.dataset.tab;
        clickedTab.classList.add('active');
        this.content.querySelector(`#tab-${tabName}`).classList.add('active');
    }

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
                <div class="form-group"><label for="new-room-icon">Icon</label><input type="text" id="new-room-icon" placeholder="e.g., mdi:sofa"></div>
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
                    <h4>Add New Entity</h4>
                    <div class="form-group"><label>Entity ID</label><input type="text" class="new-entity-id" placeholder="e.g., light.living_room_main"></div>
                    <div class="form-group">
                        <label>Type</label>
                        <select class="new-entity-type">
                            <option value="light">Light</option><option value="cover">Cover</option><option value="sensor">Sensor</option>
                            <option value="media_player">Media Player</option><option value="scene">Scene</option><option value="switch">Switch</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Subtype (optional)</label><input type="text" class="new-entity-subtype" placeholder="temperature, humidity, etc."></div>
                    <button class="add-entity">Add Entity</button>
                </div>`;
        }).join('');
        container.innerHTML = addRoomHtml + (this.config.rooms && this.config.rooms.length > 0 ? `<h2>Existing Rooms</h2>${roomsHtml}` : '');
    }
    
    _renderStylingTab() {
        const container = this.content.querySelector('#tab-styling');
        if (!container) return;
        const styles = this.config.styles || {};
        const primaryColor = styles['primary-color'] || '#03a9f4';
        const accentColor = styles['accent-color'] || '#ff9800';
        const primaryFont = styles['primary-font-family'] || 'Arial, sans-serif';

        container.innerHTML = `
            <div class="config-section">
                <h3>Colors</h3>
                <div class="form-group"><label for="primary-color">Primary Color</label><input type="color" id="primary-color" value="${primaryColor}"></div>
                <div class="form-group"><label for="accent-color">Accent Color</label><input type="color" id="accent-color" value="${accentColor}"></div>
            </div>
            <div class="config-section">
                <h3>Fonts</h3>
                <div class="form-group"><label for="primary-font">Primary Font Family</label><input type="text" id="primary-font" value="${primaryFont}"></div>
            </div>`;
        
        const styleInputs = container.querySelectorAll('input');
        styleInputs.forEach(input => {
            input.addEventListener('input', e => {
                const styleKey = e.target.id.replace(/-/g, '_');
                this.config.styles[styleKey] = e.target.value;
            });
        });
    }

    _addRoom() {
        const nameInput = this.content.querySelector('#new-room-name');
        const iconInput = this.content.querySelector('#new-room-icon');
        if (nameInput.value) {
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

    async _loadConfig() {
        if (!this._hass) return;
        try {
            this.config = await this._hass.callWS({ type: 'dashstyle/config/load' }) || { rooms: [], styles: {} };
            this._applyStyles();
            this._renderMainView();
            this._renderAdminTabs();
        } catch (error) {
            console.error("Error loading DashStyle config:", error);
            this._showStatusMessage("Error loading configuration.", "error");
        }
    }

    async _saveConfig() {
        if (!this._hass) return;
        const saveButton = this.content.querySelector('#save-config');
        saveButton.disabled = true;
        saveButton.innerText = "Saving...";
        
        try {
            const result = await this._hass.callWS({ type: 'dashstyle/config/save', config: this.config });
            if (result.success) {
                this._showStatusMessage("Configuration saved successfully!", "success");
                this._applyStyles();
                this._renderMainView();
            } else { throw new Error("Save operation returned success: false"); }
        } catch (error) {
            console.error("Error saving DashStyle config:", error);
            this._showStatusMessage(`An error occurred while saving: ${error.message}`, "error");
        } finally {
            saveButton.disabled = false;
            saveButton.innerText = "Save Configuration";
        }
    }
    
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
