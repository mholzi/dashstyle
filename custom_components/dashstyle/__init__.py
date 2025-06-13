"""The DashStyle integration."""
import logging
import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.helpers.storage import Store
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.config"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashStyle component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashStyle from a config entry."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    saved_config = await store.async_load() or {"rooms": [], "styles": {}}

    async def websocket_load_config(
        hass: HomeAssistant,
        connection: websocket_api.ActiveConnection,
        msg: dict,
    ) -> None:
        """Handle the websocket command to load the config."""
        connection.send_result(msg["id"], saved_config)

    async def websocket_save_config(
        hass: HomeAssistant,
        connection: websocket_api.ActiveConnection,
        msg: dict,
    ) -> None:
        """Handle the websocket command to save the config."""
        nonlocal saved_config
        saved_config = msg["config"]
        await store.async_save(saved_config)
        connection.send_result(msg["id"], {"success": True})

    # Register the websocket handlers.
    websocket_api.async_register_command(
        hass,
        f"{DOMAIN}/config/load",
        websocket_load_config,
        vol.Schema({
            "type": vol.All(str, f"{DOMAIN}/config/load"),
            vol.Required("id"): int,
        }),
    )

    websocket_api.async_register_command(
        hass,
        f"{DOMAIN}/config/save",
        websocket_save_config,
        vol.Schema({
            "type": vol.All(str, f"{DOMAIN}/config/save"),
            vol.Required("id"): int,
            vol.Required("config"): dict,
        }),
    )

    # This part registers the panel with Home Assistant.
    # It seems it was missing from the previous steps.
    # We will use the name from the config entry to create the dashboard.
    dashboard_url = entry.data.get("name", "dashstyle").lower().replace(" ", "_")
    
    await hass.components.lovelace.async_register_panel(
        url_path=dashboard_url,
        frontend_url_path=f"/{DOMAIN}/panel.js",
        config={
            "mode": "js",
            "title": entry.data.get("name", "DashStyle"),
            "icon": "mdi:view-dashboard",
            "show_in_sidebar": True,
            "require_admin": False,
        },
    )

    # Register the frontend javascript file so it can be served.
    hass.http.register_static_path(
        f"/{DOMAIN}/panel.js",
        hass.config.path(f"custom_components/{DOMAIN}/www/dashstyle.js"),
        cache_headers=False,
    )


    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Unregister the panel
    dashboard_url = entry.data.get("name", "dashstyle").lower().replace(" ", "_")
    hass.components.lovelace.async_unregister_panel(dashboard_url)
    
    # Unregister websocket handlers (this is now handled automatically by HA)
    
    # Clean up data
    hass.data[DOMAIN].pop(entry.entry_id, None)
    
    return True
