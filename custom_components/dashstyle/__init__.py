"""The DashStyle integration."""
import logging
import os
import shutil
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


def _copy_frontend_files(source_path: str, dest_path: str) -> None:
    """Copy frontend files to the www directory."""
    try:
        if not os.path.exists(dest_path):
            _LOGGER.info("Creating DashStyle www directory at %s", dest_path)
            os.makedirs(dest_path, exist_ok=True)
        
        _LOGGER.info("Copying DashStyle frontend files from %s to %s", source_path, dest_path)
        shutil.copytree(source_path, dest_path, dirs_exist_ok=True)
    except Exception as e:
        _LOGGER.error("Failed to copy frontend files: %s", e)

def _remove_frontend_files(dest_path: str) -> None:
    """Remove frontend files from the www directory."""
    if os.path.exists(dest_path):
        _LOGGER.info("Removing DashStyle www directory at %s", dest_path)
        try:
            shutil.rmtree(dest_path)
        except Exception as e:
            _LOGGER.error("Failed to remove frontend files: %s", e)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashStyle component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashStyle from a config entry."""
    
    # --- COPY FRONTEND FILES ---
    source_path = os.path.join(os.path.dirname(__file__), "www")
    dest_path = hass.config.path("www", "dashstyle")
    await hass.async_add_executor_job(_copy_frontend_files, source_path, dest_path)

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
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=entry.data.get("name", "DashStyle"),
        sidebar_icon="mdi:view-dashboard",
        frontend_url_path=entry.data.get("name", "dashstyle").lower().replace(" ", "_"),
        config={
            "_panel_custom": {
                "name": "dash-style",
                "html_url": "/local/dashstyle/panel.html"
            }
        },
        require_admin=False,
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Unregister the panel
    frontend.async_remove_panel(hass, entry.data.get("name", "dashstyle").lower().replace(" ", "_"))
    
    # Clean up data
    hass.data[DOMAIN].pop(entry.entry_id, None)
    
    # --- REMOVE FRONTEND FILES ---
    dest_path = hass.config.path("www", "dashstyle")
    await hass.async_add_executor_job(_remove_frontend_files, dest_path)
    
    return True
