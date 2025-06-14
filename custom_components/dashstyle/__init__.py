"""The DashStyle integration."""
import logging
import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.helpers.storage import Store
from homeassistant.components import websocket_api, frontend
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

    # --- PANEL REGISTRATION ---
    # Register the dashboard panel in Home Assistant's sidebar
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=entry.data.get("name", "DashStyle"),
        sidebar_icon="mdi:view-dashboard",
        frontend_url_path=entry.data.get("name", "dashstyle").lower().replace(" ", "_"),
        config={
            "_panel_custom": {
                "name": "dash-style",
                "html_url": "/dashstyle_assets/panel.html"
            }
        },
        require_admin=False,
    )
    
    # Register the static path for the javascript file
    hass.http.register_static_path(
        "/dashstyle_assets",
        hass.config.path("www/dashstyle"),
        cache_headers=False
    )


    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Unregister the panel
    frontend.async_remove_panel(hass, entry.data.get("name", "dashstyle").lower().replace(" ", "_"))
    
    # Clean up data
    hass.data[DOMAIN].pop(entry.entry_id, None)
    
    return True
