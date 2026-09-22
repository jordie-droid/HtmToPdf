const { chromium } = require("playwright");

let browser = null;


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const PAGE_TIMEOUT =
    Number(process.env.PAGE_TIMEOUT) || 120000;


/*
|--------------------------------------------------------------------------
| GET BROWSER
|--------------------------------------------------------------------------
|
| On garde une instance Chromium ouverte.
| Cela évite de lancer Chromium à chaque demande.
|
*/

async function getBrowser() {

    if (!browser) {

        console.log("Démarrage de Chromium...");


        browser = await chromium.launch({

            headless: true

        });


        console.log("Chromium démarré.");

    }


    return browser;
}


/*
|--------------------------------------------------------------------------
| HTML FILE → PDF BUFFER
|--------------------------------------------------------------------------
|
| Le HTML est déjà présent dans un fichier temporaire.
|
| Le PDF, lui, n'est PAS écrit sur disque.
|
| page.pdf() retourne directement un Buffer.
|
*/

async function htmlFileToPdf(htmlFilePath) {

    const browserInstance =
        await getBrowser();


    /*
    |--------------------------------------------------------------------------
    | Nouveau contexte
    |--------------------------------------------------------------------------
    */

    const context =
        await browserInstance.newContext({

            viewport: {
                width: 1280,
                height: 720
            }

        });


    const page =
        await context.newPage();


    try {

        /*
        |--------------------------------------------------------------------------
        | TIMEOUTS
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
        | FILE URL
        |--------------------------------------------------------------------------
        |
        | Exemple :
        |
        | C:\Projet\tmp\abc.html
        |
        | devient :
        |
        | file:///C:/Projet/tmp/abc.html
        |
        */

        const normalizedPath =
            htmlFilePath
                .replace(/\\/g, "/");


        const fileUrl =
            `file://${normalizedPath}`;


        console.log(
            `Chargement : ${fileUrl}`
        );


        /*
        |--------------------------------------------------------------------------
        | CHARGEMENT HTML
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
        | ATTENTE DES POLICES
        |--------------------------------------------------------------------------
        */

        await page.evaluate(
            async () => {

                if (document.fonts) {

                    await document.fonts.ready;

                }

            }
        );


        /*
        |--------------------------------------------------------------------------
        | ATTENTE DES IMAGES
        |--------------------------------------------------------------------------
        |
        | Important pour :
        |
        | - logos
        | - filigranes
        | - photos
        | - images Base64
        | - images distantes
        |
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

                            /*
                            | Image déjà chargée
                            */

                            if (
                                img.complete
                            ) {

                                return Promise.resolve();

                            }


                            /*
                            | Image pas encore chargée
                            */

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
        | PETIT DÉLAI DE STABILISATION
        |--------------------------------------------------------------------------
        */

        await page.waitForTimeout(100);


        console.log(
            "Génération du PDF..."
        );


        /*
        |--------------------------------------------------------------------------
        | GENERATION DU PDF
        |--------------------------------------------------------------------------
        |
        | PAS DE "path".
        |
        | Donc Playwright retourne le PDF
        | directement en Buffer.
        |
        */

        const pdfBuffer =
            await page.pdf({

                format:
                    process.env.PDF_FORMAT ||
                    "A4",


                /*
                | Imprimer les backgrounds CSS
                */

                printBackground:
                    true,


                /*
                | Respecter @page CSS
                */

                preferCSSPageSize:
                    true,


                /*
                | Pas de marges
                */

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


                /*
                | Pas de header/footer Playwright
                */

                displayHeaderFooter:
                    false

            });


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
        | FERMETURE PAGE
        |--------------------------------------------------------------------------
        */

        await page.close();


        /*
        |--------------------------------------------------------------------------
        | FERMETURE CONTEXTE
        |--------------------------------------------------------------------------
        */

        await context.close();

    }

}


/*
|--------------------------------------------------------------------------
| CLOSE BROWSER
|--------------------------------------------------------------------------
*/

async function closeBrowser() {

    if (browser) {

        console.log(
            "Fermeture de Chromium..."
        );


        await browser.close();


        browser = null;

    }

}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {

    htmlFileToPdf,

    closeBrowser

};