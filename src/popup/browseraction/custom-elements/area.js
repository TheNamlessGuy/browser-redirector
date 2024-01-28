class AreaElement extends HTMLElement {
  _container = null;
  _legend = null;

  _redirects = [];

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = ``;

    this._container = document.createElement('fieldset');

    this._legend = document.createElement('legend');
    this._container.appendChild(this._legend);

    this.attachShadow({mode: 'closed'}).append(style, this._container);
  }

  set name(name) {
    this._legend.innerText = name;
  }

  get name() {
    return this._legend.innerText;
  }

  addRedirect(redirect) {
    const checkbox = document.createElement('labeled-checkbox');
    checkbox.label = redirect.alias;
    checkbox.checked = redirect.active;
    checkbox.addEventListener('change', () => this.dispatchEvent(new Event('do-save')));
    this._container.appendChild(checkbox);

    this._redirects.push({
      element: checkbox,
      data: redirect,
    });
  }

  getRedirectActiveStatus(idx) {
    return this._redirects[idx].element.checked;
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('c-area', AreaElement));