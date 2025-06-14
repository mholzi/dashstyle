// Import the necessary parts from the Lit library.
// Home Assistant makes these available, so we can import them from a CDN path.
import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// Define our new custom element class, which extends LitElement.
class MyDashboardPanel extends LitElement {

  // Define the properties that Home Assistant will pass to our panel.
  // This makes Lit automatically re-render the component when these properties change.
  static get properties() {
    return {
      hass: { type: Object }, // The main Home Assistant object
      narrow: { type: Boolean }, // True if the viewport is narrow (mobile)
      panel: { type: Object }, // Contains panel configuration from the backend
    };
  }

  // The render() function returns the HTML template for our component.
  // It uses the 'html' template literal from Lit.
  render() {
    // Find a specific light entity to display, if it exists.
    const lightEntity = this.hass.states['light.bedside_lamp'];
    const lightState = lightEntity? lightEntity.state : 'unavailable';

    return html`
      <ha-card header="My Custom Dashboard Panel">
        <div class="card-content">
          <p>Welcome to your custom panel!</p>
          <p>This panel is being rendered by a custom web component.</p>
          
          <p>
            The state of light.bedside_lamp is: <strong>${lightState}</strong>
          </p>

          <mwc-button 
            raised 
            @click=${() => this._toggleLight('light.bedside_lamp')}
           .disabled=${!lightEntity}
          >
            Toggle Light
          </mwc-button>
        </div>
      </ha-card>
    `;
  }

  // A private helper method to call a service.
  _toggleLight(entityId) {
    this.hass.callService('light', 'toggle', {
      entity_id: entityId,
    });
  }

  // The static styles block defines the CSS for this component.
  // These styles are scoped to the component's Shadow DOM.
  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }
      ha-card {
        max-width: 600px;
        margin: 0 auto;
      }
      mwc-button {
        margin-top: 16px;
      }
      strong {
        color: var(--primary-color);
      }
    `;
  }
}

// Register our new custom element with the browser.
// The tag name 'my-dashboard-panel' must match the 'webcomponent_name'
// we used in the Python registration call.
customElements.define('my-dashboard-panel', MyDashboardPanel);
