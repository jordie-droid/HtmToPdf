"use strict";

/**
 * ============================================================================
 * PDF SERVICE
 * ============================================================================
 *
 * Compatible :
 *   - Windows en local
 *   - Vercel / Serverless Linux
 *
 * Local :
 *   playwright-core + Chromium installé localement
 *
 * Vercel :
 *   playwright-core + @sparticuz/chromium
 *
 * Le PDF est généré EN MÉMOIRE.
 * Aucun fichier PDF n'est créé sur le disque.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const { chromium: playwright } = require("playwright-core");


// ============================================================================
// VARIABLES
// ============================================================================

let browser = null;

let sparticuzChromium = null;

let chromiumLoadingPromise = null;


// ============================================================================
// DÉTECTION ENVIRONNEMENT
// ============================================================================

const IS_VERCEL =
    process.env.VERCEL === "1" ||
    !!process.env.VERCEL_ENV;

const IS_WINDOWS =
    process.platform === "win32";


// ============================================================================
// LOG
// ============================================================================

function log(...args) {
    console.log("[PDF SERVICE]", ...args);
}


// ============================================================================
// CHARGEMENT @SPARTICUZ/CHROMIUM
// ============================================================================

async function getSparticuzChromium() {

    if (sparticuzChromium) {
        return sparticuzChromium;
    }

    if (chromiumLoadingPromise) {
        return chromiumLoadingPromise;
    }

    chromiumLoadingPromise = (async () => {

        try {

            log("Chargement de @sparticuz/chromium...");

            /*
             * @sparticuz/chromium peut être chargé comme module ESM
             * selon la version installée.
             *
             * On utilise donc import() dynamiquement.
             */
            const module = await import("@sparticuz/chromium");

            sparticuzChromium =
                module.default ||
                module;

            log("@sparticuz/chromium chargé.");

            return sparticuzChromium;

        } catch (error) {

            console.error(
                "Impossible de charger @sparticuz/chromium :",
                error
            );

            throw new Error(
                `Impossible de charger @sparticuz/chromium : ${error.message}`
            );
        }

    })();

    return chromiumLoadingPromise;
}


// ============================================================================
// RECHERCHE CHROMIUM LOCAL WINDOWS
// ============================================================================

function findLocalChromiumExecutable() {

    const candidates = [];

    /*
     * ------------------------------------------------------------------------
     * 1. PLAYWRIGHT_BROWSERS_PATH
     * ------------------------------------------------------------------------
     */

    if (process.env.PLAYWRIGHT_BROWSERS_PATH) {

        const browsersPath =
            process.env.PLAYWRIGHT_BROWSERS_PATH;

        candidates.push(
            path.join(
                browsersPath,
                "chromium-*",
                "chrome-win",
                "chrome.exe"
            )
        );

        candidates.push(
            path.join(
                browsersPath,
                "chromium_headless_shell-*",
                "chrome-headless-shell-win64",
                "chrome-headless-shell.exe"
            )
        );
    }


    /*
     * ------------------------------------------------------------------------
     * 2. LOCALAPPDATA
     * ------------------------------------------------------------------------
     */

    if (process.env.LOCALAPPDATA) {

        const msPlaywright =
            path.join(
                process.env.LOCALAPPDATA,
                "ms-playwright"
            );

        candidates.push(
            path.join(
                msPlaywright,
                "chromium-*",
                "chrome-win",
                "chrome.exe"
            )
        );

        candidates.push(
            path.join(
                msPlaywright,
                "chromium_headless_shell-*",
                "chrome-headless-shell-win64",
                "chrome-headless-shell.exe"
            )
        );
    }


    /*
     * ------------------------------------------------------------------------
     * 3. USERPROFILE
     * ------------------------------------------------------------------------
     */

    if (process.env.USERPROFILE) {

        const msPlaywright =
            path.join(
                process.env.USERPROFILE,
                "AppData",
                "Local",
                "ms-playwright"
            );

        candidates.push(
            path.join(
                msPlaywright,
                "chromium-*",
                "chrome-win",
                "chrome.exe"
            )
        );

        candidates.push(
            path.join(
                msPlaywright,
                "chromium_headless_shell-*",
                "chrome-headless-shell-win64",
                "chrome-headless-shell.exe"
            )
        );
    }


    /*
     * ------------------------------------------------------------------------
     * 4. CHEMINS POSSIBLES DANS NODE_MODULES
     * ------------------------------------------------------------------------
     */

    candidates.push(
        path.join(
            process.cwd(),
            "node_modules",
            "playwright-core",
            ".local-browsers",
            "chromium",
            "chrome-win",
            "chrome.exe"
        )
    );


    /*
     * ------------------------------------------------------------------------
     * Recherche récursive contrôlée
     * ------------------------------------------------------------------------
     */

    const roots = [];

    if (process.env.LOCALAPPDATA) {
        roots.push(
            path.join(
                process.env.LOCALAPPDATA,
                "ms-playwright"
            )
        );
    }

    if (process.env.USERPROFILE) {
        roots.push(
            path.join(
                process.env.USERPROFILE,
                "AppData",
                "Local",
                "ms-playwright"
            )
        );
    }


    /*
     * Cherche directement dans les dossiers chromium-*
     */
    for (const root of roots) {

        if (!fs.existsSync(root)) {
            continue;
        }

        let entries;

        try {
            entries = fs.readdirSync(root);
        } catch {
            continue;
        }

        for (const entry of entries) {

            if (
                !entry.startsWith("chromium-") &&
                !entry.startsWith("chromium_headless_shell-")
            ) {
                continue;
            }

            const folder =
                path.join(root, entry);


            /*
             * Chromium classique
             */
            const chromeExe =
                path.join(
                    folder,
                    "chrome-win",
                    "chrome.exe"
                );

            if (fs.existsSync(chromeExe)) {
                return chromeExe;
            }


            /*
             * Chromium headless shell
             */
            const headlessExe =
                path.join(
                    folder,
                    "chrome-headless-shell-win64",
                    "chrome-headless-shell.exe"
                );

            if (fs.existsSync(headlessExe)) {
                return headlessExe;
            }
        }
    }


    /*
     * Vérification des chemins explicites
     */
    for (const candidate of candidates) {

        /*
         * Les chemins avec * ne peuvent pas être testés directement.
         */
        if (candidate.includes("*")) {
            continue;
        }

        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }


    return null;
}


// ============================================================================
// OUVERTURE DU NAVIGATEUR
// ============================================================================

async function getBrowser() {

    /*
     * Si le navigateur existe déjà,
     * on le réutilise.
     */
    if (browser) {

        try {

            if (browser.isConnected()) {
                return browser;
            }

        } catch {
            // On recréera le navigateur.
        }

        browser = null;
    }


    // ========================================================================
    // VERCEL
    // ========================================================================

    if (IS_VERCEL) {

        console.log("========================================");
        console.log("Environnement : VERCEL / SERVERLESS");
        console.log("========================================");


        const chromium =
            await getSparticuzChromium();


        /*
         * Désactivation du mode graphique.
         *
         * @sparticuz/chromium expose setGraphicsMode
         * sur certaines versions.
         */
        try {

            if (
                typeof chromium.setGraphicsMode === "function"
            ) {
                chromium.setGraphicsMode = false;
            }

        } catch (error) {

            console.warn(
                "Impossible de modifier le mode graphique :",
                error.message
            );
        }


        /*
         * Récupération du chemin du Chromium serverless.
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
         * IMPORTANT
         * --------------------------------------------------------------------
         *
         * NE PAS ajouter :
         *
         *   --user-data-dir
         *
         * et NE PAS utiliser :
         *
         *   userDataDir
         *
         * avec browserType.launch().
         *
         * Playwright interdit cette combinaison.
         *
         * C'était précisément l'erreur rencontrée sur Vercel.
         * --------------------------------------------------------------------
         */

        console.log(
            "Démarrage de Chromium serverless..."
        );


        browser =
            await playwright.launch({

                executablePath,

                args: [
                    ...(chromium.args || [])
                ],

                headless: true
            });


        console.log(
            "Chromium serverless démarré."
        );


        return browser;
    }


    // ========================================================================
    // LOCAL WINDOWS
    // ========================================================================

    if (IS_WINDOWS) {

        console.log("========================================");
        console.log("Environnement : WINDOWS LOCAL");
        console.log("========================================");


        /*
         * Recherche du navigateur Playwright.
         */
        const executablePath =
            findLocalChromiumExecutable();


        if (!executablePath) {

            throw new Error(
                "Chromium introuvable sur Windows. " +
                "Exécutez : npx playwright-core install chromium"
            );
        }


        console.log(
            `Chromium local : ${executablePath}`
        );


        browser =
            await playwright.launch({

                executablePath,

                headless: true,

                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
            });


        console.log(
            "Chromium local démarré."
        );


        return browser;
    }


    // ========================================================================
    // AUTRE LINUX / ENVIRONNEMENT
    // ========================================================================

    console.log(
        "Environnement Linux / autre"
    );


    /*
     * Tentative de recherche locale.
     */
    let executablePath =
        findLocalChromiumExecutable();


    /*
     * Si aucun Chromium local n'est trouvé,
     * on tente @sparticuz/chromium.
     */
    if (!executablePath) {

        try {

            const chromium =
                await getSparticuzChromium();

            executablePath =
                await chromium.executablePath();

            console.log(
                `Chromium trouvé via @sparticuz/chromium : ${executablePath}`
            );

            browser =
                await playwright.launch({

                    executablePath,

                    args: [
                        ...(chromium.args || [])
                    ],

                    headless: true
                });

            return browser;

        } catch (error) {

            console.warn(
                "Impossible d'utiliser @sparticuz/chromium :",
                error.message
            );
        }
    }


    /*
     * Dernière tentative.
     */
    if (!executablePath) {

        throw new Error(
            "Impossible de trouver Chromium dans cet environnement."
        );
    }


    browser =
        await playwright.launch({

            executablePath,

            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        });


    return browser;
}


// ============================================================================
// ATTENTE DES IMAGES
// ============================================================================

async function waitForImages(page) {

    await page.evaluate(async () => {

        const images =
            Array.from(
                document.images
            );

        await Promise.all(

            images.map((img) => {

                /*
                 * Image déjà chargée.
                 */
                if (img.complete) {

                    /*
                     * Même si naturalWidth = 0,
                     * on ne bloque pas indéfiniment.
                     */
                    return Promise.resolve();
                }


                return new Promise((resolve) => {

                    let finished = false;


                    const done = () => {

                        if (finished) {
                            return;
                        }

                        finished = true;

                        resolve();
                    };


                    img.addEventListener(
                        "load",
                        done,
                        {
                            once: true
                        }
                    );

                    img.addEventListener(
                        "error",
                        done,
                        {
                            once: true
                        }
                    );


                    /*
                     * Sécurité :
                     * une image qui ne répond jamais ne doit pas
                     * bloquer toute la génération.
                     */
                    setTimeout(
                        done,
                        15000
                    );
                });
            })
        );
    });
}


// ============================================================================
// ATTENTE DES POLICES
// ============================================================================

async function waitForFonts(page) {

    try {

        await page.evaluate(async () => {

            if (
                document.fonts &&
                document.fonts.ready
            ) {

                await document.fonts.ready;
            }
        });

    } catch (error) {

        console.warn(
            "Impossible d'attendre les polices :",
            error.message
        );
    }
}


// ============================================================================
// CONVERSION HTML → PDF
// ============================================================================

async function htmlFileToPdf(htmlFilePath) {

    if (!htmlFilePath) {

        throw new Error(
            "Le chemin du fichier HTML est obligatoire."
        );
    }


    if (!fs.existsSync(htmlFilePath)) {

        throw new Error(
            `Fichier HTML introuvable : ${htmlFilePath}`
        );
    }


    console.log(
        "========================================"
    );

    console.log(
        "Début de la conversion HTML → PDF..."
    );

    console.log(
        `Fichier HTML : ${htmlFilePath}`
    );


    let page = null;


    try {

        // ====================================================================
        // NAVIGATEUR
        // ====================================================================

        const currentBrowser =
            await getBrowser();


        // ====================================================================
        // NOUVELLE PAGE
        // ====================================================================

        page =
            await currentBrowser.newPage();


        // ====================================================================
        // CONFIGURATION
        // ====================================================================

        /*
         * Viewport suffisamment large pour les documents HTML.
         */
        await page.setViewportSize({

            width: 1600,

            height: 1200
        });


        /*
         * Désactive certaines animations afin d'obtenir
         * un PDF stable.
         */
        await page.addStyleTag({

            content: `
                *,
                *::before,
                *::after {
                    animation-delay: 0s !important;
                    animation-duration: 0s !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                }
            `
        });


        // ====================================================================
        // CHARGEMENT DU FICHIER HTML
        // ====================================================================

        const fileUrl =
            pathToFileURL(
                htmlFilePath
            ).href;


        console.log(
            `Chargement : ${fileUrl}`
        );


        await page.goto(

            fileUrl,

            {
                waitUntil: "load",

                timeout: 120000
            }
        );


        // ====================================================================
        // ATTENTE DES IMAGES
        // ====================================================================

        console.log(
            "Attente des images..."
        );

        await waitForImages(page);


        // ====================================================================
        // ATTENTE DES POLICES
        // ====================================================================

        console.log(
            "Attente des polices..."
        );

        await waitForFonts(page);


        // ====================================================================
        // PETIT DÉLAI DE STABILISATION
        // ====================================================================

        await page.waitForTimeout(300);


        // ====================================================================
        // PDF
        // ====================================================================

        console.log(
            "Génération du PDF..."
        );


        /*
         * IMPORTANT :
         *
         * Aucun `path` ici.
         *
         * page.pdf() retourne directement un Buffer.
         *
         * Donc :
         *
         * HTML → Chromium → Buffer PDF → HTTP response
         *
         * Aucun PDF temporaire n'est créé.
         */
        const pdfBuffer =
            await page.pdf({

                format: "A4",

                printBackground: true,

                preferCSSPageSize: true,

                displayHeaderFooter: false,

                margin: {
                    top: "0mm",
                    right: "0mm",
                    bottom: "0mm",
                    left: "0mm"
                }
            });


        console.log(
            `PDF généré : ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`
        );


        return pdfBuffer;

    } catch (error) {

        console.error(
            "Erreur conversion HTML → PDF :"
        );

        console.error(error);


        throw error;

    } finally {

        /*
         * Fermeture de la page.
         *
         * Le navigateur reste ouvert pour pouvoir être
         * réutilisé lors des requêtes suivantes.
         */
        if (page) {

            try {

                await page.close();

            } catch (error) {

                console.warn(
                    "Impossible de fermer la page :",
                    error.message
                );
            }
        }
    }
}


// ============================================================================
// FERMETURE DU NAVIGATEUR
// ============================================================================

async function closeBrowser() {

    if (!browser) {
        return;
    }


    try {

        console.log(
            "Fermeture de Chromium..."
        );


        await browser.close();


    } catch (error) {

        console.warn(
            "Erreur fermeture Chromium :",
            error.message
        );


    } finally {

        browser = null;
    }
}


// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {

    htmlFileToPdf,

    closeBrowser
};