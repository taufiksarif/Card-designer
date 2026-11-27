// Run with: node templates/build.cjs — writes templates.js: the built-in templates, with their background pictures embedded.
const fs = require('fs'), root = require('path').join(__dirname, '..') + '/';
const png = (f) => `url("data:image/png;base64,${fs.readFileSync(root + 'templates/' + f).toString('base64')}")`;
// A movable, editable text element (positions and sizes in card units: the card is 520 x 328).
const text = (id, name, value, x, y, w, h, size, extra = {}) => ({ id, type: 'text', name, text: value, x, y, w, h, size, bold: false, weight: 400, color: '#000000', font: 'DM Sans, sans-serif', align: 'left', angle: 0, opacity: 1, radius: 0, fill: '#dff0e9', fit: 'cover', ...extra });
const templates = [{
  name: 'Jumper Tag',
  description: 'Front with a purple-to-orange side bar, title, contact text and serial number; back with the jumper safety rules and illustration. All text can be edited, moved and resized.',
  design: {
    name: 'Jumper Tag', width: 85.6, height: 54,
    background: { front: png('jumper-tag-front.png'), back: png('jumper-tag-back.png') },
    backgroundPreview: { front: null, back: null },
    backgroundFit: { front: 'cover', back: 'cover' },
    elements: {
      front: [
        text('cardtitle', 'Jumper Tag title', 'Jumper Tag', 54.52, 39.66, 165, 34, 27.77, { bold: undefined, weight: 500 }),
        text('footer', 'Contact text', 'Jumper can only be placed/removed by this card holder.\nIf found please contact : 800-8497736', 54.52, 289.57, 285, 26, 10.29),
        text('seriallabel', 'Serial Number label', 'Serial Number:', 350.78, 301.92, 72, 18, 10.29),
        { id: 'serialno', type: 'number', name: 'Serial number', text: 'JTH001', x: 424, y: 302, w: 80, h: 18, size: 10.3, bold: true, weight: 700, color: '#000000', font: 'DM Sans, sans-serif', align: 'left', angle: 0, opacity: 1, radius: 0, fill: '#dff0e9', fit: 'cover' },
      ],
      back: [
        text('title', 'Jumpers title', 'Jumpers', 37.55, 48.95, 150, 24, 19.57, { bold: true }),
        text('warning', 'Warning', 'Always count jumpers before and after use.', 37.55, 72.75, 440, 17, 13.78, { bold: true, color: '#F26522' }),
        text('rules', 'Jumper rules', 'Inspect jumpers for damage. Only use approved jumpers.\nJumpers may not be installed on the safety circuit when the elevator is in automatic operation. Always notify co-workers when jumpers are being used.', 37.55, 90.38, 448, 67, 13.78),
      ],
    },
  },
}];
fs.writeFileSync(root + 'templates.js',
  '// Built-in templates shown in the template window. Background pictures are 1011 x 638 px PNG (CR80 at 300 DPI); the source files are in templates/.\n' +
  `window.CARD_STUDIO_TEMPLATES=${JSON.stringify(templates)};\n`);
console.log('templates.js', fs.statSync(root + 'templates.js').size);
