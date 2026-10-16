// const express = require("express");
// const path = require("path");
// const fs = require("fs");

// const {
//     htmlToPdf
// } = require("./pdf.service");

// const app = express();

// const PORT = 3000;

// const OUTPUT_DIR = path.join(__dirname, "../output");

// fs.mkdirSync(OUTPUT_DIR, {
//     recursive: true
// });

// // Autoriser les gros HTML
// app.use(express.text({
//     type: "text/html",
//     limit: "500gb"
// }));

// app.post("/convert", async (req, res) => {

//     try {

//         const html = req.body;

//         if (!html || html.trim() === "") {

//             return res.status(400).json({
//                 success: false,
//                 message: "Le HTML est vide."
//             });

//         }

//         const sizeMB = (
//             Buffer.byteLength(html) /
//             1024 /
//             1024
//         ).toFixed(2);

//         console.log(
//             `HTML reçu : ${sizeMB} MB`
//         );

//         const fileName =
//             `document-${Date.now()}.pdf`;

//         const pdfPath = path.join(
//             OUTPUT_DIR,
//             fileName
//         );

//         // Conversion HTML → PDF
//         await htmlToPdf(
//             html,
//             pdfPath
//         );

//         console.log(
//             `PDF généré : ${pdfPath}`
//         );

//         // Pour Thunder Client gratuit,
//         // on ne renvoie PAS le PDF binaire.
//         res.json({

//             success: true,

//             message: "PDF généré avec succès.",

//             fileName: fileName,

//             filePath: pdfPath,

//             sizeHTML: `${sizeMB} MB`

//         });

//     } catch (error) {

//         console.error(error);

//         res.status(500).json({

//             success: false,

//             message: "Erreur lors de la conversion.",

//             error: error.message

//         });

//     }

// });

// app.listen(PORT, () => {

//     console.log(
//         `Serveur disponible sur http://localhost:${PORT}`
//     );

// });





// const express = require("express");
// const { htmlToPdf, closeBrowser } = require("./pdf.service");

// const app = express();

// const PORT = process.env.PORT || 3000;

// // Taille maximale du HTML reçu.
// // Attention : ce n'est PAS une allocation de 500 Go.
// app.use(express.text({
//     type: ["text/html", "text/plain"],
//     limit: "500mb"
// }));

// /**
//  * Health check
//  */
// app.get("/health", (req, res) => {
//     res.json({
//         success: true,
//         service: "HTML to PDF",
//         status: "online"
//     });
// });

// /**
//  * POST /api/pdf
//  *
//  * Body :
//  * HTML brut
//  *
//  * Response :
//  * application/pdf
//  */
// app.post("/api/pdf", async (req, res) => {
//     const start = Date.now();

//     try {
//         const html = req.body;

//         if (!html || typeof html !== "string") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Le HTML est obligatoire."
//             });
//         }

//         console.log(
//             `Conversion HTML → PDF (${(
//                 Buffer.byteLength(html, "utf8") /
//                 1024 /
//                 1024
//             ).toFixed(2)} MB)`
//         );

//         const pdfBuffer = await htmlToPdf(html);

//         const duration = Date.now() - start;

//         console.log(
//             `PDF généré : ${(
//                 pdfBuffer.length /
//                 1024 /
//                 1024
//             ).toFixed(2)} MB en ${duration} ms`
//         );

//         // Réponse PDF
//         res.status(200);

//         res.set({
//             "Content-Type": "application/pdf",
//             "Content-Disposition": 'attachment; filename="document.pdf"',
//             "Content-Length": pdfBuffer.length,
//             "Cache-Control": "no-store"
//         });

//         return res.send(pdfBuffer);

//     } catch (error) {

//         console.error("Erreur génération PDF :", error);

//         return res.status(500).json({
//             success: false,
//             message: "Erreur lors de la génération du PDF.",
//             error: error.message
//         });
//     }
// });

// /**
//  * Arrêt propre
//  */
// async function shutdown(signal) {
//     console.log(`${signal} reçu. Arrêt du serveur...`);

//     await closeBrowser();

//     process.exit(0);
// }

// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("SIGTERM", () => shutdown("SIGTERM"));

// app.listen(PORT, () => {
//     console.log(`
// ========================================
//  HTML → PDF API
// ========================================

// Serveur : http://localhost:${PORT}

// Health :
// GET  /health

// PDF :
// POST /api/pdf

// ========================================
// `);
// });







// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const crypto = require("crypto");

// const {
//     htmlFileToPdf,
//     closeBrowser
// } = require("./pdf.service");


// const app = express();

// const PORT = process.env.PORT || 3000;


// /**
//  * Dossier temporaire.
//  */
// const TEMP_DIR = path.resolve(__dirname, "../tmp");


// /**
//  * Création du dossier tmp s'il n'existe pas.
//  */
// if (!fs.existsSync(TEMP_DIR)) {

//     fs.mkdirSync(TEMP_DIR, {
//         recursive: true
//     });

// }


// /**
//  * Middleware de sécurité / timeout.
//  */
// app.disable("x-powered-by");


// /**
//  * Health Check
//  *
//  * GET /health
//  */
// app.get("/health", (req, res) => {

//     res.status(200).json({

//         success: true,

//         service: "HTML to PDF API",

//         status: "online",

//         timestamp: new Date().toISOString()

//     });

// });


// /**
//  * POST /api/pdf
//  *
//  * Content-Type:
//  * text/html
//  *
//  * Body:
//  * HTML brut
//  *
//  * Response:
//  * application/pdf
//  */
// app.post("/api/pdf", async (req, res) => {

//     const requestId = crypto.randomUUID();

//     const startTime = Date.now();

//     const tempFile = path.join(
//         TEMP_DIR,
//         `${requestId}.html`
//     );


//     console.log("");
//     console.log("========================================");
//     console.log(`Nouvelle demande : ${requestId}`);
//     console.log("========================================");


//     try {

//         /**
//          * Vérification Content-Type.
//          */
//         const contentType = req.headers["content-type"] || "";


//         if (
//             !contentType.includes("text/html") &&
//             !contentType.includes("text/plain")
//         ) {

//             return res.status(415).json({

//                 success: false,

//                 message:
//                     "Content-Type attendu : text/html",

//                 requestId

//             });

//         }


//         /**
//          * Création du fichier temporaire.
//          *
//          * IMPORTANT :
//          *
//          * On ne fait PAS :
//          *
//          * const html = req.body
//          *
//          * car cela chargerait tout le HTML
//          * dans la RAM.
//          */
//         const writeStream = fs.createWriteStream(
//             tempFile,
//             {
//                 flags: "w"
//             }
//         );


//         /**
//          * Gestion des erreurs du flux.
//          */
//         const streamError = new Promise(
//             (resolve, reject) => {

//                 writeStream.on(
//                     "error",
//                     reject
//                 );

//                 req.on(
//                     "error",
//                     reject
//                 );

//             }
//         );


//         /**
//          * Envoyer les données HTTP directement
//          * vers le fichier temporaire.
//          */
//         req.pipe(writeStream);


//         /**
//          * Attendre que le fichier soit complètement écrit.
//          */
//         await Promise.race([

//             new Promise((resolve, reject) => {

//                 writeStream.on(
//                     "finish",
//                     resolve
//                 );

//                 writeStream.on(
//                     "error",
//                     reject
//                 );

//             }),

//             streamError

//         ]);


//         /**
//          * Taille du HTML.
//          */
//         const htmlStats = await fs.promises.stat(
//             tempFile
//         );


//         const htmlSizeMB = (
//             htmlStats.size /
//             1024 /
//             1024
//         ).toFixed(2);


//         console.log(
//             `HTML reçu : ${htmlSizeMB} MB`
//         );


//         /**
//          * Conversion HTML → PDF.
//          */
//         const pdfBuffer = await htmlFileToPdf(
//             tempFile
//         );


//         const pdfSizeMB = (
//             pdfBuffer.length /
//             1024 /
//             1024
//         ).toFixed(2);


//         const duration =
//             Date.now() - startTime;


//         console.log(
//             `PDF : ${pdfSizeMB} MB`
//         );

//         console.log(
//             `Durée : ${duration} ms`
//         );


//         /**
//          * Supprimer le HTML temporaire.
//          *
//          * Le PDF n'est jamais écrit sur disque.
//          */
//         await fs.promises.unlink(
//             tempFile
//         );


//         /**
//          * Réponse HTTP.
//          *
//          * Power Automate recevra directement
//          * le fichier PDF.
//          */
//         res.status(200);


//         res.set({

//             "Content-Type":
//                 "application/pdf",

//             "Content-Disposition":
//                 'attachment; filename="document.pdf"',

//             "Content-Length":
//                 pdfBuffer.length,

//             "Cache-Control":
//                 "no-store",

//             "X-Request-Id":
//                 requestId

//         });


//         return res.end(pdfBuffer);


//     } catch (error) {

//         console.error(
//             `Erreur [${requestId}] :`,
//             error
//         );


//         /**
//          * Nettoyage du fichier temporaire
//          * même en cas d'erreur.
//          */
//         try {

//             if (
//                 fs.existsSync(tempFile)
//             ) {

//                 await fs.promises.unlink(
//                     tempFile
//                 );

//             }

//         } catch (cleanupError) {

//             console.error(
//                 "Erreur nettoyage :",
//                 cleanupError
//             );

//         }


//         /**
//          * Si la réponse n'a pas encore
//          * été envoyée.
//          */
//         if (!res.headersSent) {

//             return res.status(500).json({

//                 success: false,

//                 message:
//                     "Erreur lors de la génération du PDF.",

//                 requestId,

//                 error: error.message

//             });

//         }


//         res.end();

//     }

// });


// /**
//  * Gestion des routes inexistantes.
//  */
// app.use((req, res) => {

//     res.status(404).json({

//         success: false,

//         message: "Route introuvable."

//     });

// });


// /**
//  * Gestion globale des erreurs Express.
//  */
// app.use((error, req, res, next) => {

//     console.error(
//         "Erreur globale :",
//         error
//     );


//     if (!res.headersSent) {

//         res.status(500).json({

//             success: false,

//             message:
//                 "Erreur interne du serveur.",

//             error: error.message

//         });

//     }

// });


// /**
//  * Démarrage du serveur.
//  */
// const server = app.listen(
//     PORT,
//     () => {

//         console.log("");
//         console.log("========================================");
//         console.log("       HTML → PDF API");
//         console.log("========================================");
//         console.log("");
//         console.log(
//             `Serveur : http://localhost:${PORT}`
//         );
//         console.log("");
//         console.log(
//             "Health : GET /health"
//         );
//         console.log(
//             "PDF    : POST /api/pdf"
//         );
//         console.log("");
//         console.log("========================================");
//         console.log("");

//     }
// );


// /**
//  * Arrêt propre.
//  */
// async function shutdown(signal) {

//     console.log("");
//     console.log(
//         `${signal} reçu...`
//     );


//     server.close(async () => {

//         try {

//             await closeBrowser();

//             console.log(
//                 "Serveur arrêté proprement."
//             );

//             process.exit(0);

//         } catch (error) {

//             console.error(
//                 "Erreur arrêt :",
//                 error
//             );

//             process.exit(1);

//         }

//     });

// }


// process.on(
//     "SIGINT",
//     () => shutdown("SIGINT")
// );

// process.on(
//     "SIGTERM",
//     () => shutdown("SIGTERM")
// );








require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
    htmlFileToPdf,
    closeBrowser
} = require("./pdf.service");


/*
|--------------------------------------------------------------------------
| APPLICATION
|--------------------------------------------------------------------------
*/

const app = express();


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const PORT =
    Number(process.env.PORT) || 3000;


const BASE_URL =
    process.env.BASE_URL ||
    `http://localhost:${PORT}`;


/*
|--------------------------------------------------------------------------
| DOSSIER TEMPORAIRE
|--------------------------------------------------------------------------
*/

const TEMP_DIR =
    path.resolve(
        __dirname,
        "../tmp"
    );


/*
|--------------------------------------------------------------------------
| CREATION DU DOSSIER TEMPORAIRE
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(TEMP_DIR)) {

    fs.mkdirSync(
        TEMP_DIR,
        {
            recursive: true
        }
    );

}


/*
|--------------------------------------------------------------------------
| CONFIGURATION EXPRESS
|--------------------------------------------------------------------------
*/

app.disable(
    "x-powered-by"
);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
|
| GET /health
|
*/

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({

            success: true,

            service:
                "HTML to PDF API",

            status:
                "online",

            timestamp:
                new Date().toISOString()

        });

    }
);


/*
|--------------------------------------------------------------------------
| API PDF
|--------------------------------------------------------------------------
|
| POST /api/pdf
|
| Content-Type:
|
| text/html
|
| Body:
|
| HTML brut
|
| Response:
|
| application/pdf
|
*/

app.post(
    "/api/pdf",
    async (req, res) => {

        /*
        |--------------------------------------------------------------------------
        | IDENTIFIANT UNIQUE DE LA REQUÊTE
        |--------------------------------------------------------------------------
        */

        const requestId =
            crypto.randomUUID();


        const startTime =
            Date.now();


        /*
        |--------------------------------------------------------------------------
        | FICHIER HTML TEMPORAIRE
        |--------------------------------------------------------------------------
        */

        const tempFile =
            path.join(

                TEMP_DIR,

                `${requestId}.html`

            );


        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            `Nouvelle demande : ${requestId}`
        );

        console.log(
            "========================================"
        );


        try {

            /*
            |--------------------------------------------------------------------------
            | CONTENT-TYPE
            |--------------------------------------------------------------------------
            */

            const contentType =
                req.headers["content-type"] ||
                "";


            if (
                !contentType.includes(
                    "text/html"
                ) &&
                !contentType.includes(
                    "text/plain"
                )
            ) {

                return res.status(415).json({

                    success: false,

                    message:
                        "Le Content-Type doit être text/html.",

                    requestId

                });

            }


            /*
            |--------------------------------------------------------------------------
            | CREATION STREAM FICHIER
            |--------------------------------------------------------------------------
            */

            const writeStream =
                fs.createWriteStream(

                    tempFile,

                    {
                        flags: "w"
                    }

                );


            /*
            |--------------------------------------------------------------------------
            | GESTION DES ERREURS DU STREAM
            |--------------------------------------------------------------------------
            */

            const streamFinished =
                new Promise(
                    (resolve, reject) => {

                        /*
                        | Le fichier est complètement écrit
                        */

                        writeStream.on(
                            "finish",
                            resolve
                        );


                        /*
                        | Erreur écriture disque
                        */

                        writeStream.on(
                            "error",
                            reject
                        );


                        /*
                        | Erreur requête HTTP
                        */

                        req.on(
                            "error",
                            reject
                        );

                    }
                );


            /*
            |--------------------------------------------------------------------------
            | STREAM HTTP → FICHIER
            |--------------------------------------------------------------------------
            |
            | Aucun chargement complet du HTML en mémoire.
            |
            */

            req.pipe(
                writeStream
            );


            /*
            |--------------------------------------------------------------------------
            | ATTENDRE FIN RECEPTION
            |--------------------------------------------------------------------------
            */

            await streamFinished;


            /*
            |--------------------------------------------------------------------------
            | INFORMATIONS SUR LE HTML
            |--------------------------------------------------------------------------
            */

            const htmlStats =
                await fs.promises.stat(
                    tempFile
                );


            const htmlSize =
                (
                    htmlStats.size /
                    1024 /
                    1024
                ).toFixed(2);


            console.log(
                `HTML reçu : ${htmlSize} MB`
            );


            /*
            |--------------------------------------------------------------------------
            | CONVERSION HTML → PDF
            |--------------------------------------------------------------------------
            */

            const pdfBuffer =
                await htmlFileToPdf(
                    tempFile
                );


            /*
            |--------------------------------------------------------------------------
            | SUPPRESSION DU HTML TEMPORAIRE
            |--------------------------------------------------------------------------
            */

            try {

                await fs.promises.unlink(
                    tempFile
                );

            } catch (deleteError) {

                console.warn(
                    "Impossible de supprimer le HTML temporaire :",
                    deleteError.message
                );

            }


            /*
            |--------------------------------------------------------------------------
            | INFORMATIONS PDF
            |--------------------------------------------------------------------------
            */

            const pdfSize =
                (
                    pdfBuffer.length /
                    1024 /
                    1024
                ).toFixed(2);


            const duration =
                Date.now() -
                startTime;


            console.log(
                `PDF : ${pdfSize} MB`
            );

            console.log(
                `Durée : ${duration} ms`
            );


            /*
            |--------------------------------------------------------------------------
            | REPONSE HTTP
            |--------------------------------------------------------------------------
            |
            | Le PDF est envoyé directement.
            |
            | Aucun fichier PDF local.
            |
            */

            res.status(200);


            res.set({

                "Content-Type":
                    "application/pdf",


                "Content-Disposition":
                    'attachment; filename="document.pdf"',


                "Content-Length":
                    pdfBuffer.length,


                "Cache-Control":
                    "no-store",


                "X-Request-Id":
                    requestId

            });


            /*
            |--------------------------------------------------------------------------
            | ENVOI DU PDF
            |--------------------------------------------------------------------------
            */

            return res.end(
                pdfBuffer
            );


        } catch (error) {

            console.error("");
            console.error(
                `Erreur [${requestId}]`
            );

            console.error(
                error
            );


            /*
            |--------------------------------------------------------------------------
            | NETTOYAGE DU FICHIER TEMPORAIRE
            |--------------------------------------------------------------------------
            */

            try {

                if (
                    fs.existsSync(
                        tempFile
                    )
                ) {

                    await fs.promises.unlink(
                        tempFile
                    );

                    console.log(
                        "Fichier temporaire supprimé."
                    );

                }

            } catch (cleanupError) {

                console.error(
                    "Erreur nettoyage :",
                    cleanupError.message
                );

            }


            /*
            |--------------------------------------------------------------------------
            | REPONSE ERREUR
            |--------------------------------------------------------------------------
            */

            if (
                !res.headersSent
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Erreur lors de la génération du PDF.",

                    requestId,

                    error:
                        error.message

                });

            }


            /*
            | Si les headers ont déjà été envoyés,
            | on termine simplement la réponse.
            */

            return res.end();

        }

    }
);


/*
|--------------------------------------------------------------------------
| ROUTE INEXISTANTE
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Route introuvable."

        });

    }
);


/*
|--------------------------------------------------------------------------
| GESTIONNAIRE GLOBAL D'ERREURS
|--------------------------------------------------------------------------
*/

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Erreur globale :",
            error
        );


        if (
            !res.headersSent
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Erreur interne du serveur.",

                error:
                    error.message

            });

        }


        next(error);

    }
);


/*
|--------------------------------------------------------------------------
| DEMARRAGE SERVEUR
|--------------------------------------------------------------------------
*/

const server =
    app.listen(

        PORT,

        () => {

            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "          HTML → PDF API"
            );

            console.log(
                "========================================"
            );

            console.log("");

            console.log(
                `Service : ${BASE_URL}`
            );

            console.log(
                `Health  : ${BASE_URL}/health`
            );

            console.log(
                `PDF     : ${BASE_URL}/api/pdf`
            );

            console.log("");

            console.log(
                "========================================"
            );

            console.log("");

        }

    );


/*
|--------------------------------------------------------------------------
| ARRET PROPRE
|--------------------------------------------------------------------------
*/

async function shutdown(
    signal
) {

    console.log("");

    console.log(
        `${signal} reçu...`
    );


    server.close(
        async () => {

            try {

                await closeBrowser();


                console.log(
                    "Chromium fermé."
                );


                console.log(
                    "Serveur arrêté proprement."
                );


                process.exit(0);

            } catch (error) {

                console.error(
                    "Erreur pendant l'arrêt :",
                    error
                );


                process.exit(1);

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| SIGINT
|--------------------------------------------------------------------------
*/

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);


/*
|--------------------------------------------------------------------------
| SIGTERM
|--------------------------------------------------------------------------
*/

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);