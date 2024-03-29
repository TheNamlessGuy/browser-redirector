class RedirectionAreaElement extends HTMLElement {
  _name = {
    display: null,
    input: null,
  };

  _active = null;

  _content = {
    all: null,
    hidden: null,
  };

  _redirects = {
    container: null,
    elements: [],
  };

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
legend.area-name { cursor: pointer; }
.hidden { display: none !important; }

.content-hidden {
  text-align: center;
  font-style: italic;
}

.separate {
  display: flex;
  justify-content: space-between;
}

.full-length {
  width: 100%;
}
`;

    const container = document.createElement('fieldset');

    this._name.display = document.createElement('legend');
    this._name.display.classList.add('area-name');
    this._name.display.addEventListener('click', () => this.toggleCollapse());
    container.appendChild(this._name.display);

    this._content.hidden = document.createElement('div');
    this._content.hidden.classList.add('content-hidden', 'hidden');
    this._content.hidden.innerText = 'Content is hidden';
    container.appendChild(this._content.hidden);

    this._content.all = document.createElement('div');
    container.appendChild(this._content.all);

    const top = document.createElement('div');
    top.classList.add('separate');
    this._content.all.appendChild(top);

    this._name.input = document.createElement('input');
    this._name.input.placeholder = 'Area name...';
    this._name.input.addEventListener('input', () => this.name = this._name.input.value);
    top.appendChild(this._name.input);

    this._active = document.createElement('labeled-checkbox');
    this._active.label = 'Active';
    this._active.checked = this._atLeastOneRedirectIsActive();
    this._active.addEventListener('change', () => {
      this._redirects.elements.forEach(x => x.active = this._active.checked);
    });
    top.appendChild(this._active);

    const removeBtn = document.createElement('button');
    removeBtn.innerText = 'Remove area';
    removeBtn.addEventListener('click', () => this.dispatchEvent(new Event('remove-me')));
    top.appendChild(removeBtn);

    const redirects = document.createElement('fieldset');
    this._content.all.appendChild(redirects);

    const redirectsLegend = document.createElement('legend');
    redirectsLegend.innerText = 'Redirects';
    redirects.appendChild(redirectsLegend);

    this._redirects.container = document.createElement('div');
    redirects.appendChild(this._redirects.container);

    const addRedirectButton = document.createElement('button');
    addRedirectButton.classList.add('full-length');
    addRedirectButton.innerText = 'Add new redirect';
    addRedirectButton.addEventListener('click', () => this.addRedirect());
    redirects.appendChild(addRedirectButton);

    this.attachShadow({mode: 'closed'}).append(style, container);
  }

  set name(name) {
    this._name.input.value = name;
    if (name == null || name == '') {
      this._name.display.innerText = 'No area name';
      this._name.display.style.fontStyle = 'italic';
    } else {
      this._name.display.innerText = `Area: ${name}`;
      this._name.display.style.fontStyle = null;
    }
  }

  get name() {
    const value = this._name.input.value.trim();
    return value === '' ? null : value;
  }

  addRedirect(data = {}) {
    const element = document.createElement('redirect-element');
    element.init(data);
    element.addEventListener('remove-me', () => {
      this._redirects.elements.splice(this._redirects.elements.indexOf(element), 1);
      this._redirects.container.removeChild(element);
      this._active.checked = this._atLeastOneRedirectIsActive();
    });
    this._redirects.elements.push(element);
    this._redirects.container.append(element);

    this._active.checked = this._atLeastOneRedirectIsActive();
  }

  get redirects() {
    return this._redirects.elements.slice();
  }

  isCollapsed() {
    return !this._content.hidden.classList.contains('hidden');
  }

  toggleCollapse(collapse = null) {
    collapse = collapse ?? !this.isCollapsed();

    this._content.all.classList.toggle('hidden', collapse);
    this._content.hidden.classList.toggle('hidden', !collapse);
  }

  _atLeastOneRedirectIsActive() {
    return this._redirects.elements.some(x => x.active);
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('redirection-area', RedirectionAreaElement));