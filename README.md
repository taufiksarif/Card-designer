# Card Studio

Card Studio is a local, browser-based card layout and bulk printing tool. Create both sides of a card, personalize each print from pasted spreadsheet data or a CSV file, then print through the printer driver installed on your computer. The app does not need Python or an account.

## Start the app

Keep all project files together in the same folder.

- **Windows:** double-click `Launch Card Studio.bat`.
- **macOS:** double-click `Launch Card Studio.command`. If macOS blocks it, right-click the file and choose **Open**. You may also open `index.html` in a browser.
- **Other computers:** open `index.html` in a recent desktop browser.

The launchers open the app directly in your browser; they do not install anything. Your current design autosaves in that browser on that computer. Use **Save project** to download a portable project JSON file and **Open** to load it later.

For the broadest support of saving templates directly into a chosen folder, use a recent Chrome or Edge browser. Browsers without folder access support can still download a reusable template file instead.

## Design a card

1. Choose a preset under **Card setup → Card size**, or enter custom width and height in millimeters. Use **Landscape** or **Portrait** to swap the orientation.
2. Switch between **Front** and **Back** to design each side independently.
3. Use **Add to card** to add text, images, QR codes, card numbers, ID numbers, or shapes. Select an item to edit its content and properties. Drag it on the canvas to position it.
4. For text, set the font, size, color, bold, italic, underline, strikethrough, and alignment. Use the arrange controls for shape fill, alignment, rotation, size, and position. Lock an element to prevent moving or resizing it while keeping its content editable.
5. Use **Background** to choose an image or a solid color. With an image, select **Fill card** to cover the card and crop overflow, or **Fit image** to show the whole image. The image keeps its proportions, and the original uploaded image data is retained for print output.
6. Use the zoom slider to change the on-screen preview size. It does not change the physical card dimensions.

To replace a placed image while keeping its size and position, select the image and choose **Replace image** in its properties.

## Save and reuse templates

Choose **Save as template**, enter a template name, then choose a local folder when the browser asks. The template includes card dimensions, backgrounds, and both sides of the layout. Load templates later from the same folder in the template window. If direct folder access is unavailable, the app downloads a `.cardtemplate.json` file that you can keep and open on another computer.

## Bulk personalize and number cards

1. Choose **Bulk personalize** or **Print cards**.
2. Paste comma or tab-separated spreadsheet data with a header row, or upload a CSV file. For example:

   ```csv
   Name,Role,IDNo
   Ava Chen,Designer,EMP-101
   Noah Patel,Engineer,EMP-102
   ```

3. In a text or QR element, use placeholders matching your column names, such as `{{Name}}`, `{{Role}}`, or `{{IDNo}}`. Add an **ID no.** element for a ready-made ID number field.
4. To make multiple cards for each person, set **Cards per person**. Each copy repeats that person's details while the automatic card number increments for every printed card. A `Copies` column can override the default for individual people.
5. Use `{{CardNo}}` in text, QR content, or a Card no. element. Automatic numbering has a configurable prefix, starting number, and digit count (for example, `ID-001`, `ID-002`, `ID-003`). Turn automatic numbering off to use a `CardNo` column from your data instead.
6. Review the queued card count and choose **Preview batch**. Inspect the first and last card in the batch, then select **Print next batch**. After the browser print dialog closes, reopen the preview to continue.

## Printing

The app opens the browser print dialog and sends card-sized pages to the operating system's printer driver. In the bulk drawer, set a **Printer profile**, choose the duplex flip edge, and set quality guidance; these preferences are remembered in the browser. Select the **Heidi CP55-D** (or the appropriate installed printer), stock, quality, and duplex options in the actual printer dialog/driver. The profile fields remind you of those choices; browser security does not let the app set printer-driver options directly. Disable browser headers and footers, and keep the driver's scale at 100% / actual size.

The app lays out each card at the selected dimensions. Final color, resolution, card feeding, duplex alignment, and print quality depend on the printer driver and printer settings.

## Notes

- Layouts and uploaded images are saved in this browser's IndexedDB (or local storage as a fallback) unless you export the project or template. They are not uploaded to a server.
- QR generation is bundled in `qrcode.js`, and DM Sans and Manrope font files are included in `fonts/`, so these features work offline. Keep the `fonts` folder alongside the app files.
- The bundled QR generator is MIT licensed. Font license texts are included in `fonts/DM-Sans-OFL.txt` and `fonts/Manrope-OFL.txt`.
- Before printing, use **Print alignment test** to check card size, margins, duplex orientation, and front/back registration. The center targets use different colors on the two sides.
- Bulk printing is split into batches of 10, 25, 50, 100, or 250 cards. The preview shows the first and last card in the current batch. Reopen the preview after the print dialog closes to move to the next batch.
- CSV import flags blank cells, missing or duplicate headers, invalid `Copies` counts, and duplicate manual `CardNo` values. Review warnings before printing.
- Printer profile, duplex guidance, and batch size are remembered in the browser. Duplex and quality still need to be selected in the operating system's printer dialog or driver.
- Project autosave uses browser IndexedDB where available, with a local-storage fallback. Large images use downscaled canvas previews while the original image is kept for print output. The app warns when browser storage is running low; export a project backup regularly.
- Use a recent desktop browser for best printing and file handling behavior.
