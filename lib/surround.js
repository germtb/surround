'use babel';

import { CompositeDisposable, Point } from 'atom';

const symbols = {
	'\'': '\'',
	'\"': '\"',
	'(': ')',
	'[': ']',
	'<': '>',
	'`': '`',
	'{': '}'
}

export default {

	subscriptions: null,

	activate(state) {
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'surround:surround-outer': () => {
				const editor = atom.workspace.getActiveTextEditor();
				const cursor = editor.cursors[0];
				const selectedText = editor.getSelectedText();

				if (selectedText) {
					const editorView = atom.views.getView(editor);
					atom.commands.dispatch(editorView, 'core:move-left');
				}

				const markers = this.findLeft(cursor);

				if (markers && markers.left && markers.right) {
					const { left, right } = markers;
					editor.setSelectedBufferRanges([
						[left, left.translate([0, 1])],
						[right.translate([0, -1]), right],
					]);
				}
			}
		}));

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'surround:surround-inner': () => {
				const editor = atom.workspace.getActiveTextEditor();
				const cursor = editor.cursors[0];

				const buffer = editor.getBuffer();
				const selectedText = editor.getSelectedText();
				const { row, column } = cursor.getBufferPosition();
				const leftChar = buffer.lines[row][column - 1 >= 0 ? column - 1 : 0];
				const rightChar = buffer.lines[row][column];
				if (symbols[leftChar] === rightChar) {
					const editorView = atom.views.getView(editor);
					atom.commands.dispatch(editorView, 'core:move-left');
				}

				if (selectedText) {
					const editorView = atom.views.getView(editor);
					atom.commands.dispatch(editorView, 'core:move-left');
					atom.commands.dispatch(editorView, 'core:move-left');
				}

				const markers = this.findLeft(cursor);

				if (markers && markers.left && markers.right) {
					const { left, right } = markers;
					editor.setSelectedBufferRange([left.translate([0, 1]), right.translate([0, -1])]);
				}
			}
		}));

	},

	deactivate() {
		this.subscriptions.dispose();
	},

	serialize() {
		return {};
	},

	findLeft(cursor) {
		const editor = atom.workspace.getActiveTextEditor();
		const buffer = editor.getBuffer();
		const { row, column } = cursor.getBufferPosition();

		for (let r = row; r >= 0; r--) {
			for (let c = r === row ? column - 1 : buffer.lines[r].length - 1; c >= 0; c--) {
				const leftChar = buffer.lines[r][c];
				if (symbols[leftChar]) {
					const right = this.findRight(leftChar, { row: r, column: c });
					if (right) {
						return { left: new Point(r, c), right };
					}
				}
			}
		}

		return null;
	},

	findRight(leftChar, { row, column }) {
		const editor = atom.workspace.getActiveTextEditor();
		const buffer = editor.getBuffer();
		let count = 1;

		for (let r = row; r < buffer.lines.length; r++) {
			for (let c = r === row ? column + 1 : 0; c < buffer.lines[r].length; c++) {
				const rightChar = buffer.lines[r][c];
				if (rightChar === symbols[leftChar]) {
					count -= 1;
					if (count === 0) {
						return new Point(r, c + 1);
					}
				} else if (rightChar === leftChar) {
					count += 1;
				}
			}
		}

		return null;
	}

};
