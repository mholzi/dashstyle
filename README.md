# DashStyle

A dynamic, zero-dependency, and fully configurable dashboard for Home Assistant.

DashStyle allows you to build a beautiful and functional dashboard directly from the Home Assistant UI without needing to manage complex YAML files or install third-party card dependencies like button-card.

## Features

### 🚀 Zero Dependencies
Renders all cards and layouts with pure JavaScript, HTML, and CSS. No more `custom:button-card` or other custom card requirements.

### 🔧 Live UI Configuration
A powerful built-in admin panel allows you to add/remove rooms, assign entities, and change styles without ever touching YAML.

### 💾 Persistent Configuration
All your settings are saved directly within your Home Assistant instance, surviving restarts and browser cache clears.

### 🔄 Dynamic & Interactive
Cards update in real-time as entity states change, and are clickable to perform default actions (e.g., toggling lights, opening covers).

### 🎨 Theming Support
Easily change colors, fonts, and layout from the admin panel to match your preferences.

### 📱 Responsive Design
Works seamlessly on desktop, tablet, and mobile devices with adaptive layouts.

### 🏠 Room-Based Organization
Organize your entities by rooms with customizable icons and entity type classifications.

## Installation

The recommended way to install DashStyle is through the Home Assistant Community Store (HACS).

### Add Custom Repository

1. Navigate to HACS → Integrations.
2. Click the three-dots menu in the top right and select "Custom repositories".
3. In the "Repository" field, enter: `https://github.com/mholzi/dashstyle`
4. For the category, select "Integration".
5. Click "ADD".

### Install the Integration

1. The DashStyle integration will now appear in your HACS list.
2. Click on it and then click the "INSTALL" button.
3. Follow the prompts to complete the installation.

### Restart Home Assistant

After installation, you must restart Home Assistant for the integration to be loaded.

## Configuration

Once installed, you can add and configure your dashboard from the main Home Assistant Integrations page.

1. Navigate to Settings → Devices & Services.
2. Click the "+ ADD INTEGRATION" button.
3. Search for "DashStyle" and click on it.
4. You will be prompted to give your dashboard a name. This name will appear in the sidebar. Click "SUBMIT".
5. Your new dashboard is now ready! Navigate to it from the sidebar. Use the "Admin" button in the top-right corner to start building your layout.

## Usage

### Main Dashboard View

The main dashboard view displays your rooms and entities in a clean, organized grid layout. Each room card contains:

- **Room Header**: Displays the room name and custom icon
- **Entity Cards**: Shows entities assigned to the room with their current states
- **Entity Types**: Visual indicators for entity classifications (e.g., "hoover", "light", "sensor")

Click on entity cards to toggle them (for lights, switches, etc.) or view details for sensors and other read-only entities.

### Admin Panel

The admin panel is accessible to Home Assistant administrators through the ⚙️ button in the top-right corner. It provides four main configuration sections:

#### 🏠 Rooms Tab
- **Add Rooms**: Create new rooms with custom names and icons
- **Manage Rooms**: Edit or delete existing rooms
- **Room Icons**: Use Material Design Icons (mdi:icon-name) for room representation

#### 🔌 Entities Tab
- **Assign Entities**: Add entities to specific rooms
- **Entity Types**: Classify entities with custom types (e.g., "hoover", "security", "climate")
- **Entity Management**: Remove entities from rooms as needed

#### 🎨 Styles Tab
Configure the visual appearance of your dashboard:
- **Primary Color**: Main theme color for buttons and highlights
- **Accent Color**: Secondary color for hover states and actions
- **Background Color**: Overall dashboard background
- **Card Background**: Individual card background color
- **Text Color**: Main text color throughout the interface
- **Font Family**: Choose from predefined font options

#### 📐 Layout Tab
Adjust the dashboard layout:
- **Grid Columns**: Number of room cards per row (1-6)
- **Card Gap**: Spacing between cards in pixels
- **Room Title Size**: Size of room titles in pixels

### Configuration Persistence

All configuration changes are automatically saved to Home Assistant's storage system and persist across:
- Home Assistant restarts
- Browser cache clears
- Device changes
- Integration updates

## Entity Support

DashStyle supports all Home Assistant entity types with smart interaction handling:

### Interactive Entities
- **Lights**: Toggle on/off with click
- **Switches**: Toggle on/off with click
- **Fans**: Toggle on/off with click
- **Covers**: Toggle open/close with click

### Information Entities
- **Sensors**: Display current state and show details on click
- **Binary Sensors**: Show on/off state
- **Weather**: Display current conditions
- **Cameras**: Show entity details

### Entity Types

Entity types allow you to categorize entities within rooms for better organization. Common types include:
- `hoover` - Vacuum cleaners and cleaning devices
- `security` - Alarm systems, door sensors, cameras
- `climate` - Thermostats, temperature sensors
- `media` - Entertainment devices, speakers
- `light` - All lighting devices
- `sensor` - Environmental sensors

## Advanced Configuration

### Custom Icons

DashStyle supports Material Design Icons for rooms. Use the format `mdi:icon-name`. Popular room icons include:
- `mdi:home` - General home
- `mdi:sofa` - Living room
- `mdi:bed` - Bedroom
- `mdi:stove` - Kitchen
- `mdi:toilet` - Bathroom
- `mdi:desk` - Office
- `mdi:car` - Garage

### Responsive Breakpoints

The dashboard automatically adapts to different screen sizes:
- **Desktop**: Full grid layout with configurable columns
- **Tablet**: Reduced columns for optimal viewing
- **Mobile**: Single column layout for touch interaction

### Performance Optimization

DashStyle is optimized for performance with:
- Minimal DOM manipulation
- Efficient entity state updates
- CSS-based animations
- Lazy loading of non-visible content

## Troubleshooting

### Dashboard Not Appearing in Sidebar

1. Ensure the integration is properly installed and configured
2. Restart Home Assistant after installation
3. Check that the integration shows as "Configured" in Settings → Devices & Services

### Admin Panel Not Visible

The admin panel is only visible to Home Assistant administrators. Ensure your user account has admin privileges.

### Configuration Not Saving

1. Check Home Assistant logs for any storage-related errors
2. Ensure you have write permissions to the Home Assistant configuration directory
3. Try restarting Home Assistant and reconfiguring

### Entity States Not Updating

1. Verify entities exist and are accessible in Home Assistant
2. Check WebSocket connection in browser developer tools
3. Refresh the dashboard using the 🔄 button

### Required Resources

DashStyle requires the following resources to function properly:

- **Frontend Component**: The integration registers a custom panel in Home Assistant's frontend
- **Static File Serving**: JavaScript and HTML files are served from the `www/dashstyle/` directory
- **WebSocket API**: Custom WebSocket commands for configuration loading and saving
- **Storage**: Configuration is stored using Home Assistant's storage system

No additional card dependencies (like `button-card`) are required as DashStyle renders everything with pure JavaScript.

### Common Issues

**Issue**: "DashStyle integration not found"
**Solution**: Ensure HACS is properly installed and the repository was added correctly. Check that the installation completed successfully.

**Issue**: Dashboard appears but shows errors or doesn't load entities
**Solution**: Check that you have entities configured in Home Assistant and that the WebSocket connection is working properly.

**Issue**: Admin panel not accessible
**Solution**: Ensure your Home Assistant user has admin privileges, as the admin panel requires admin access for configuration changes.

## Development

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Architecture

DashStyle is built with a clean separation of concerns:

- **Python Backend**: Handles WebSocket API, configuration storage, and Home Assistant integration
- **JavaScript Frontend**: Manages UI interactions, real-time updates, and admin functionality
- **CSS Styling**: Provides responsive design and theming capabilities

### File Structure

```
custom_components/dashstyle/
├── __init__.py              # Main integration setup and WebSocket API
├── config_flow.py           # Configuration flow for HACS setup
├── const.py                 # Constants and configuration
├── manifest.json            # Integration metadata
└── www/
    ├── dashstyle.html       # Main dashboard HTML template
    ├── dashstyle.css        # Comprehensive styling
    └── dashstyle.js         # Dashboard functionality and admin panel
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the Home Assistant community's need for simpler dashboard configuration
- Built to replace complex YAML-based dashboard configurations
- Designed for users who want powerful customization without technical complexity