class LabeledInputElement extends HTMLElement {
  _container = null;
  _label = null;
  _input = null;

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
div { display: flex; }
input { flex-grow: 1; }
`;

    this._container = document.createElement('div');

    this._label = document.createElement('label');
    this._container.append(this._label);

    this._input = document.createElement('input');
    this._container.append(this._input);

    this.attachShadow({mode: 'closed'}).append(style, this._container);
  }

  set label(label) {
    this._label.innerText = `${label}:`;
  }

  set placeholder(value) {
    this._input.placeholder = value;
  }

  set value(value) {
    this._input.value = value;
  }

  get value() {
    return this._input.value;
  }

  get style() {
    return this._container.style;
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('labeled-input', LabeledInputElement));