export class ImportExport {
  constructor(container, program) {
    this.container = container;
    this.program = program;
    this._build();
  }

  _build() {
    const panel = document.createElement('div');
    panel.className = 'flex gap-2 mt-3 pt-2 border-t border-gray-700';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold rounded transition-colors';
    exportBtn.textContent = 'Export JSON';
    exportBtn.addEventListener('click', () => this._export());

    const importBtn = document.createElement('button');
    importBtn.className = 'flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold rounded transition-colors';
    importBtn.textContent = 'Import JSON';
    importBtn.addEventListener('click', () => this._import());

    panel.appendChild(exportBtn);
    panel.appendChild(importBtn);
    this.container.appendChild(panel);

    // Hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', (e) => this._handleFile(e));
    this.container.appendChild(this.fileInput);
  }

  _export() {
    const data = this.program.toJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.programName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _import() {
    this.fileInput.click();
  }

  _handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.waypoints && Array.isArray(data.waypoints)) {
          this.program.fromJSON(data);
        } else {
          alert('Invalid program file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    this.fileInput.value = '';
  }
}
