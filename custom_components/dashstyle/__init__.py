"""The DashStyle integration."""
import logging
import voluptuous as vol

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.typing import ConfigType
from homeassistant.helpers.storage import Store
from homeassistant.components import websocket_api

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.config"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashStyle component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigType) -> bool:
    """Set up DashStyle from a config entry."""

    # The store is used to save and load the configuration.
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    
    # Load the saved configuration from the store, or return a default dict.
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
        # We update the global saved_config object and then save it to the store.
        saved_config = msg["config"]
        await store.async_save(saved_config)
        connection.send_result(msg["id"], {"success": True})

    # Register the websocket handlers
    websocket_api.async_register_command(
        hass,
        "dashstyle/config/load",
        websocket_api.async_ws_handler(websocket_load_config),
        vol.Schema({
            "type": "dashstyle/config/load",
            vol.Required("id"): int,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "dashstyle/config/save",
        websocket_api.async_ws_handler(websocket_save_config),
        vol.Schema({
            "type": "dashstyle/config/save",
            vol.Required("id"): int,
            vol.Required("config"): dict,
        }),
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigType) -> bool:
    """Unload a config entry."""
    # The websocket commands are automatically unregistered by Home Assistant
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True

