class LabeledCheckboxElement extends HTMLElement {
  _container = null;
  _label = null;
  _checkbox = null;

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
div { display: flex; justify-content: space-between; }
label { cursor: pointer; }
`;

    this._container = document.createElement('div');

    this._label = document.createElement('label');
    this._label.innerText = '';
    this._label.addEventListener('click', () => this.toggle());
    this._container.append(this._label);

    this._checkbox = document.createElement('input');
    this._checkbox.type = 'checkbox';
    this._checkbox.addEventListener('change', () => this.dispatchEvent(new Event('change')));
    this._container.append(this._checkbox);

    if (this.hasAttribute('checked')) {
      this.checked = true;
    } else {
      this.checked = false;
    }

    if (this.hasAttribute('label')) {
      this.label = this.getAttribute('label');
    }

    this.attachShadow({mode: 'closed'}).append(style, this._container);
  }

  set label(label) {
    this._label.innerText = `${label}:`;
  }

  set checked(checked) {
    this._checkbox.checked = checked;
  }

  get checked() {
    return this._checkbox.checked;
  }

  toggle() {
    this.checked = !this.checked;
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('labeled-checkbox', LabeledCheckboxElement));