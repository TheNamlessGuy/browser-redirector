class LabeledSelectElement extends HTMLElement {
  _container = null;
  _label = null;
  _select = null;

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
div { display: flex; justify-content: space-between; }
select.grown { flex-grow: 1; }
`;

    this._container = document.createElement('div');

    this._label = document.createElement('label');
    this._container.append(this._label);

    this._select = document.createElement('select');
    this._select.addEventListener('change', () => this.dispatchEvent(new Event('change')));
    this._select.classList.add('grown');
    this._container.append(this._select);

    this.attachShadow({mode: 'closed'}).append(style, this._container);
  }

  set label(label) {
    this._label.innerText = `${label}:`;
  }

  set options(options) {
    this._select.innerHTML = '';

    for (const option of options) {
      const element = document.createElement('option');
      element.value = option.value;
      element.innerText = option.display;

      this._select.append(element);
    }
  }

  set grown(value = null) {
    if (value == null) {
      this._select.classList.toggle('grown');
    } else {
      this._select.classList.toggle('grown', value);
    }
  }

  set value(value) {
    this._select.value = value;
  }

  get value() {
    return this._select.value;
  }

  get style() {
    return this._container.style;
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('labeled-select', LabeledSelectElement));