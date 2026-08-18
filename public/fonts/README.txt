Drop your licensed web font files here to turn on your real brand fonts.

Why they're not already here: "Beautifully Delicious" and "The Seasons" are
commercial fonts from the My Creative Land foundry (sold through Fontspring /
Fonts.com / TypeNetwork). They're not free fonts, so it wouldn't be right to
pull copies from the open web into your app - that needs your own licensed
copy, specifically a WEB font license (a desktop license alone usually isn't
legally allowed to be loaded on a website; check what you bought, or contact
the foundry if unsure).

What to do once you have the files:

1. Save your files here as:
     BeautifullyDelicious.woff2
     TheSeasons.woff2
   (woff2 is the modern, smallest web format. If you only have .otf or .ttf,
   those will work too, just update the file name + format in the CSS below.)

2. Open public/css/styles.css and find the commented-out @font-face block
   near the top (look for "Brand fonts"). Delete the /* and */ around it so
   it becomes active.

3. Refresh the app. Every page already points to these font names through
   the --font-display and --font-secondary variables, so nothing else needs
   to change.

Until you do this, the app uses a tasteful serif fallback so it doesn't look
broken. Once your real fonts are in place, the app will fully match your
brand automatically.
