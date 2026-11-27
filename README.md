# Card Studio

Card Studio is a portable Windows app for designing and printing cards. Design both sides of a card, then print one card or a run of cards numbered in sequence (JTG001, JTG002, JTG003 …) through the printer driver installed on your computer. It works offline and needs no account, installation or administrator rights.

## Run Card Studio

Use either download:

- **Single file:** copy `CardStudio-Portable-<version>.exe` anywhere you can write to (Desktop, Documents, a USB stick) and double-click it. It starts a few seconds more slowly because it unpacks itself each time.
- **Folder version (faster start):** extract `CardStudio-<version>-win-x64.zip` to a folder and run `Card Studio.exe` inside it.

Your designs, settings and template folder choice are saved in a `Card Studio Data` folder next to the app, so they move with it. If that folder can't be written to, the app saves to `%APPDATA%\Card Studio` instead. Use **Save project** to keep a project file as a backup or to move a design to another computer, and **Open** to load it.

The app isn't code-signed, so the first time you run it, Windows SmartScreen may show "Windows protected your PC". Choose **More info → Run anyway**.

## Build on Windows

Building turns the source files into the portable app. You only need the tools below on the computer that builds the app; the computers that run it need nothing except the card printer's driver.

### What you need

| Requirement | Version | Notes |
| --- | --- | --- |
| Windows | 10 or 11, 64-bit | The build compiles a small Windows print helper, so it must run on Windows. |
| [Node.js](https://nodejs.org) | 22.12 or newer (the current LTS is recommended) | Includes npm. Install it with the default options. |
| .NET Framework 4.x | Built into Windows 10 and 11 | Provides the C# compiler (`C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`) used to build `CardPrint.exe`. Nothing to install. |
| Internet connection | First build only | `npm install` downloads Electron and electron-builder (about 450 MB) into `node_modules`. |
| Git | Optional | Only needed to clone the repository; you can also download it as a ZIP from GitHub. |

No administrator rights are needed to build.

### Steps

1. **Install Node.js** from [nodejs.org](https://nodejs.org) (LTS). Open a new **Command Prompt** and check it works:

   ```
   node -v
   npm -v
   ```

   `node -v` must show `v22.12.0` or later.

2. **Get the source code**, either with Git:

   ```
   git clone https://github.com/taufiksarif/Card-designer.git
   cd Card-designer
   ```

   or by downloading the ZIP from GitHub, extracting it, and opening a Command Prompt in the extracted folder.

3. **Install the build tools** (once, or after `package.json` changes):

   ```
   npm install
   ```

4. **Build the app:**

   ```
   npm run dist
   ```

   This compiles the print helper (`electron/CardPrint.cs` → `electron/bin/CardPrint.exe`) and then packages the app. It takes a minute or two.

5. **Collect the result** from the `dist` folder:

   - `CardStudio-Portable-<version>.exe`: the single-file portable app.
   - `CardStudio-<version>-win-x64.zip`: the folder version.
   - `win-unpacked\`: the unpacked app, handy for testing (`win-unpacked\Card Studio.exe`).

To try changes without packaging, run `npm start`, which opens the app straight from the source files.

### Built-in templates

The built-in templates live in `templates.js`, which embeds the background pictures from the `templates` folder. After changing those pictures or `templates/build.cjs`, regenerate it before building:

```
node templates/build.cjs
```

### Troubleshooting

- **"running scripts is disabled on this system" in PowerShell**: PowerShell blocks `npm.ps1`. Use **Command Prompt** instead, or run `npm.cmd install` and `npm.cmd run dist`.
- **`csc.exe` is not recognized / cannot be found**: the .NET Framework 4 compiler is missing. It comes with Windows 10 and 11; if it is gone, install the [.NET Framework 4.8 runtime](https://dotnet.microsoft.com/download/dotnet-framework/net48) and check that `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe` exists.
- **Build fails with "The process cannot access the file"**: close Card Studio if it is running from `dist\win-unpacked`, then build again. Your designs in `dist\win-unpacked\Card Studio Data` are deleted when `dist` is rebuilt, so copy that folder somewhere safe first and put it back afterwards.
- **`npm install` fails behind a proxy**: set the proxy for npm (`npm config set proxy http://host:port` and `npm config set https-proxy http://host:port`) and try again.

## Design a card

1. Choose a preset under **Card setup → Card size**, or enter custom width and height in millimeters. Use **Landscape** or **Portrait** to swap the orientation.
2. Switch between **Front** and **Back** to design each side independently.
3. Use **Add to card** to add text, images, QR codes, card numbers, barcodes, or shapes. Select an item to edit its content and properties. Drag it on the canvas to position it.
4. For text, set the font, size, color, bold, italic, underline, strikethrough, and alignment. Use the arrange controls for shape fill, alignment, rotation, size, and position. Lock an element to prevent moving or resizing it while keeping its content editable.
5. Use **Background** to choose an image or a solid color. With an image, select **Fill card** to cover the card and crop overflow, or **Fit image** to show the whole image. The image keeps its proportions, and the original uploaded image data is retained for print output.
6. Use the zoom slider to change the on-screen preview size. It does not change the physical card dimensions.

To replace a placed image while keeping its size and position, select the image and choose **Replace image** in its properties.

## Save and reuse templates

Choose **Save as template**, enter a template name, then choose a folder when the app asks. The template includes card dimensions, backgrounds, and both sides of the layout. Load templates later from the same folder in the template window. The template window also lists **built-in templates**, such as **Jumper Tag** (a CR80 jumper tag with a purple-to-orange side bar, a serial number on the front and the jumper safety rules on the back). Their 1011 × 638 px background pictures are in `templates/`; after changing them, run `node templates/build.cjs` to update `templates.js`. If direct folder access is unavailable, the app downloads a `.cardtemplate.json` file that you can keep and open on another computer.

## Print cards

Choose **Print cards** in the top bar (or the shortcut at the bottom right). The print dialog has four settings:

- **Card number**: the number for the first card, for example `JTG001`. The last group of digits counts up and keeps its leading zeros: `JTG001`, `JTG002`, `JTG003` … `JTG999`, `JTG1000`. Letters or symbols after the digits stay as they are (`JTG001-X`, `JTG002-X`). The number can include `{{Year}}`, `{{YY}}`, `{{Month}}` or `{{Day}}`, so `JTG{{YY}}-001` prints as `JTG26-001`.
- **Quantity**: 1 card by default. Enter more to print a run of cards numbered in sequence (up to 500 at a time).
- **Sides**: **Front only**, or **Front and back**.
- **Colour**: **Vivid** (default) strengthens colours and slightly deepens mid-tones, because dye-sublimation card printers print paler than a screen shows. **Extra vivid** does more of both, for printers or ribbons that still print pale. Both keep each colour's hue, and both ask the printer driver to colour-match with its saturation ("business graphics") setting instead of its paler photographic one. **As designed** prints the colours unchanged with the driver's own setting. Near-black text and codes are always printed as pure black, which card printer drivers can print with the sharp black (K) ribbon panel.

The dialog previews the first card (and the last one, for a run) with its number, and checks the design before you print: blank sides, content outside the card edge, barcodes that can't be encoded, and placeholders that won't be filled in.

After the print dialog closes, Card Studio asks whether the cards printed correctly. Choose **OK** and the card number moves on to the next one (after printing `JTG001` to `JTG005`, the next number is `JTG006`). Choose **Cancel** to keep the same number, so you can print those cards again. The next number is remembered, so the sequence continues the next time you open the app. To reprint a damaged card, type its number into **Card number** and print 1 card.

To put the card number on a card, add a **No.** element, use `{{CardNo}}` in a text or QR element, or add a **Barcode** (a Code 128 barcode of `{{CardNo}}` by default). Designs without a card number print the same card each time, and the number is left unchanged. Text elements can also use `{{Year}}`, `{{YY}}`, `{{Month}}`, `{{Day}}` and `{{Today}}`, which are filled in with the date of printing.

## Printing

Card Studio draws each card side as a finished 300 DPI lossless picture and prints one page per side, in order: front, back, front, back … It prints these pictures through standard Windows printing (the bundled CardPrint.exe helper), which card printer drivers handle reliably.

In the print dialog, choose your card printer. For **Front and back**, turn on two-sided printing in the printer's **Preferences** (card printers such as the Heidi CP55 set this in their own driver settings, not in the Windows dialog); otherwise each side prints on a separate card. Ribbon, colour and quality options are also in the printer's Preferences. Each computer needs the printer's driver installed once.

The app lays out each card at the selected dimensions. Final color, resolution, card feeding, duplex alignment, and print quality depend on the printer driver and printer settings.

## Notes

- Layouts and uploaded images are saved in the app's data folder unless you export the project or template. They are not uploaded to a server.
- QR generation is bundled in `qrcode.js`, and DM Sans and Manrope font files are included in `fonts/`, so these features work offline.
- The bundled QR generator is MIT licensed. Font license texts are included in `fonts/DM-Sans-OFL.txt` and `fonts/Manrope-OFL.txt`.
- Before printing, use **Print alignment test** in the print dialog to check card size, margins, duplex orientation, and front/back registration. The center targets use different colors on the two sides.
- Large images use downscaled canvas previews while the original image is kept for print output. The app warns when storage is running low; export a project backup regularly.
