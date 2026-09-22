const {
    chromium: playwright
} = require("playwright-core");

const sparticuzChromium =
    require("@sparticuz/chromium");

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
| Détection de l'environnement
|--------------------------------------------------------------------------
|
| Vercel fonctionne sous Linux.
| En développement sur ton PC Windows, on utilise Chromium installé
| par Playwright.
|
|--------------------------------------------------------------------------
*/

const IS_WINDOWS =
    process.platform === "win32";

const IS_VERCEL =
    Boolean(process.env.VERCEL);

const IS_LOCAL =
    IS_WINDOWS && !IS_VERCEL;

/*
|--------------------------------------------------------------------------
| Browser singleton
|--------------------------------------------------------------------------
*/

let browser = null;

/*
|--------------------------------------------------------------------------
| Recherche du Chromium local
|--------------------------------------------------------------------------
*/

function findLocalChromium() {

    /*
    |--------------------------------------------------------------------------
    | PLAYWRIGHT_BROWSERS_PATH personnalisé
    |--------------------------------------------------------------------------
    */

    if (
        process.env.PLAYWRIGHT_BROWSERS_PATH &&
        process.env.PLAYWRIGHT_BROWSERS_PATH !== "0"
    ) {

        console.log(
            "PLAYWRIGHT_BROWSERS_PATH détecté :",
            process.env.PLAYWRIGHT_BROWSERS_PATH
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Chromium installé par Playwright
    |--------------------------------------------------------------------------
    |
    | On demande directement à Playwright de trouver son exécutable.
    |
    |--------------------------------------------------------------------------
    */

    try {

        /*
        | playwright-core expose les chemins de navigateur via
        | PLAYWRIGHT_BROWSERS_PATH/cache selon l'installation.
        |
        | On tente d'abord les chemins connus.
        */

        const localAppData =
            process.env.LOCALAPPDATA;

        if (localAppData) {

            const playwrightRoot =
                path.join(
                    localAppData,
                    "ms-playwright"
                );

            if (
                fs.existsSync(
                    playwrightRoot
                )
            ) {

                const chromiumExecutable =
                    findChromiumExecutable(
                        playwrightRoot
                    );

                if (
                    chromiumExecutable
                ) {

                    return chromiumExecutable;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Fallback : cache utilisateur
        |--------------------------------------------------------------------------
        */

        const userProfile =
            os.homedir();

        const possibleRoots = [

            path.join(
                userProfile,
                "AppData",
                "Local",
                "ms-playwright"
            ),

            path.join(
                userProfile,
                ".cache",
                "ms-playwright"
            )
        ];

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

    } catch (error) {

        console.warn(
            "Impossible de rechercher Chromium local :",
            error.message
        );
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Recherche récursive de l'exécutable Chromium
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

                const executable =
                    findChromiumExecutable(
                        fullPath
                    );

                if (
                    executable
                ) {

                    return executable;
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

        /*
        | Certains dossiers peuvent ne pas être accessibles.
        | On ignore simplement et on poursuit la recherche.
        */

        return null;
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Démarrage du navigateur
|--------------------------------------------------------------------------
*/

async function getBrowser() {

    /*
    |--------------------------------------------------------------------------
    | Réutilisation du navigateur
    |--------------------------------------------------------------------------
    */

    if (browser) {

        try {

            /*
            | Vérifie que le navigateur répond encore.
            */

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

    if (IS_LOCAL) {

        console.log(
            "========================================"
        );

        console.log(
            "Environnement : LOCAL WINDOWS"
        );

        console.log(
            "Recherche de Chromium Playwright..."
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
                    "Exécute cette commande :",
                    "npx playwright-core install chromium",
                    "",
                    "Puis relance le serveur."
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

                /*
                | En local, on n'a pas besoin des arguments
                | spécifiques à AWS/Vercel.
                */

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
    | VERCEL / LINUX SERVERLESS
    |--------------------------------------------------------------------------
    */

    console.log(
        "========================================"
    );

    console.log(
        "Environnement : VERCEL / SERVERLESS"
    );

    console.log(
        "Préparation de Chromium serverless..."
    );

    /*
    |--------------------------------------------------------------------------
    | Désactivation du mode graphique
    |--------------------------------------------------------------------------
    |
    | Pour une génération PDF headless, cela réduit les besoins graphiques.
    |
    |--------------------------------------------------------------------------
    */

    try {

        sparticuzChromium.setGraphicsMode =
            false;

    } catch (error) {

        console.warn(
            "Impossible de modifier le mode graphique :",
            error.message
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Récupération du chemin Chromium
    |--------------------------------------------------------------------------
    */

    const executablePath =
        await sparticuzChromium.executablePath();

    console.log(
        `Chromium serverless : ${executablePath}`
    );

    /*
    |--------------------------------------------------------------------------
    | Création d'un profil temporaire unique
    |--------------------------------------------------------------------------
    |
    | Utile pour éviter que plusieurs invocations utilisent le même
    | dossier utilisateur dans /tmp.
    |
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

    console.log(
        `User data dir : ${userDataDir}`
    );

    /*
    |--------------------------------------------------------------------------
    | Démarrage Chromium
    |--------------------------------------------------------------------------
    */

    console.log(
        "Démarrage de Chromium serverless..."
    );

    browser =
        await playwright.launch({

            executablePath,

            args: [
                ...sparticuzChromium.args,

                `--user-data-dir=${userDataDir}`
            ],

            headless: true
        });

    /*
    |--------------------------------------------------------------------------
    | Nettoyage du userDataDir à la fermeture
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

                console.log(
                    "User data Chromium supprimé."
                );

            } catch (error) {

                console.warn(
                    "Impossible de supprimer userDataDir :",
                    error.message
                );
            }
        }
    );

    console.log(
        "Chromium serverless démarré."
    );

    return browser;
}

/*
|--------------------------------------------------------------------------
| Conversion HTML → PDF
|--------------------------------------------------------------------------
*/

async function htmlFileToPdf(
    htmlFilePath
) {

    /*
    |--------------------------------------------------------------------------
    | Vérification du fichier HTML
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
    | Browser context
    |--------------------------------------------------------------------------
    */

    const context =
        await browserInstance.newContext({

            viewport: {
                width: 1280,
                height: 720
            },

            /*
            | Autorise les ressources locales.
            */

            javaScriptEnabled: true
        });

    /*
    |--------------------------------------------------------------------------
    | Nouvelle page
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
        | URL file:// correcte
        |--------------------------------------------------------------------------
        |
        | pathToFileURL() gère correctement :
        |
        | C:\...
        | espaces
        | caractères spéciaux
        | Windows
        | Linux
        |
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
        | Chargement HTML
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
        | Attente des polices
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
        | Attente des images
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
        | Petite stabilisation du DOM
        |--------------------------------------------------------------------------
        */

        await page.waitForTimeout(
            100
        );

        /*
        |--------------------------------------------------------------------------
        | Informations de diagnostic
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
        | Génération PDF
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
        | Vérification du PDF
        |--------------------------------------------------------------------------
        */

        if (
            !pdfBuffer ||
            pdfBuffer.length === 0
        ) {

            throw new Error(
                "Playwright a généré un PDF vide."
            );
        }

        console.log(
            `PDF généré : ${(
                pdfBuffer.length /
                1024 /
                1024
            ).toFixed(2)} MB`
        );

        /*
        |--------------------------------------------------------------------------
        | Retour Buffer
        |--------------------------------------------------------------------------
        */

        return pdfBuffer;

    } finally {

        /*
        |--------------------------------------------------------------------------
        | Fermeture page/context
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
| Fermeture Chromium
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

        console.log(
            "Chromium fermé."
        );
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