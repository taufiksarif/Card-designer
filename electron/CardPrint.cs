// CardPrint — prints finished card pictures through standard Windows (GDI) printing.
//
// Card Studio draws each card side as a picture and hands the files to this helper, which shows the Windows
// print dialog and prints one page per picture, sized to the printer's own dots so it fills the card exactly and stays sharp. Card printer
// drivers handle plain bitmaps sent this way reliably; Chromium's own print pipeline can come out solid black
// on some of them.
//
// Usage:   CardPrint.exe [--title "Job name"] [--intent saturation|keep] page1.png [page2.png ...]
//          --intent saturation asks the driver to colour-match with its saturation ("business graphics") table,
//          which keeps flat colours strong; card printer drivers default to the paler photographic table.
// Testing: --printer "Name" skips the dialog; --to-file out.pdf prints to a file (e.g. with Microsoft Print to PDF).
// Exit:    0 printed, 2 cancelled in the dialog, 1 error (message on stderr).
// Output:  the chosen printer's name on stdout.
//
// Built by "npm run build:helper" with the C# compiler that ships with Windows (.NET Framework 4).
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Printing;
using System.Windows.Forms;

internal static class CardPrint
{
    [STAThread]
    private static int Main(string[] args)
    {
        string title = "Card Studio", printer = null, toFile = null, intent = "keep";
        var files = new List<string>();
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--title" && i + 1 < args.Length) title = args[++i];
            else if (args[i] == "--printer" && i + 1 < args.Length) printer = args[++i];
            else if (args[i] == "--to-file" && i + 1 < args.Length) toFile = args[++i];
            else if (args[i] == "--intent" && i + 1 < args.Length) intent = args[++i];
            else files.Add(args[i]);
        }
        if (files.Count == 0)
        {
            Console.Error.WriteLine("No pages to print.");
            return 1;
        }

        Bitmap current = null; // pages are loaded one at a time, so long runs don't fill memory
        try
        {
            foreach (string file in files)
                if (!System.IO.File.Exists(file)) throw new System.IO.FileNotFoundException("Missing page: " + file);

            var document = new PrintDocument();
            document.DocumentName = title;
            document.OriginAtMargins = false;

            if (printer != null)
            {
                document.PrinterSettings.PrinterName = printer;
                if (!document.PrinterSettings.IsValid) throw new InvalidOperationException("Printer not found: " + printer);
                if (toFile != null)
                {
                    document.PrinterSettings.PrintToFile = true;
                    document.PrinterSettings.PrintFileName = toFile;
                }
            }
            else using (var owner = new Form())
            using (var dialog = new PrintDialog())
            {
                // An invisible topmost owner keeps the dialog in front of the Card Studio window.
                owner.TopMost = true;
                owner.ShowInTaskbar = false;
                owner.StartPosition = FormStartPosition.CenterScreen;
                owner.Size = new Size(1, 1);
                owner.Opacity = 0;
                owner.Show();
                owner.Activate();

                dialog.Document = document;
                dialog.UseEXDialog = true;
                dialog.AllowSomePages = false;
                dialog.AllowSelection = false;
                dialog.AllowPrintToFile = false;
                if (dialog.ShowDialog(owner) != DialogResult.OK) return 2;
            }

            if (intent == "saturation") SetIcmIntent(document, DMICM_SATURATE);
            document.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);
            Console.WriteLine(document.PrinterSettings.PrinterName);

            int next = 0;
            // Match each page's orientation to its picture, so a landscape card isn't squeezed onto a portrait page.
            document.QueryPageSettings += delegate (object sender, QueryPageSettingsEventArgs e)
            {
                if (next >= files.Count) return;
                if (current == null) current = LoadOpaque(files[next]);
                e.PageSettings.Landscape = current.Width > current.Height;
            };
            document.PrintPage += delegate (object sender, PrintPageEventArgs e)
            {
                if (current == null) current = LoadOpaque(files[next]);
                Bitmap page = current;
                Graphics g = e.Graphics;

                // Work in the printer's own pixels, so each picture pixel lands on exactly one printer dot.
                g.PageUnit = GraphicsUnit.Pixel;
                float dotsX = g.DpiX / 100f, dotsY = g.DpiY / 100f; // page sizes are in 1/100 inch
                // Draw over the whole physical card: undo the printer's hard margins, then fill the page.
                g.TranslateTransform(-e.PageSettings.HardMarginX * dotsX, -e.PageSettings.HardMarginY * dotsY);
                int width = (int)Math.Round(e.PageBounds.Width * dotsX), height = (int)Math.Round(e.PageBounds.Height * dotsY);
                if ((width > height) != (page.Width > page.Height))
                {
                    // The driver kept the other orientation: turn the picture to fit.
                    g.TranslateTransform(width, 0);
                    g.RotateTransform(90);
                    int swap = width; width = height; height = swap;
                }

                using (Bitmap exact = FitExactly(page, width, height))
                {
                    exact.SetResolution(g.DpiX, g.DpiY);
                    g.InterpolationMode = InterpolationMode.NearestNeighbor;
                    g.PixelOffsetMode = PixelOffsetMode.Half;
                    g.CompositingMode = CompositingMode.SourceCopy;
                    g.DrawImage(exact, new Rectangle(0, 0, width, height), 0, 0, width, height, GraphicsUnit.Pixel);
                }

                current.Dispose();
                current = null;
                next++;
                e.HasMorePages = next < files.Count;
            };
            document.Print();
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
        finally
        {
            if (current != null) current.Dispose();
        }
    }

    private const int DMICM_SATURATE = 1;
    private const int DM_ICMINTENT = 0x01000000;
    private const int DEVMODE_FIELDS = 72, DEVMODE_ICMINTENT = 192, DEVMODE_PUBLIC_SIZE = 196; // offsets in DEVMODEW

    [System.Runtime.InteropServices.DllImport("kernel32.dll")] private static extern IntPtr GlobalLock(IntPtr handle);
    [System.Runtime.InteropServices.DllImport("kernel32.dll")] private static extern bool GlobalUnlock(IntPtr handle);
    [System.Runtime.InteropServices.DllImport("kernel32.dll")] private static extern IntPtr GlobalFree(IntPtr handle);

    // Set the colour-matching rendering intent in the job's settings (everything chosen in the print dialog is kept).
    private static void SetIcmIntent(PrintDocument document, int value)
    {
        IntPtr handle = document.PrinterSettings.GetHdevmode(document.DefaultPageSettings);
        try
        {
            IntPtr devmode = GlobalLock(handle);
            try
            {
                short size = System.Runtime.InteropServices.Marshal.ReadInt16(devmode, 68); // dmSize
                if (size < DEVMODE_PUBLIC_SIZE) return; // an old DEVMODE without ICM fields
                int fields = System.Runtime.InteropServices.Marshal.ReadInt32(devmode, DEVMODE_FIELDS);
                System.Runtime.InteropServices.Marshal.WriteInt32(devmode, DEVMODE_FIELDS, fields | DM_ICMINTENT);
                System.Runtime.InteropServices.Marshal.WriteInt32(devmode, DEVMODE_ICMINTENT, value);
            }
            finally { GlobalUnlock(handle); }
            document.PrinterSettings.SetHdevmode(handle);
            document.DefaultPageSettings.SetHdevmode(handle);
        }
        finally { GlobalFree(handle); }
    }

    // Resize a picture once, with high-quality filtering, to the exact number of printer dots it will cover.
    private static Bitmap FitExactly(Bitmap source, int width, int height)
    {
        var bitmap = new Bitmap(width, height, PixelFormat.Format24bppRgb);
        using (Graphics g = Graphics.FromImage(bitmap))
        {
            if (source.Width == width && source.Height == height)
            {
                g.CompositingMode = CompositingMode.SourceCopy;
                g.InterpolationMode = InterpolationMode.NearestNeighbor;
                g.PixelOffsetMode = PixelOffsetMode.Half;
            }
            else
            {
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.CompositingQuality = CompositingQuality.HighQuality;
            }
            using (var attributes = new ImageAttributes())
            {
                attributes.SetWrapMode(WrapMode.TileFlipXY); // no pale fringe along the card edges
                g.DrawImage(source, new Rectangle(0, 0, width, height), 0, 0, source.Width, source.Height, GraphicsUnit.Pixel, attributes);
            }
        }
        return bitmap;
    }

    // Load a picture as 24-bit RGB on white, so no transparency ever reaches the printer driver.
    private static Bitmap LoadOpaque(string file)
    {
        using (var source = Image.FromFile(file))
        {
            var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format24bppRgb);
            bitmap.SetResolution(source.HorizontalResolution, source.VerticalResolution);
            using (Graphics g = Graphics.FromImage(bitmap))
            {
                g.Clear(Color.White);
                g.DrawImage(source, new Rectangle(0, 0, source.Width, source.Height));
            }
            return bitmap;
        }
    }
}
