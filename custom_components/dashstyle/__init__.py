"""Custom integration to add a custom dashboard panel."""
import os
import json
import logging
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.http import HomeAssistantView
from homeassistant.helpers.storage import Store
from homeassistant.components import frontend, websocket_api
from homeassistant.helpers import config_validation as cv
import voluptuous as vol

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PANEL_TITLE = "DashStyle"
PANEL_ICON = "mdi:view-dashboard"
PANEL_URL = "dashstyle-panel"
STORAGE_KEY = f"{DOMAIN}_config"
STORAGE_VERSION = 1

DEFAULT_CONFIG = {
    "rooms": [],
    "entities": {},
    "styles": {
        "primary_color": "#03a9f4",
        "accent_color": "#ff9800",
        "background_color": "#f0f2f5",
        "card_background": "#ffffff",
        "text_color": "#333333",
        "font_family": "Arial, sans-serif"
    },
    "layout": {
        "columns": 3,
        "card_gap": "16px",
        "room_title_size": "24px"
    }
}

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashStyle from a config entry."""
    
    # Initialize storage
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    
    # Load or create default configuration
    stored_config = await store.async_load()
    if stored_config is None:
        stored_config = DEFAULT_CONFIG.copy()
        await store.async_save(stored_config)
    
    # Store the configuration and store instance
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "config": stored_config,
        "store": store,
        "name": entry.data.get("name", "DashStyle")
    }
    
    # Register the frontend panel
    await frontend.async_register_built_in_panel(
        hass,
        "iframe",
        entry.data.get("name", "DashStyle"),
        PANEL_ICON,
        PANEL_URL,
        {"url": f"/api/{DOMAIN}/dashboard"},
    )
    
    # Register views and WebSocket commands
    hass.http.register_view(DashStyleView(hass, entry.entry_id))
    hass.http.register_view(DashStyleStaticView(hass))
    
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_save_config)
    websocket_api.async_register_command(hass, websocket_get_entities)
    
    _LOGGER.info(f"DashStyle '{entry.data.get('name')}' has been set up.")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    hass.data[DOMAIN].pop(entry.entry_id)
    return True


class DashStyleView(HomeAssistantView):
    """View to serve the DashStyle HTML file."""

    def __init__(self, hass: HomeAssistant, entry_id: str):
        """Initialize the view."""
        self.hass = hass
        self.entry_id = entry_id
        
    url = f"/api/{DOMAIN}/dashboard"
    name = f"api:{DOMAIN}_dashboard"
    requires_auth = True

    async def get(self, request):
        """Handle the GET request for the dashboard."""
        path = os.path.join(os.path.dirname(__file__), "www", "dashstyle.html")
        
        if not os.path.exists(path):
            return self.json_message("Dashboard HTML file not found", status_code=404)
            
        with open(path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        # Inject the entry_id for JavaScript to use
        html_content = html_content.replace(
            "{{ENTRY_ID}}", 
            self.entry_id
        )
        
        return self.html(html_content)


class DashStyleStaticView(HomeAssistantView):
    """View to serve static files."""

    def __init__(self, hass: HomeAssistant):
        """Initialize the view."""
        self.hass = hass
        
    url = f"/api/{DOMAIN}/static/{{filename}}"
    name = f"api:{DOMAIN}_static"
    requires_auth = False

    async def get(self, request, filename):
        """Handle the GET request for static files."""
        if filename not in ["dashstyle.js", "dashstyle.css"]:
            return self.json_message("File not found", status_code=404)
            
        path = os.path.join(os.path.dirname(__file__), "www", filename)
        
        if not os.path.exists(path):
            return self.json_message(f"{filename} not found", status_code=404)
            
        return await self.hass.http.async_static_file(path)


@websocket_api.websocket_command({
    vol.Required("type"): "dashstyle/get_config",
    vol.Required("entry_id"): cv.string,
})
@callback 
def websocket_get_config(hass: HomeAssistant, connection, msg):
    """Get the current configuration."""
    entry_id = msg["entry_id"]
    
    if entry_id not in hass.data[DOMAIN]:
        connection.send_error(msg["id"], "entry_not_found", "Entry not found")
        return
        
    config = hass.data[DOMAIN][entry_id]["config"]
    connection.send_result(msg["id"], config)


@websocket_api.websocket_command({
    vol.Required("type"): "dashstyle/save_config",
    vol.Required("entry_id"): cv.string,
    vol.Required("config"): dict,
})
@callback
def websocket_save_config(hass: HomeAssistant, connection, msg):
    """Save the configuration."""
    entry_id = msg["entry_id"]
    
    if entry_id not in hass.data[DOMAIN]:
        connection.send_error(msg["id"], "entry_not_found", "Entry not found")
        return
    
    config = msg["config"]
    hass.data[DOMAIN][entry_id]["config"] = config
    
    # Save to storage
    async def save_config():
        store = hass.data[DOMAIN][entry_id]["store"]
        await store.async_save(config)
    
    hass.async_create_task(save_config())
    connection.send_result(msg["id"], {"success": True})


@websocket_api.websocket_command({
    vol.Required("type"): "dashstyle/get_entities",
})
@callback
def websocket_get_entities(hass: HomeAssistant, connection, msg):
    """Get all available entities."""
    entities = []
    
    for entity_id, entity in hass.states.async_all().items():
        entities.append({
            "entity_id": entity_id,
            "friendly_name": entity.attributes.get("friendly_name", entity_id),
            "domain": entity_id.split(".")[0],
            "state": entity.state,
            "attributes": dict(entity.attributes)
        })
    
    connection.send_result(msg["id"], entities)
