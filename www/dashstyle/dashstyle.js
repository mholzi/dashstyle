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

        // Initialize a default config object.
        // In a real implementation (Step 12+), this would be loaded from
        // and saved to Home Assistant's storage.
        this.config = {
            rooms: [],
            styles: {}
        };
    }

    /**
     * The `hass` setter is called by Home Assistant when the state changes.
     * It's the main entry point for data and updates.
     * @param {object} hass The Home Assistant state object.
     */
    set hass(hass) {
        this._hass = hass;

        // In a real-world scenario, you would determine admin status via hass.user.is_admin
        // For this example, we'll hardcode it to true to ensure the admin panel is visible.
        this.isAdmin = true; 

        // The main render logic is only called once to build the initial structure.
        if (!this.content) {
            this.content = document.createElement('div');
            this.shadowRoot.appendChild(this.content);
            this.render();
        }

        // Future update logic would go here, e.g., to update entity states on the main view.
    }

    /**
     * Renders the initial HTML structure and CSS for the component.
     * This includes the main view container and the admin panel structure with tabs.
     */
    render() {
        this.content.innerHTML = `
            <style>
                .admin-panel {
                    /* The admin panel is only shown if isAdmin is true */
                    display: ${this.isAdmin ? 'block' : 'none'};
                    padding: 16px;
                    font-family: Arial, sans-serif;
                }
                .tabs {
                    display: flex;
                    border-bottom: 1px solid #ccc;
                    margin-bottom: 16px;
                }
                .tab {
                    padding: 8px 16px;
                    cursor: pointer;
                    border-radius: 4px 4px 0 0;
                }
                .tab.active {
                    border-bottom: 2px solid var(--primary-color, #03a9f4);
                    font-weight: bold;
                    background-color: #f0f0f0;
                }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .config-section {
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                h1, h2, h3, h4 {
                    margin-top: 0;
                    padding-bottom: 8px;
                }
                h3 {
                    border-bottom: 1px solid #eee;
                }
                .form-group { margin-bottom: 12px; }
                label { 
                    display: block; 
                    margin-bottom: 4px; 
                    font-weight: 500;
                    font-size: 0.9em;
                    color: #555;
                }
                input[type="text"], input[type="color"], select {
                    width: 100%;
                    padding: 10px;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    background-color: var(--primary-color, #03a9f4);
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                button:hover {
                    opacity: 0.8;
                }
                button.delete { 
                    background-color: var(--error-color, #db4437); 
                }
                .item-list { 
                    list-style: none; 
                    padding-left: 0; 
                }
                .item-list li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .item-list li:last-child {
                    border-bottom: none;
                }
                .item-list ha-icon {
                    margin-right: 8px;
                    color: #777;
                }
            </style>

            <!-- Main dashboard view (to be implemented in later steps) -->
            <div id="main-view"></div>

            <!-- Admin Configuration Panel -->
            <div id="admin-view" class="admin-panel">
                <h1>DashStyle Configuration</h1>
                
                <div class="tabs">
                    <div class="tab active" data-tab="rooms">Rooms & Entities</div>
                    <div class="tab" data-tab="styling">Styling</div>
                </div>

                <div id="tab-rooms" class="tab-content active">
                    <!-- Room and Entity configuration will be rendered here by _renderRoomsTab() -->
                </div>

                <div id="tab-styling" class="tab-content">
                    <!-- Styling configuration will be rendered here by _renderStylingTab() -->
                </div>
                
                <button id="save-config">Save Configuration</button>
            </div>
        `;

        this._addEventListeners();
        this._renderAdminTabs();
    }

    /**
     * Adds initial event listeners for the main UI components like tabs and the save button.
     */
    _addEventListeners() {
        // Tab switching logic
        const tabs = this.content.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this._handleTabClick(tab));
        });

        // Save button logic
        this.content.querySelector('#save-config').addEventListener('click', () => this._saveConfig());
    }
    
    /**
     * Handles the click event on a tab to show the correct content panel.
     * @param {HTMLElement} clickedTab The tab element that was clicked.
     */
    _handleTabClick(clickedTab) {
        // Deactivate all tabs and content panels
        this.content.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        this.content.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activate the clicked tab and its corresponding content panel
        const tabName = clickedTab.dataset.tab;
        clickedTab.classList.add('active');
        this.content.querySelector(`#tab-${tabName}`).classList.add('active');
    }

    /**
     * Central function to render the content of all admin tabs.
     */
    _renderAdminTabs() {
        this._renderRoomsTab();
        this._renderStylingTab();
    }

    /**
     * Renders the "Rooms & Entities" tab UI.
     * This is a dynamic function that builds the UI based on the current `this.config`.
     * It includes forms for adding rooms and entities, and lists existing ones.
     */
    _renderRoomsTab() {
        const container = this.content.querySelector('#tab-rooms');
        
        // HTML for the "Add Room" form
        const addRoomHtml = `
            <div class="config-section">
                <h3>Add New Room</h3>
                <div class="form-group">
                    <label for="new-room-name">Room Name</label>
                    <input type="text" id="new-room-name" placeholder="e.g., Living Room">
                </div>
                <div class="form-group">
                    <label for="new-room-icon">Icon (e.g., mdi:sofa)</label>
                    <input type="text" id="new-room-icon" placeholder="mdi:home">
                </div>
                <button id="add-room">Add Room</button>
            </div>`;

        // Generate HTML for each existing room and its entities
        const roomsHtml = this.config.rooms.map((room, roomIndex) => {
            const entitiesHtml = room.entities.map((entity, entityIndex) => `
                <li data-entity-index="${entityIndex}">
                    <span>
                        <strong>ID:</strong> ${entity.id} | 
                        <strong>Type:</strong> ${entity.type} 
                        ${entity.subtype ? `| <strong>Subtype:</strong> ${entity.subtype}` : ''}
                    </span>
                    <button class="delete delete-entity">Delete</button>
                </li>
            `).join('');

            return `
                <div class="config-section" data-room-index="${roomIndex}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3><ha-icon icon="${room.icon || 'mdi:alert-circle-outline'}"></ha-icon> ${room.name}</h3>
                        <button class="delete delete-room">Delete Room</button>
                    </div>

                    <h4>Entities in ${room.name}</h4>
                    ${room.entities.length > 0 ? `<ul class="item-list">${entitiesHtml}</ul>` : `<p>No entities added yet.</p>`}
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">

                    <h4>Add New Entity to ${room.name}</h4>
                    <div class="form-group">
                        <label>Entity ID</label>
                        <input type="text" class="new-entity-id" placeholder="e.g., light.living_room_main">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select class="new-entity-type">
                            <option value="light">Light</option>
                            <option value="cover">Cover</option>
                            <option value="sensor">Sensor</option>
                            <option value="media_player">Media Player</option>
                            <option value="scene">Scene</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Subtype (optional, e.g., for sensors)</label>
                        <input type="text" class="new-entity-subtype" placeholder="temperature, humidity, hoover, etc.">
                    </div>
                    <button class="add-entity">Add Entity</button>
                </div>
            `;
        }).join('');

        container.innerHTML = addRoomHtml + (this.config.rooms.length > 0 ? `<h2>Existing Rooms</h2>` + roomsHtml : '');

        // --- Attach Event Listeners for this Tab ---
        this.content.querySelector('#add-room').addEventListener('click', () => this._addRoom());
        
        this.content.querySelectorAll('.delete-room').forEach(button => {
            button.addEventListener('click', (e) => {
                const roomIndex = e.target.closest('.config-section').dataset.roomIndex;
                this._deleteRoom(parseInt(roomIndex, 10));
            });
        });

        this.content.querySelectorAll('.add-entity').forEach(button => {
            button.addEventListener('click', (e) => {
                const roomIndex = e.target.closest('.config-section').dataset.roomIndex;
                this._addEntity(parseInt(roomIndex, 10));
            });
        });

        this.content.querySelectorAll('.delete-entity').forEach(button => {
            button.addEventListener('click', (e) => {
                const roomIndex = e.target.closest('.config-section').dataset.roomIndex;
                const entityIndex = e.target.closest('li').dataset.entityIndex;
                this._deleteEntity(parseInt(roomIndex, 10), parseInt(entityIndex, 10));
            });
        });
    }
    
    /**
     * Renders the "Styling" tab UI with inputs for theme customization.
     */
    _renderStylingTab() {
        const container = this.content.querySelector('#tab-styling');
        const styles = this.config.styles || {};
        // Provide default values for color pickers and inputs
        const primaryColor = styles['primary-color'] || '#03a9f4';
        const accentColor = styles['accent-color'] || '#ff9800';
        const primaryFont = styles['primary-font-family'] || 'Arial, sans-serif';
        const secondaryFont = styles['secondary-font-family'] || 'Verdana, sans-serif';

        container.innerHTML = `
            <div class="config-section">
                <h3>Colors</h3>
                <div class="form-group">
                    <label for="primary-color">Primary Color</label>
                    <input type="color" id="primary-color" value="${primaryColor}">
                </div>
                <div class="form-group">
                    <label for="accent-color">Accent Color</label>
                    <input type="color" id="accent-color" value="${accentColor}">
                </div>
            </div>
            <div class="config-section">
                <h3>Fonts</h3>
                <div class="form-group">
                    <label for="primary-font">Primary Font Family</label>
                    <input type="text" id="primary-font" value="${primaryFont}">
                </div>
                <div class="form-group">
                    <label for="secondary-font">Secondary Font Family</label>
                    <input type="text" id="secondary-font" value="${secondaryFont}">
                </div>
            </div>
        `;

        // Attach event listeners to update the config object in real-time
        container.querySelector('#primary-color').addEventListener('input', (e) => {
            this.config.styles['primary-color'] = e.target.value;
        });
        container.querySelector('#accent-color').addEventListener('input', (e) => {
            this.config.styles['accent-color'] = e.target.value;
        });
        container.querySelector('#primary-font').addEventListener('input', (e) => {
            this.config.styles['primary-font-family'] = e.target.value;
        });
        container.querySelector('#secondary-font').addEventListener('input', (e) => {
            this.config.styles['secondary-font-family'] = e.target.value;
        });
    }

    /**
     * Handles adding a new room to the configuration object.
     */
    _addRoom() {
        const nameInput = this.content.querySelector('#new-room-name');
        const iconInput = this.content.querySelector('#new-room-icon');

        if (nameInput.value) {
            this.config.rooms.push({ 
                name: nameInput.value, 
                icon: iconInput.value || 'mdi:home', // Default icon
                entities: [] 
            });
            nameInput.value = '';
            iconInput.value = '';
            this._renderRoomsTab(); // Re-render the tab to show the new room
        } else {
            alert('Room name is required.');
        }
    }

    /**
     * Handles deleting a room from the configuration.
     * @param {number} index The index of the room to delete.
     */
    _deleteRoom(index) {
        if (confirm(`Are you sure you want to delete the room: "${this.config.rooms[index].name}"?`)) {
            this.config.rooms.splice(index, 1);
            this._renderRoomsTab(); // Re-render to reflect the deletion
        }
    }

    /**
     * Handles adding a new entity to a specific room.
     * @param {number} roomIndex The index of the room to add the entity to.
     */
    _addEntity(roomIndex) {
        const roomSection = this.content.querySelector(`.config-section[data-room-index='${roomIndex}']`);
        const idInput = roomSection.querySelector('.new-entity-id');
        const typeInput = roomSection.querySelector('.new-entity-type');
        const subtypeInput = roomSection.querySelector('.new-entity-subtype');
        
        const entity = {
            id: idInput.value,
            type: typeInput.value,
            subtype: subtypeInput.value || undefined // Only add subtype if it has a value
        };

        if (entity.id) {
            this.config.rooms[roomIndex].entities.push(entity);
            this._renderRoomsTab(); // Re-render to show the new entity
        } else {
            alert('Entity ID is required.');
        }
    }

    /**
     * Handles deleting an entity from a specific room.
     * @param {number} roomIndex The index of the room.
     * @param {number} entityIndex The index of the entity within the room.
     */
    _deleteEntity(roomIndex, entityIndex) {
        const entityId = this.config.rooms[roomIndex].entities[entityIndex].id;
        if (confirm(`Are you sure you want to delete the entity: "${entityId}"?`)) {
            this.config.rooms[roomIndex].entities.splice(entityIndex, 1);
            this._renderRoomsTab(); // Re-render to reflect the deletion
        }
    }

    /**
     * Placeholder function for saving the configuration.
     * In a full implementation, this would send the `this.config` object
     * to the Home Assistant backend to be persisted.
     */
    _saveConfig() {
        console.log("Saving Configuration:", this.config);
        // Step 12 will cover how to properly save this data.
        alert("Configuration has been logged to the browser's developer console. Persistence will be added in the next steps.");
    }
}

// Register the custom element with the browser.
customElements.define('dash-style', DashStyle);

