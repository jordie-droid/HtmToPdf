const {
    chromium: playwright
} = require("playwright-core");

const {
    pathToFileURL
} = require("url");

const os = require("os");
const path = require("path");
const fs = require("fs");

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const PAGE_TIMEOUT =
    Number(process.env.PAGE_TIMEOUT) || 120000;

/*
|--------------------------------------------------------------------------
| Browser
|--------------------------------------------------------------------------
*/

let browser = null;

/*
|--------------------------------------------------------------------------
| Chromium Sparticuz
|--------------------------------------------------------------------------
*/

let sparticuzChromium = null;

/*
|--------------------------------------------------------------------------
| Détection environnement
|--------------------------------------------------------------------------
*/

const IS_VERCEL =
    Boolean(process.env.VERCEL);

const IS_WINDOWS =
    process.platform === "win32";

const IS_LOCAL =
    !IS_VERCEL && IS_WINDOWS;

/*
|--------------------------------------------------------------------------
| Chargement dynamique de @sparticuz/chromium
|--------------------------------------------------------------------------
|
| IMPORTANT :
| @sparticuz/chromium est ESM.
|
| Notre projet reste en CommonJS.
|
| On utilise donc import() au lieu de require().
|
|--------------------------------------------------------------------------
*/

async function getSparticuzChromium() {

    if (
        sparticuzChromium
    ) {
        return sparticuzChromium;
    }

    console.log(
        "Chargement de @sparticuz/chromium..."
    );

    const module =
        await import("@sparticuz/chromium");

    /*
    |--------------------------------------------------------------------------
    | Selon la version du package, l'export peut être default
    | ou directement exposé.
    |--------------------------------------------------------------------------
    */

    sparticuzChromium =
        module.default || module;

    console.log(
        "@sparticuz/chromium chargé."
    );

    return sparticuzChromium;
}

/*
|--------------------------------------------------------------------------
| Recherche Chromium local Windows
|--------------------------------------------------------------------------
*/

function findLocalChromium() {

    const possibleRoots = [];

    /*
    |--------------------------------------------------------------------------
    | LOCALAPPDATA
    |--------------------------------------------------------------------------
    */

    if (
        process.env.LOCALAPPDATA
    ) {

        possibleRoots.push(
            path.join(
                process.env.LOCALAPPDATA,
                "ms-playwright"
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | USERPROFILE
    |--------------------------------------------------------------------------
    */

    if (
        process.env.USERPROFILE
    ) {

        possibleRoots.push(
            path.join(
                process.env.USERPROFILE,
                "AppData",
                "Local",
                "ms-playwright"
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | HOME
    |--------------------------------------------------------------------------
    */

    const home =
        os.homedir();

    possibleRoots.push(
        path.join(
            home,
            "AppData",
            "Local",
            "ms-playwright"
        )
    );

    /*
    |--------------------------------------------------------------------------
    | Recherche
    |--------------------------------------------------------------------------
    */

    for (
        const root of possibleRoots
    ) {

        if (
            !fs.existsSync(root)
        ) {
            continue;
        }

        const executable =
            findChromiumExecutable(
                root
            );

        if (
            executable
        ) {

            return executable;
        }
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Recherche récursive chrome.exe / chrome
|--------------------------------------------------------------------------
*/

function findChromiumExecutable(
    root
) {

    try {

        const entries =
            fs.readdirSync(
                root,
                {
                    withFileTypes: true
                }
            );

        for (
            const entry of entries
        ) {

            const fullPath =
                path.join(
                    root,
                    entry.name
                );

            if (
                entry.isDirectory()
            ) {

                const result =
                    findChromiumExecutable(
                        fullPath
                    );

                if (
                    result
                ) {

                    return result;
                }

            } else {

                /*
                |--------------------------------------------------------------------------
                | Windows
                |--------------------------------------------------------------------------
                */

                if (
                    process.platform ===
                    "win32"
                ) {

                    if (
                        entry.name ===
                        "chrome.exe"
                    ) {

                        return fullPath;
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Linux
                |--------------------------------------------------------------------------
                */

                else {

                    if (
                        entry.name ===
                        "chrome" ||
                        entry.name ===
                        "chrome-headless-shell"
                    ) {

                        return fullPath;
                    }
                }
            }
        }

    } catch (error) {

        return null;
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Démarrage Chromium
|--------------------------------------------------------------------------
*/

async function getBrowser() {

    /*
    |--------------------------------------------------------------------------
    | Réutiliser le navigateur
    |--------------------------------------------------------------------------
    */

    if (
        browser
    ) {

        try {

            if (
                browser.isConnected()
            ) {

                return browser;
            }

        } catch (error) {

            console.warn(
                "Navigateur existant inutilisable."
            );
        }

        browser = null;
    }

    /*
    |--------------------------------------------------------------------------
    | LOCAL WINDOWS
    |--------------------------------------------------------------------------
    */

    if (
        IS_LOCAL
    ) {

        console.log(
            "========================================"
        );

        console.log(
            "Environnement : LOCAL WINDOWS"
        );

        console.log(
            "Recherche de Chromium..."
        );

        const executablePath =
            findLocalChromium();

        if (
            !executablePath
        ) {

            throw new Error(
                [
                    "Chromium local introuvable.",
                    "",
                    "Exécute :",
                    "npx playwright-core install chromium"
                ].join("\n")
            );
        }

        console.log(
            `Chromium local : ${executablePath}`
        );

        console.log(
            "Démarrage de Chromium..."
        );

        browser =
            await playwright.launch({

                headless: true,

                executablePath,

                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            });

        console.log(
            "Chromium local démarré."
        );

        return browser;
    }

    /*
    |--------------------------------------------------------------------------
    | VERCEL / LINUX
    |--------------------------------------------------------------------------
    */

    console.log(
        "========================================"
    );

    console.log(
        "Environnement : VERCEL / SERVERLESS"
    );

    /*
    |--------------------------------------------------------------------------
    | Chargement Sparticuz
    |--------------------------------------------------------------------------
    */

    const chromium =
        await getSparticuzChromium();

    /*
    |--------------------------------------------------------------------------
    | Mode graphique
    |--------------------------------------------------------------------------
    */

    try {

        chromium.setGraphicsMode =
            false;

    } catch (error) {

        console.warn(
            "Impossible de modifier le mode graphique :",
            error.message
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Chemin Chromium
    |--------------------------------------------------------------------------
    */

    console.log(
        "Récupération du chemin Chromium..."
    );

    const executablePath =
        await chromium.executablePath();

    console.log(
        `Chromium serverless : ${executablePath}`
    );

    /*
    |--------------------------------------------------------------------------
    | Dossier temporaire Chromium
    |--------------------------------------------------------------------------
    */

    const userDataDir =
        path.join(
            "/tmp",
            `playwright-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`
        );

    await fs.promises.mkdir(
        userDataDir,
        {
            recursive: true
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Démarrage
    |--------------------------------------------------------------------------
    */

    console.log(
        "Démarrage de Chromium serverless..."
    );

    browser =
        await playwright.launch({

            executablePath,

            args: [
                ...chromium.args,

                `--user-data-dir=${userDataDir}`
            ],

            headless: true
        });

    console.log(
        "Chromium serverless démarré."
    );

    /*
    |--------------------------------------------------------------------------
    | Nettoyage
    |--------------------------------------------------------------------------
    */

    browser.on(
        "disconnected",
        async () => {

            try {

                await fs.promises.rm(
                    userDataDir,
                    {
                        recursive: true,
                        force: true
                    }
                );

            } catch (error) {

                console.warn(
                    "Impossible de supprimer le profil Chromium :",
                    error.message
                );
            }
        }
    );

    return browser;
}

/*
|--------------------------------------------------------------------------
| HTML → PDF
|--------------------------------------------------------------------------
*/

async function htmlFileToPdf(
    htmlFilePath
) {

    /*
    |--------------------------------------------------------------------------
    | Vérification fichier
    |--------------------------------------------------------------------------
    */

    if (
        !htmlFilePath
    ) {

        throw new Error(
            "Le chemin du fichier HTML est obligatoire."
        );
    }

    if (
        !fs.existsSync(
            htmlFilePath
        )
    ) {

        throw new Error(
            `Le fichier HTML n'existe pas : ${htmlFilePath}`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Browser
    |--------------------------------------------------------------------------
    */

    const browserInstance =
        await getBrowser();

    /*
    |--------------------------------------------------------------------------
    | Context
    |--------------------------------------------------------------------------
    */

    const context =
        await browserInstance.newContext({

            viewport: {
                width: 1280,
                height: 720
            },

            javaScriptEnabled: true
        });

    /*
    |--------------------------------------------------------------------------
    | Page
    |--------------------------------------------------------------------------
    */

    const page =
        await context.newPage();

    try {

        /*
        |--------------------------------------------------------------------------
        | Timeouts
        |--------------------------------------------------------------------------
        */

        page.setDefaultTimeout(
            PAGE_TIMEOUT
        );

        page.setDefaultNavigationTimeout(
            PAGE_TIMEOUT
        );

        /*
        |--------------------------------------------------------------------------
        | URL du fichier
        |--------------------------------------------------------------------------
        */

        const fileUrl =
            pathToFileURL(
                htmlFilePath
            ).href;

        console.log(
            `Chargement : ${fileUrl}`
        );

        /*
        |--------------------------------------------------------------------------
        | Chargement
        |--------------------------------------------------------------------------
        */

        await page.goto(
            fileUrl,
            {
                waitUntil: "networkidle",
                timeout: PAGE_TIMEOUT
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Fonts
        |--------------------------------------------------------------------------
        */

        await page.evaluate(
            async () => {

                if (
                    document.fonts
                ) {

                    await document.fonts.ready;
                }
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Images
        |--------------------------------------------------------------------------
        */

        await page.evaluate(
            async () => {

                const images =
                    Array.from(
                        document.images
                    );

                await Promise.all(
                    images.map(
                        img => {

                            if (
                                img.complete
                            ) {

                                return Promise.resolve();
                            }

                            return new Promise(
                                resolve => {

                                    img.onload =
                                        resolve;

                                    img.onerror =
                                        resolve;
                                }
                            );
                        }
                    )
                );
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Stabilisation
        |--------------------------------------------------------------------------
        */

        await page.waitForTimeout(
            100
        );

        /*
        |--------------------------------------------------------------------------
        | Diagnostic
        |--------------------------------------------------------------------------
        */

        const pageInfo =
            await page.evaluate(
                () => ({

                    title:
                        document.title,

                    width:
                        document.documentElement
                            .scrollWidth,

                    height:
                        document.documentElement
                            .scrollHeight,

                    images:
                        document.images.length,

                    bodyLength:
                        document.body
                            ? document.body.innerHTML.length
                            : 0
                })
            );

        console.log(
            "Informations page :",
            pageInfo
        );

        /*
        |--------------------------------------------------------------------------
        | PDF
        |--------------------------------------------------------------------------
        */

        console.log(
            "Génération du PDF..."
        );

        const pdfBuffer =
            await page.pdf({

                format:
                    process.env.PDF_FORMAT ||
                    "A4",

                printBackground:
                    true,

                preferCSSPageSize:
                    true,

                margin: {

                    top:
                        process.env.PDF_MARGIN_TOP ||
                        "0",

                    right:
                        process.env.PDF_MARGIN_RIGHT ||
                        "0",

                    bottom:
                        process.env.PDF_MARGIN_BOTTOM ||
                        "0",

                    left:
                        process.env.PDF_MARGIN_LEFT ||
                        "0"
                },

                displayHeaderFooter:
                    false
            });

        /*
        |--------------------------------------------------------------------------
        | Validation PDF
        |--------------------------------------------------------------------------
        */

        if (
            !pdfBuffer ||
            pdfBuffer.length === 0
        ) {

            throw new Error(
                "Le PDF généré est vide."
            );
        }

        console.log(
            `PDF généré : ${(
                pdfBuffer.length /
                1024 /
                1024
            ).toFixed(2)} MB`
        );

        return pdfBuffer;

    } finally {

        /*
        |--------------------------------------------------------------------------
        | Fermeture page
        |--------------------------------------------------------------------------
        */

        try {

            await page.close();

        } catch (error) {

            console.warn(
                "Erreur fermeture page :",
                error.message
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Fermeture context
        |--------------------------------------------------------------------------
        */

        try {

            await context.close();

        } catch (error) {

            console.warn(
                "Erreur fermeture context :",
                error.message
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| Fermeture navigateur
|--------------------------------------------------------------------------
*/

async function closeBrowser() {

    if (
        browser
    ) {

        console.log(
            "Fermeture de Chromium..."
        );

        try {

            await browser.close();

        } catch (error) {

            console.warn(
                "Erreur fermeture Chromium :",
                error.message
            );
        }

        browser = null;
    }
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    htmlFileToPdf,
    closeBrowser
};