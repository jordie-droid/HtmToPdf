// require("dotenv").config();

// console.log("========================================");
// console.log("DÉMARRAGE SERVER.JS");
// console.log("Node :", process.version);
// console.log("========================================");

// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const crypto = require("crypto");

// const {
//     htmlFileToPdf,
//     closeBrowser
// } = require("./pdf.service");


// /*
// |--------------------------------------------------------------------------
// | APPLICATION
// |--------------------------------------------------------------------------
// */

// const app = express();


// /*
// |--------------------------------------------------------------------------
// | CONFIGURATION
// |--------------------------------------------------------------------------
// */

// const PORT =
//     Number(process.env.PORT) || 3000;


// const BASE_URL =
//     process.env.BASE_URL ||
//     `http://localhost:${PORT}`;


// /*
// |--------------------------------------------------------------------------
// | DOSSIER TEMPORAIRE
// |--------------------------------------------------------------------------
// */

// const TEMP_DIR =
//     path.resolve(
//         __dirname,
//         "../tmp"
//     );


// /*
// |--------------------------------------------------------------------------
// | CREATION DU DOSSIER TEMPORAIRE
// |--------------------------------------------------------------------------
// */

// if (!fs.existsSync(TEMP_DIR)) {

//     fs.mkdirSync(
//         TEMP_DIR,
//         {
//             recursive: true
//         }
//     );

// }


// /*
// |--------------------------------------------------------------------------
// | CONFIGURATION EXPRESS
// |--------------------------------------------------------------------------
// */

// app.disable(
//     "x-powered-by"
// );


// /*
// |--------------------------------------------------------------------------
// | HEALTH CHECK
// |--------------------------------------------------------------------------
// |
// | GET /health
// |
// */

// app.get(
//     "/health",
//     (req, res) => {

//         res.status(200).json({

//             success: true,

//             service:
//                 "HTML to PDF API",

//             status:
//                 "online",

//             timestamp:
//                 new Date().toISOString()

//         });

//     }
// );


// /*
// |--------------------------------------------------------------------------
// | API PDF
// |--------------------------------------------------------------------------
// |
// | POST /api/pdf
// |
// | Content-Type:
// |
// | text/html
// |
// | Body:
// |
// | HTML brut
// |
// | Response:
// |
// | application/pdf
// |
// */

// app.post(
//     "/api/pdf",
//     async (req, res) => {

//         /*
//         |--------------------------------------------------------------------------
//         | IDENTIFIANT UNIQUE DE LA REQUÊTE
//         |--------------------------------------------------------------------------
//         */

//         const requestId =
//             crypto.randomUUID();


//         const startTime =
//             Date.now();


//         /*
//         |--------------------------------------------------------------------------
//         | FICHIER HTML TEMPORAIRE
//         |--------------------------------------------------------------------------
//         */

//         const tempFile =
//             path.join(

//                 TEMP_DIR,

//                 `${requestId}.html`

//             );


//         console.log("");
//         console.log(
//             "========================================"
//         );

//         console.log(
//             `Nouvelle demande : ${requestId}`
//         );

//         console.log(
//             "========================================"
//         );


//         try {

//             /*
//             |--------------------------------------------------------------------------
//             | CONTENT-TYPE
//             |--------------------------------------------------------------------------
//             */

//             const contentType =
//                 req.headers["content-type"] ||
//                 "";


//             if (
//                 !contentType.includes(
//                     "text/html"
//                 ) &&
//                 !contentType.includes(
//                     "text/plain"
//                 )
//             ) {

//                 return res.status(415).json({

//                     success: false,

//                     message:
//                         "Le Content-Type doit être text/html.",

//                     requestId

//                 });

//             }


//             /*
//             |--------------------------------------------------------------------------
//             | CREATION STREAM FICHIER
//             |--------------------------------------------------------------------------
//             */

//             const writeStream =
//                 fs.createWriteStream(

//                     tempFile,

//                     {
//                         flags: "w"
//                     }

//                 );


//             /*
//             |--------------------------------------------------------------------------
//             | GESTION DES ERREURS DU STREAM
//             |--------------------------------------------------------------------------
//             */

//             const streamFinished =
//                 new Promise(
//                     (resolve, reject) => {

//                         /*
//                         | Le fichier est complètement écrit
//                         */

//                         writeStream.on(
//                             "finish",
//                             resolve
//                         );


//                         /*
//                         | Erreur écriture disque
//                         */

//                         writeStream.on(
//                             "error",
//                             reject
//                         );


//                         /*
//                         | Erreur requête HTTP
//                         */

//                         req.on(
//                             "error",
//                             reject
//                         );

//                     }
//                 );


//             /*
//             |--------------------------------------------------------------------------
//             | STREAM HTTP → FICHIER
//             |--------------------------------------------------------------------------
//             |
//             | Aucun chargement complet du HTML en mémoire.
//             |
//             */

//             req.pipe(
//                 writeStream
//             );


//             /*
//             |--------------------------------------------------------------------------
//             | ATTENDRE FIN RECEPTION
//             |--------------------------------------------------------------------------
//             */

//             await streamFinished;


//             /*
//             |--------------------------------------------------------------------------
//             | INFORMATIONS SUR LE HTML
//             |--------------------------------------------------------------------------
//             */

//             const htmlStats =
//                 await fs.promises.stat(
//                     tempFile
//                 );


//             const htmlSize =
//                 (
//                     htmlStats.size /
//                     1024 /
//                     1024
//                 ).toFixed(2);


//             console.log(
//                 `HTML reçu : ${htmlSize} MB`
//             );


//             /*
//             |--------------------------------------------------------------------------
//             | CONVERSION HTML → PDF
//             |--------------------------------------------------------------------------
//             */

//             const pdfBuffer =
//                 await htmlFileToPdf(
//                     tempFile
//                 );


//             /*
//             |--------------------------------------------------------------------------
//             | SUPPRESSION DU HTML TEMPORAIRE
//             |--------------------------------------------------------------------------
//             */

//             try {

//                 await fs.promises.unlink(
//                     tempFile
//                 );

//             } catch (deleteError) {

//                 console.warn(
//                     "Impossible de supprimer le HTML temporaire :",
//                     deleteError.message
//                 );

//             }


//             /*
//             |--------------------------------------------------------------------------
//             | INFORMATIONS PDF
//             |--------------------------------------------------------------------------
//             */

//             const pdfSize =
//                 (
//                     pdfBuffer.length /
//                     1024 /
//                     1024
//                 ).toFixed(2);


//             const duration =
//                 Date.now() -
//                 startTime;


//             console.log(
//                 `PDF : ${pdfSize} MB`
//             );

//             console.log(
//                 `Durée : ${duration} ms`
//             );


//             /*
//             |--------------------------------------------------------------------------
//             | REPONSE HTTP
//             |--------------------------------------------------------------------------
//             |
//             | Le PDF est envoyé directement.
//             |
//             | Aucun fichier PDF local.
//             |
//             */

//             res.status(200);


//             res.set({

//                 "Content-Type":
//                     "application/pdf",


//                 "Content-Disposition":
//                     'attachment; filename="document.pdf"',


//                 "Content-Length":
//                     pdfBuffer.length,


//                 "Cache-Control":
//                     "no-store",


//                 "X-Request-Id":
//                     requestId

//             });


//             /*
//             |--------------------------------------------------------------------------
//             | ENVOI DU PDF
//             |--------------------------------------------------------------------------
//             */

//             return res.end(
//                 pdfBuffer
//             );


//         } catch (error) {

//             console.error("");
//             console.error(
//                 `Erreur [${requestId}]`
//             );

//             console.error(
//                 error
//             );


//             /*
//             |--------------------------------------------------------------------------
//             | NETTOYAGE DU FICHIER TEMPORAIRE
//             |--------------------------------------------------------------------------
//             */

//             try {

//                 if (
//                     fs.existsSync(
//                         tempFile
//                     )
//                 ) {

//                     await fs.promises.unlink(
//                         tempFile
//                     );

//                     console.log(
//                         "Fichier temporaire supprimé."
//                     );

//                 }

//             } catch (cleanupError) {

//                 console.error(
//                     "Erreur nettoyage :",
//                     cleanupError.message
//                 );

//             }


//             /*
//             |--------------------------------------------------------------------------
//             | REPONSE ERREUR
//             |--------------------------------------------------------------------------
//             */

//             if (
//                 !res.headersSent
//             ) {

//                 return res.status(500).json({

//                     success: false,

//                     message:
//                         "Erreur lors de la génération du PDF.",

//                     requestId,

//                     error:
//                         error.message

//                 });

//             }


//             /*
//             | Si les headers ont déjà été envoyés,
//             | on termine simplement la réponse.
//             */

//             return res.end();

//         }

//     }
// );


// /*
// |--------------------------------------------------------------------------
// | ROUTE INEXISTANTE
// |--------------------------------------------------------------------------
// */

// app.use(
//     (req, res) => {

//         res.status(404).json({

//             success: false,

//             message:
//                 "Route introuvable."

//         });

//     }
// );


// /*
// |--------------------------------------------------------------------------
// | GESTIONNAIRE GLOBAL D'ERREURS
// |--------------------------------------------------------------------------
// */

// app.use(
//     (
//         error,
//         req,
//         res,
//         next
//     ) => {

//         console.error(
//             "Erreur globale :",
//             error
//         );


//         if (
//             !res.headersSent
//         ) {

//             return res.status(500).json({

//                 success: false,

//                 message:
//                     "Erreur interne du serveur.",

//                 error:
//                     error.message

//             });

//         }


//         next(error);

//     }
// );


// /*
// |--------------------------------------------------------------------------
// | DEMARRAGE SERVEUR
// |--------------------------------------------------------------------------
// */

// const server =
//     app.listen(

//         PORT,

//         () => {

//             console.log("");

//             console.log(
//                 "========================================"
//             );

//             console.log(
//                 "          HTML → PDF API"
//             );

//             console.log(
//                 "========================================"
//             );

//             console.log("");

//             console.log(
//                 `Service : ${BASE_URL}`
//             );

//             console.log(
//                 `Health  : ${BASE_URL}/health`
//             );

//             console.log(
//                 `PDF     : ${BASE_URL}/api/pdf`
//             );

//             console.log("");

//             console.log(
//                 "========================================"
//             );

//             console.log("");

//         }

//     );


// /*
// |--------------------------------------------------------------------------
// | ARRET PROPRE
// |--------------------------------------------------------------------------
// */

// async function shutdown(
//     signal
// ) {

//     console.log("");

//     console.log(
//         `${signal} reçu...`
//     );


//     server.close(
//         async () => {

//             try {

//                 await closeBrowser();


//                 console.log(
//                     "Chromium fermé."
//                 );


//                 console.log(
//                     "Serveur arrêté proprement."
//                 );


//                 process.exit(0);

//             } catch (error) {

//                 console.error(
//                     "Erreur pendant l'arrêt :",
//                     error
//                 );


//                 process.exit(1);

//             }

//         }
//     );

// }


// /*
// |--------------------------------------------------------------------------
// | SIGINT
// |--------------------------------------------------------------------------
// */

// process.on(
//     "SIGINT",
//     () => shutdown("SIGINT")
// );


// /*
// |--------------------------------------------------------------------------
// | SIGTERM
// |--------------------------------------------------------------------------
// */

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

const app = express();

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const PORT = Number(process.env.PORT) || 3000;

const BASE_URL =
    process.env.BASE_URL ||
    `http://localhost:${PORT}`;

/*
|--------------------------------------------------------------------------
| Dossier temporaire
|--------------------------------------------------------------------------
|
| Vercel autorise l'écriture dans /tmp.
| Le reste du système de fichiers est en lecture seule.
|
*/

const TEMP_DIR = "/tmp";

/*
|--------------------------------------------------------------------------
| Vérification du dossier temporaire
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, {
        recursive: true
    });
}

/*
|--------------------------------------------------------------------------
| Express
|--------------------------------------------------------------------------
*/

app.disable("x-powered-by");

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        service: "HTML to PDF API",
        status: "online",
        timestamp: new Date().toISOString()
    });
});

/*
|--------------------------------------------------------------------------
| Informations API
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        service: "HTML to PDF API",
        version: "1.0.0",
        endpoints: {
            health: `${BASE_URL}/health`,
            pdf: `${BASE_URL}/api/pdf`
        }
    });
});

/*
|--------------------------------------------------------------------------
| POST /api/pdf
|--------------------------------------------------------------------------
|
| Reçoit directement le HTML dans le body :
|
| Content-Type: text/html
|
| Le HTML est écrit temporairement dans /tmp.
| Playwright le transforme ensuite en PDF.
| Le PDF est retourné directement sous forme binaire.
|
|--------------------------------------------------------------------------
*/

app.post(
    "/api/pdf",
    async (req, res) => {

        const requestId =
            crypto.randomUUID();

        const startTime =
            Date.now();

        const tempFile =
            path.join(
                TEMP_DIR,
                `${requestId}.html`
            );

        try {

            console.log("");
            console.log("========================================");
            console.log("Nouvelle demande PDF");
            console.log("========================================");
            console.log(`Request ID : ${requestId}`);
            console.log(`Méthode    : ${req.method}`);
            console.log(`URL        : ${req.originalUrl}`);
            console.log(
                `Content-Type : ${req.headers["content-type"] || "non défini"}`
            );

            /*
            |--------------------------------------------------------------------------
            | Vérification du Content-Type
            |--------------------------------------------------------------------------
            */

            const contentType =
                req.headers["content-type"] || "";

            if (
                !contentType.includes("text/html") &&
                !contentType.includes("text/plain")
            ) {

                console.warn(
                    `Content-Type refusé : ${contentType}`
                );

                return res.status(415).json({
                    success: false,
                    message:
                        "Le Content-Type doit être text/html.",
                    requestId
                });
            }

            /*
            |--------------------------------------------------------------------------
            | Création du fichier HTML temporaire
            |--------------------------------------------------------------------------
            */

            console.log(
                `Création du fichier temporaire : ${tempFile}`
            );

            const writeStream =
                fs.createWriteStream(
                    tempFile,
                    {
                        flags: "w"
                    }
                );

            /*
            |--------------------------------------------------------------------------
            | Attente de la fin de l'écriture
            |--------------------------------------------------------------------------
            */

            const streamFinished =
                new Promise(
                    (resolve, reject) => {

                        writeStream.on(
                            "finish",
                            resolve
                        );

                        writeStream.on(
                            "error",
                            reject
                        );

                        req.on(
                            "error",
                            reject
                        );
                    }
                );

            /*
            |--------------------------------------------------------------------------
            | Streaming du HTML vers /tmp
            |--------------------------------------------------------------------------
            |
            | On ne fait PAS :
            |
            | const html = await ...
            |
            | afin d'éviter de charger tout le HTML
            | une deuxième fois en mémoire.
            |
            */

            req.pipe(writeStream);

            await streamFinished;

            /*
            |--------------------------------------------------------------------------
            | Taille du HTML reçu
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
            | Conversion HTML → PDF
            |--------------------------------------------------------------------------
            */

            console.log(
                "Début de la conversion HTML → PDF..."
            );

            const pdfBuffer =
                await htmlFileToPdf(
                    tempFile
                );

            console.log(
                "Conversion HTML → PDF terminée."
            );

            /*
            |--------------------------------------------------------------------------
            | Suppression du HTML temporaire
            |--------------------------------------------------------------------------
            */

            try {

                await fs.promises.unlink(
                    tempFile
                );

                console.log(
                    "Fichier HTML temporaire supprimé."
                );

            } catch (deleteError) {

                console.warn(
                    "Impossible de supprimer le HTML temporaire :",
                    deleteError.message
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Taille du PDF
            |--------------------------------------------------------------------------
            */

            const pdfSize =
                (
                    pdfBuffer.length /
                    1024 /
                    1024
                ).toFixed(2);

            /*
            |--------------------------------------------------------------------------
            | Durée totale
            |--------------------------------------------------------------------------
            */

            const duration =
                Date.now() -
                startTime;

            console.log(
                `PDF généré : ${pdfSize} MB`
            );

            console.log(
                `Durée totale : ${duration} ms`
            );

            /*
            |--------------------------------------------------------------------------
            | Réponse PDF
            |--------------------------------------------------------------------------
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
            | Retour du PDF directement
            |--------------------------------------------------------------------------
            |
            | Aucun fichier PDF n'est créé sur le serveur.
            |
            */

            return res.end(
                pdfBuffer
            );

        } catch (error) {

            /*
            |--------------------------------------------------------------------------
            | Gestion des erreurs
            |--------------------------------------------------------------------------
            */

            console.error("");
            console.error(
                "========================================"
            );

            console.error(
                `Erreur [${requestId}]`
            );

            console.error(
                "========================================"
            );

            console.error(
                error
            );

            /*
            |--------------------------------------------------------------------------
            | Nettoyage du fichier HTML temporaire
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
                        "Fichier temporaire supprimé après erreur."
                    );
                }

            } catch (cleanupError) {

                console.error(
                    "Erreur pendant le nettoyage :",
                    cleanupError.message
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Réponse d'erreur
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

            return res.end();
        }
    }
);

/*
|--------------------------------------------------------------------------
| Route 404
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {

        return res.status(404).json({
            success: false,
            message: "Route introuvable.",
            path: req.originalUrl
        });
    }
);

/*
|--------------------------------------------------------------------------
| Gestionnaire d'erreurs global
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
                message: "Erreur interne du serveur.",
                error:
                    error.message
            });
        }

        next(error);
    }
);

/*
|--------------------------------------------------------------------------
| Démarrage du serveur
|--------------------------------------------------------------------------
|
| Compatible avec le fonctionnement actuel de ton projet.
|
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

            console.log(
                `Node.js : ${process.version}`
            );

            console.log(
                `Port    : ${PORT}`
            );

            console.log(
                `Service : ${BASE_URL}`
            );

            console.log(
                `Health  : ${BASE_URL}/health`
            );

            console.log(
                `PDF     : ${BASE_URL}/api/pdf`
            );

            console.log(
                `Temp    : ${TEMP_DIR}`
            );

            console.log(
                "========================================"
            );

            console.log("");
        }
    );

/*
|--------------------------------------------------------------------------
| Arrêt propre
|--------------------------------------------------------------------------
*/

async function shutdown(
    signal
) {

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
| Gestion SIGINT / SIGTERM
|--------------------------------------------------------------------------
*/

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
|
| Utile notamment pour certains environnements
| et pour les tests.
|
|--------------------------------------------------------------------------
*/

module.exports = app;