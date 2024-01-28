class RedirectElement extends HTMLElement {
  _active = null;
  _alias = null;
  _remove = null;
  _type = null;

  _manualSwap = {
    container: null,
    urls: [],
  };

  _manualOneWay = {
    container: null,
    from: null,
    to: null,
    toAlias: null,
  }

  _automatic = {
    container: null,
    from: null,

    type: {
      select: null,
      regex: null,
      internal: null,
    },
  };

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
.hidden { display: none !important; }

div.root {
  border-bottom: 1px solid #000;
  margin-bottom: 5px;
  padding-bottom: 5px;
}

.manual-url-option {
  border-top: 1px solid #AAA;
  margin-top: 5px;
  padding-top: 5px;
}
`;

    const container = document.createElement('div');
    container.classList.add('root');

    this._remove = document.createElement('button');
    this._remove.innerText = 'Remove redirect';
    this._remove.style.width = '100%';
    this._remove.style.marginBottom = '5px';
    this._remove.addEventListener('click', () => this.remove());
    container.append(this._remove);

    this._alias = document.createElement('labeled-input');
    this._alias.label = 'Alias';
    this._alias.placeholder = 'Alias';
    container.append(this._alias);

    this._active = document.createElement('labeled-checkbox');
    this._active.style.marginBottom = '5px';
    this._active.label = 'Active';
    this._active.checked = true;
    container.append(this._active);

    this._type = document.createElement('labeled-select');
    this._type.grown = false;
    this._type.style.marginBottom = '5px';
    this._type.label = 'Type';
    this._type.options = [{value: 'automatic', display: 'Automatic'}, {value: 'manual-swap', display: 'Manually swap between multiple URLs'}, {value: 'manual-oneway', display: 'Manually swap in one direction'}];
    this._type.addEventListener('change', () => this._setMode());
    container.append(this._type);

    this._initManualOneWay(container);
    this._initManualSwap(container);
    this._initAutomatic(container);
    this._setMode();

    this.attachShadow({mode: 'closed'}).append(style, container);
  }

  _initManualOneWay(container) {
    this._manualOneWay.container = document.createElement('div');

    this._manualOneWay.from = document.createElement('labeled-input');
    this._manualOneWay.from.label = 'From';
    this._manualOneWay.from.placeholder = 'Regex...';
    this._manualOneWay.container.append(this._manualOneWay.from);

    this._manualOneWay.to = document.createElement('labeled-input');
    this._manualOneWay.to.label = 'To';
    this._manualOneWay.to.placeholder = 'Result URL';
    this._manualOneWay.container.append(this._manualOneWay.to);

    this._manualOneWay.toAlias = document.createElement('labeled-input');
    this._manualOneWay.toAlias.label = 'To alias';
    this._manualOneWay.toAlias.placeholder = 'Alias';
    this._manualOneWay.container.append(this._manualOneWay.toAlias);

    container.append(this._manualOneWay.container);
  }

  _initManualSwap(container) {
    this._manualSwap.container = document.createElement('div');

    const addURLOptionButton = document.createElement('button');
    addURLOptionButton.innerText = 'Add URL Option';
    addURLOptionButton.addEventListener('click', () => this._addURLOption());
    this._manualSwap.container.append(addURLOptionButton);

    container.append(this._manualSwap.container);
  }

  _initAutomatic(container) {
    this._automatic.container = document.createElement('div');

    this._automatic.from = document.createElement('labeled-input');
    this._automatic.from.style.marginBottom = '5px';
    this._automatic.from.label = 'From';
    this._automatic.from.value;
    this._automatic.from.placeholder = 'Regex...';
    this._automatic.container.append(this._automatic.from);

    this._automatic.type.select = document.createElement('labeled-select');
    this._automatic.type.select.style.marginBottom = '5px';
    this._automatic.type.select.label = 'To';
    this._automatic.type.select.grown = false;
    this._automatic.type.select.options = [{value: 'regex', display: 'Regex'}, {value: 'internal', display: 'Internal'}];
    this._automatic.type.select.addEventListener('change', () => this._automatic_swapType());
    this._automatic.container.append(this._automatic.type.select);

    this._automatic.type.regex = document.createElement('labeled-input');
    this._automatic.type.regex.marginBottom = '5px';
    this._automatic.type.regex.classList.add('hidden');
    this._automatic.type.regex.placeholder = 'Result URL';
    this._automatic.container.append(this._automatic.type.regex);

    this._automatic.type.internal = document.createElement('labeled-select');
    this._automatic.type.internal.marginBottom = '5px';
    this._automatic.type.internal.options = [
      {value: '/src/helper-pages/hard-blocked.html', display: 'Hard block'},
      {value: '/src/helper-pages/soft-blocked.html', display: 'Soft block'},
    ];
    this._automatic.type.internal.classList.add('hidden');
    this._automatic.container.append(this._automatic.type.internal);

    this._automatic_swapType();

    container.append(this._automatic.container);
  }

  _automatic_swapType() {
    this._automatic.type.regex.classList.toggle('hidden', this._automatic.type.select.value !== 'regex');
    this._automatic.type.internal.classList.toggle('hidden', this._automatic.type.select.value !== 'internal');
  }

  _setMode() {
    this._automatic.container.classList.toggle('hidden', this.type !== 'automatic');
    this._manualSwap.container.classList.toggle('hidden', this.type !== 'manual-swap');
    this._manualOneWay.container.classList.toggle('hidden', this.type !== 'manual-oneway');
  }

  init(data = {}) {
    this._alias.value = data?.alias ?? '';
    this._active.checked = data?.active ?? true;
    this._type.value = data?.type ?? 'automatic';
    this._setMode();

    if (this.type === 'automatic') {
      this._automatic.from.value = data?.from?.url ?? '';
      this._automatic.type.select.value = data?.to?.type ?? 'regex';
      this._automatic_swapType();

      if (this._automatic.type.select.value === 'regex') {
        this._automatic.type.regex.value = data?.to?.url ?? '';
      } else if (this._automatic.type.select.value === 'internal') {
        this._automatic.type.internal.value = data?.to?.url ?? '/src/helper-pages/hard-blocked.html';
      }
    } else if (this.type === 'manual-swap') {
      for (const url of data?.urls ?? []) {
        this._addURLOption(url);
      }

      if ((data?.urls ?? []).length === 0) {
        this._addURLOption();
      }
    } else if (this.type === 'manual-oneway') {
      this._manualOneWay.from.value = data?.from?.url ?? '';
      this._manualOneWay.to.value = data?.to?.url ?? '';
      this._manualOneWay.toAlias.value = data?.toAlias ?? '';
    }
  }

  _addURLOption(data = {}) {
    const container = document.createElement('div');
    container.classList.add('manual-url-option');

    const alias = document.createElement('labeled-input');
    alias.label = 'Alias';
    alias.value = data?.alias ?? '';
    alias.style.marginBottom = '5px';
    container.append(alias);

    const from = document.createElement('labeled-input');
    from.label = 'From';
    from.placeholder = 'Regex...';
    from.value = data?.from ?? '';
    from.style.marginBottom = '5px';
    container.append(from);

    const to = document.createElement('labeled-input');
    to.label = 'To';
    to.placeholder = 'URL';
    to.value = data?.to ?? '';
    to.style.marginBottom = '5px';
    container.append(to);

    const remove = document.createElement('button');
    remove.innerText = 'Remove URL Option';
    remove.addEventListener('click', () => {
      const idx = this._manualSwap.urls.findIndex(x => x.container === container);
      this._manualSwap.urls.splice(idx, 1);
      container.remove();
    });
    container.append(remove);

    this._manualSwap.container.append(container);
    this._manualSwap.urls.push({container, alias, from, to});
  }

  get alias() {
    return this._alias.value;
  }

  get active() {
    return this._active.checked;
  }

  get type() {
    return this._type.value;
  }

  get fromURL() {
    if (this.type === 'automatic') {
      return this._automatic.from.value;
    } else if (this.type === 'manual-oneway') {
      return this._manualOneWay.from.value;
    }

    return null;
  }

  get toType() {
    return this._automatic.type.select.value;
  }

  get toURL() {
    if (this.type === 'automatic') {
      if (this.toType === 'regex') {
        return this._automatic.type.regex.value;
      } else if (this.toType === 'internal') {
        return this._automatic.type.internal.value;
      }
    } else if (this.type === 'manual-oneway') {
      return this._manualOneWay.to.value;
    }
  }

  get toAlias() {
    return this._manualOneWay.toAlias.value;
  }

  get manualURLs() {
    return this._manualSwap.urls.map(x => {
      return {
        alias: x.alias.value,
        from: x.from.value,
        to: x.to.value,
      };
    })
  }
}

window.addEventListener('DOMContentLoaded', () => customElements.define('redirect-element', RedirectElement));