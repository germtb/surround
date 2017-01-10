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
};

const multicursor = false;

export default {

	subscriptions: null,

	activate(state) {
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'surround:surround-outer': () => {
				const editor = atom.workspace.getActiveTextEditor();
				const cursors = editor.cursors;
				const lines = editor.getBuffer().lines;

				const selectedText = editor.getSelectedText();
				if (selectedText) {
					const editorView = atom.views.getView(editor);
					atom.commands.dispatch(editorView, multicursor ? 'core:consolidate-selections' : 'core:move-left');
				}

				const { left, right } = this.findLeft(lines, cursors[0]);
				const ranges = multicursor ? cursors.reduce((acc, cursor) => {
					if (acc.some(r => r.some(p => p.isEqual(cursor.getBufferPosition())))) {
						return acc;
					}
					const { left, right } = this.findLeft(lines, cursor);
					return [ ...acc, [left, left.translate([0, 1])], [right.translate([0, -1]), right]];
				}, []) : [ [left, left.translate([0, 1])], [right.translate([0, -1]), right] ];

				if (ranges) {
					editor.setSelectedBufferRanges(ranges);
				}
			}
		}));

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'surround:surround-inner': () => {
				const editor = atom.workspace.getActiveTextEditor();
				const cursor = editor.cursors[0];
				const lines = editor.getBuffer().lines;

				// const { row, column } = cursor.getBufferPosition();
				// const leftChar = lines[row][column - 1 >= 0 ? column - 1 : 0];
				// const rightChar = lines[row][column];
				// if (symbols[leftChar] === rightChar) {
				// 	const editorView = atom.views.getView(editor);
				// 	atom.commands.dispatch(editorView, 'core:move-left');
				// }

				const selectedText = editor.getSelectedText();
				if (selectedText) {
					const editorView = atom.views.getView(editor);
					atom.commands.dispatch(editorView, 'core:move-right');
				}

				const markers = this.findLeft(lines, cursor);

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

	findLeft(lines, cursor) {
		const { row, column } = cursor.getBufferPosition();

		for (let r = row; r >= 0; r--) {
			for (let c = r === row ? column - 1 : lines[r].length - 1; c >= 0; c--) {
				const leftChar = lines[r][c];
				if (symbols[leftChar]) {
					const right = this.findRight(lines, leftChar, { row: r, column: c });
					if (right) {
						return { left: new Point(r, c), right };
					}
				}
			}
		}

		return null;
	},

	findRight(lines, leftChar, { row, column }) {
		let count = 1;

		for (let r = row; r < lines.length; r++) {
			for (let c = r === row ? column + 1 : 0; c < lines[r].length; c++) {
				const rightChar = lines[r][c];
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
