class AreaElement extends HTMLElement {
  _container = null;
  _collapsedMessage = null;
  _legend = null;
  _legendCheckbox = null;

  _name = null;

  _redirects = [];

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
legend {
  cursor: pointer;
  user-select: none;
}

.hidden {
  display: none !important;
}
`;

    this._container = document.createElement('fieldset');

    const legend = document.createElement('legend');
    this._legend = document.createElement('span');
    this._legend.addEventListener('click', () => this.toggleCollapse());
    legend.appendChild(this._legend);
    this._legendCheckbox = document.createElement('input');
    this._legendCheckbox.type = 'checkbox';
    this._legendCheckbox.checked = this._atLeastOneRedirectIsChecked();
    this._legendCheckbox.addEventListener('change', () => {
      this._redirects.forEach(x => x.element.checked = this._legendCheckbox.checked);
      this.dispatchEvent(new Event('do-save'));
    });
    legend.appendChild(this._legendCheckbox);

    this._container.appendChild(legend);

    this._collapsedMessage = document.createElement('div');
    this._collapsedMessage.style.fontStyle = 'italic';
    this._collapsedMessage.innerText = 'Content is hidden';
    this._collapsedMessage.classList.add('hidden');
    this._container.appendChild(this._collapsedMessage);

    this.attachShadow({mode: 'closed'}).append(style, this._container);
  }

  set name(name) {
    this._name = name;
    if (this._name != null) {
      this._legend.innerText = `Area: ${this._name}`;
    } else {
      this._legend.innerText = 'No area name';
      this._legend.style.fontStyle = 'italic';
    }
  }

  get name() {
    return this._name;
  }

  isCollapsed() {
    return !this._collapsedMessage.classList.contains('hidden');
  }

  addRedirect(redirect) {
    const checkbox = document.createElement('labeled-checkbox');
    checkbox.label = redirect.alias;
    checkbox.checked = redirect.active;
    checkbox.addEventListener('change', () => {
      this._legendCheckbox.checked = this._atLeastOneRedirectIsChecked();
      this.dispatchEvent(new Event('do-save'));
    });
    this._container.appendChild(checkbox);

    this._redirects.push({
      element: checkbox,
      data: redirect,
    });

    this._legendCheckbox.checked = this._atLeastOneRedirectIsChecked();
  }

  getRedirectActiveStatus(redirect) {
    return this._redirects.find(x => x.data === redirect).element.checked;
  }

  toggleCollapse(collapse = null) {
    collapse = collapse ?? !this.isCollapsed();

    this._collapsedMessage.classList.toggle('hidden', !collapse);
    this._redirects.forEach(x => x.element.classList.toggle('hidden', collapse));
  }

  _atLeastOneRedirectIsChecked() {
    return this._redirects.some(x => x.element.checked);
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('c-area', AreaElement));