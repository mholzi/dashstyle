"""The DashStyle integration."""
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from .const import DOMAIN
from .dashboard import async_register_dashboard

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashStyle component."""
    hass.data.setdefault(DOMAIN, {})
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigType) -> bool:
    """Set up DashStyle from a config entry."""
    await async_register_dashboard(hass, entry.data["name"])
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigType) -> bool:
    """Unload a config entry."""
    hass.data[DOMAIN].pop(entry.entry_id)
    return True
