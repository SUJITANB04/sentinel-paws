
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use(express.json());

app.use(
    express.static(path.join(__dirname, "public"))
);


/* =========================================================
   CONFIGURATION
========================================================= */

const CLUSTER_RADIUS = 300;

const MIN_REPORTS = 3;

const MIN_CONFIRMED = 2;


const VALID_SYMPTOMS = [
    "none",
    "vomiting",
    "diarrhea",
    "lethargy",
    "rash",
    "seizure",
    "difficulty breathing",
    "drooling",
    "loss of appetite",
    "red eyes",
    "skin irritation",
];


const SEVERE_SYMPTOMS = [
    "vomiting",
    "diarrhea",
    "lethargy",
    "seizure",
    "difficulty breathing",
];


/* =========================================================
   DATABASE
========================================================= */

let nextId = 7;


let reports = [

    {
        id: 1,

        lat: 40.7829,

        lng: -73.9654,

        locationName:
            "Central Park Lake",

        dogName:
            "Bruno",

        contact:
            "swam",

        symptoms:
            ["none"],

        ateUnusualFood:
            false,

        recentDietChange:
            false,

        timestamp:
            Date.now() -
            12 * 60 * 60 * 1000,
    },


    {
        id: 2,

        lat: 40.7833,

        lng: -73.9650,

        locationName:
            "Central Park Lake",

        dogName:
            "Luna",

        contact:
            "waded",

        symptoms:
            ["none"],

        ateUnusualFood:
            false,

        recentDietChange:
            false,

        timestamp:
            Date.now() -
            8 * 60 * 60 * 1000,
    },


    {
        id: 3,

        lat: 40.7484,

        lng: -74.0084,

        locationName:
            "Hudson River Pier",

        dogName:
            "Rex",

        contact:
            "waded",

        symptoms:
            [
                "vomiting",
                "diarrhea",
            ],

        ateUnusualFood:
            false,

        recentDietChange:
            false,

        timestamp:
            Date.now() -
            7 * 60 * 60 * 1000,
    },


    {
        id: 4,

        lat: 40.7481,

        lng: -74.0081,

        locationName:
            "Hudson River Pier",

        dogName:
            "Coco",

        contact:
            "drank",

        symptoms:
            ["lethargy"],

        ateUnusualFood:
            false,

        recentDietChange:
            false,

        timestamp:
            Date.now() -
            5 * 60 * 60 * 1000,
    },


    {
        id: 5,

        lat: 40.7487,

        lng: -74.0088,

        locationName:
            "Hudson River Pier",

        dogName:
            "Milo",

        contact:
            "swam",

        symptoms:
            ["rash"],

        ateUnusualFood:
            false,

        recentDietChange:
            false,

        timestamp:
            Date.now() -
            4 * 60 * 60 * 1000,
    },


    {
        id: 6,

        lat: 40.7490,

        lng: -74.0085,

        locationName:
            "Hudson River Pier",

        dogName:
            "Daisy",

        contact:
            "waded",

        symptoms:
            ["diarrhea"],

        ateUnusualFood:
            true,

        recentDietChange:
            false,

        timestamp:
            Date.now() -
            3 * 60 * 60 * 1000,
    },

];


/* =========================================================
   HELPERS
========================================================= */

function normalizeLocation(value) {

    if (!value) {

        return "Unknown Waterway";

    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ");

}


function normalizeSymptoms(symptoms) {

    if (
        !Array.isArray(symptoms) ||
        symptoms.length === 0
    ) {

        return ["none"];

    }


    const cleaned =
        symptoms
            .map(
                (item) =>
                    String(item)
                        .trim()
                        .toLowerCase()
            )
            .filter(Boolean);


    if (
        cleaned.length === 0 ||
        cleaned.includes("none")
    ) {

        return ["none"];

    }


    return [
        ...new Set(cleaned)
    ];

}


function hasSymptoms(report) {

    const symptoms =
        normalizeSymptoms(
            report.symptoms
        );


    return !(
        symptoms.length === 1 &&
        symptoms[0] === "none"
    );

}


function hasSevereSymptoms(report) {

    const symptoms =
        normalizeSymptoms(
            report.symptoms
        );


    return symptoms.some(
        (symptom) =>
            SEVERE_SYMPTOMS.includes(
                symptom
            )
    );

}


function isConfounded(report) {

    return (
        report.ateUnusualFood === true ||
        report.recentDietChange === true
    );

}


function isConfirmed(report) {

    return (
        hasSymptoms(report) &&
        !isConfounded(report)
    );

}


/* =========================================================
   HAVERSINE DISTANCE
========================================================= */

function toRadians(value) {

    return (
        value *
        Math.PI /
        180
    );

}


function haversineDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const EARTH_RADIUS =
        6371000;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLng =
        toRadians(
            lng2 - lng1
        );


    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(
            toRadians(lat1)
        ) *
        Math.cos(
            toRadians(lat2)
        ) *
        Math.sin(dLng / 2) ** 2;


    return (
        EARTH_RADIUS *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );

}


/* =========================================================
   RISK CALCULATION
========================================================= */

function calculateRisk(
    cluster
) {

    const clusterReports =
        cluster.reports;


    const total =
        clusterReports.length;


    const symptomatic =
        clusterReports.filter(
            hasSymptoms
        ).length;


    const confirmed =
        clusterReports.filter(
            isConfirmed
        ).length;


    const confounded =
        clusterReports.filter(
            isConfounded
        ).length;


    const severe =
        clusterReports.filter(
            hasSevereSymptoms
        ).length;


    const symptomRate =
        total === 0
            ? 0
            : Math.round(
                  (symptomatic / total) *
                      100
              );


    let signalScore =
        confirmed * 15 +
        Math.round(
            symptomRate * 0.4
        ) +
        severe * 10 -
        confounded * 8;


    signalScore =
        Math.max(
            0,
            Math.min(
                100,
                signalScore
            )
        );


    let riskLevel =
        "unknown";


    let riskStatus =
        "Insufficient data";


    if (
        total >= MIN_REPORTS
    ) {

        if (
            confirmed >=
                MIN_CONFIRMED &&
            signalScore >= 60
        ) {

            riskLevel =
                "high";

            riskStatus =
                "Elevated risk signal";

        }

        else if (
            confirmed >= 1 &&
            signalScore >= 35
        ) {

            riskLevel =
                "medium";

            riskStatus =
                "Watch closely";

        }

        else {

            riskLevel =
                "low";

            riskStatus =
                "No elevated signal";

        }

    }


    return {

        totalLogs:
            total,

        symptomaticLogs:
            symptomatic,

        confirmedSymptomaticLogs:
            confirmed,

        confoundedLogs:
            confounded,

        symptomRate:
            symptomRate,

        severeSignals:
            severe,

        signalScore:
            signalScore,

        riskLevel:
            riskLevel,

        riskStatus:
            riskStatus,

    };

}


/* =========================================================
   BUILD CLUSTERS
========================================================= */

function buildClusters() {

    const clusters = [];


    for (
        const report of reports
    ) {

        let matchingCluster =
            null;


        for (
            const cluster of clusters
        ) {

            const distance =
                haversineDistance(
                    report.lat,
                    report.lng,
                    cluster.lat,
                    cluster.lng
                );


            if (
                distance <=
                CLUSTER_RADIUS
            ) {

                matchingCluster =
                    cluster;

                break;

            }

        }


        if (
            matchingCluster
        ) {

            matchingCluster.reports.push(
                report
            );


            const count =
                matchingCluster
                    .reports.length;


            matchingCluster.lat =
                matchingCluster.reports.reduce(
                    (sum, item) =>
                        sum + item.lat,
                    0
                ) / count;


            matchingCluster.lng =
                matchingCluster.reports.reduce(
                    (sum, item) =>
                        sum + item.lng,
                    0
                ) / count;


            const name =
                normalizeLocation(
                    report.locationName
                );


            if (
                !matchingCluster
                    .mergedNames
                    .includes(name)
            ) {

                matchingCluster
                    .mergedNames
                    .push(name);

            }

        }

        else {

            const name =
                normalizeLocation(
                    report.locationName
                );


            clusters.push({

                id:
                    `cluster-${clusters.length + 1}`,

                locationName:
                    name,

                mergedNames:
                    [name],

                lat:
                    report.lat,

                lng:
                    report.lng,

                reports:
                    [report],

            });

        }

    }


    return clusters.map(
        (cluster) => {

            const risk =
                calculateRisk(
                    cluster
                );


            return {

                id:
                    cluster.id,

                locationName:
                    cluster.locationName,

                mergedNames:
                    cluster.mergedNames,

                lat:
                    Number(
                        cluster.lat.toFixed(6)
                    ),

                lng:
                    Number(
                        cluster.lng.toFixed(6)
                    ),

                ...risk,

                reports:
                    cluster.reports,

            };

        }
    );

}


/* =========================================================
   API — HEALTH
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Sentinel Paws API is running 🐾",

            reports:
                reports.length,

        });

    }
);


/* =========================================================
   API — DASHBOARD
========================================================= */

app.get(
    "/api/dashboard",
    (req, res) => {

        const clusters =
            buildClusters();


        const totalReports =
            reports.length;


        const totalWaterways =
            clusters.length;


        const highRisk =
            clusters.filter(
                (cluster) =>
                    cluster.riskLevel ===
                    "high"
            ).length;


        const mediumRisk =
            clusters.filter(
                (cluster) =>
                    cluster.riskLevel ===
                    "medium"
            ).length;


        const lowRisk =
            clusters.filter(
                (cluster) =>
                    cluster.riskLevel ===
                    "low"
            ).length;


        const unknownRisk =
            clusters.filter(
                (cluster) =>
                    cluster.riskLevel ===
                    "unknown"
            ).length;


        const symptomaticReports =
            reports.filter(
                hasSymptoms
            ).length;


        res.json({

            success:
                true,

            summary: {

                totalReports,

                totalWaterways,

                highRisk,

                mediumRisk,

                lowRisk,

                unknownRisk,

                symptomaticReports,

            },

            clusters,

        });

    }
);


/* =========================================================
   API — GET REPORTS
========================================================= */

app.get(
    "/api/reports",
    (req, res) => {

        res.json({

            success:
                true,

            count:
                reports.length,

            reports,

        });

    }
);


/* =========================================================
   API — GET SINGLE REPORT
========================================================= */

app.get(
    "/api/reports/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid report ID",

            });

        }


        const report =
            reports.find(
                (item) =>
                    item.id === id
            );


        if (!report) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "Report not found",

            });

        }


        res.json({

            success:
                true,

            report,

        });

    }
);


/* =========================================================
   API — CREATE REPORT
========================================================= */

app.post(
    "/api/reports",
    (req, res) => {

        const body =
            req.body || {};


        const {
            lat,
            lng,
            locationName,
            dogName,
            contact,
            symptoms,
            ateUnusualFood,
            recentDietChange,
        } = body;


        if (
            typeof lat !== "number" ||
            !Number.isFinite(lat) ||
            lat < -90 ||
            lat > 90
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Latitude must be valid.",

            });

        }


        if (
            typeof lng !== "number" ||
            !Number.isFinite(lng) ||
            lng < -180 ||
            lng > 180
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Longitude must be valid.",

            });

        }


        if (
            !locationName ||
            !String(
                locationName
            ).trim()
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Waterway name is required.",

            });

        }


        const cleanedSymptoms =
            normalizeSymptoms(
                symptoms
            );


        const invalidSymptoms =
            cleanedSymptoms.filter(
                (symptom) =>
                    !VALID_SYMPTOMS.includes(
                        symptom
                    )
            );


        if (
            invalidSymptoms.length
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid symptom selected.",

                invalidSymptoms,

            });

        }


        const validContacts = [
            "swam",
            "waded",
            "drank",
            "other",
        ];


        const cleanContact =
            String(
                contact || "other"
            )
                .trim()
                .toLowerCase();


        if (
            !validContacts.includes(
                cleanContact
            )
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid contact type.",

            });

        }


        const newReport = {

            id:
                nextId++,

            lat,

            lng,

            locationName:
                normalizeLocation(
                    locationName
                ),

            dogName:
                dogName &&
                String(
                    dogName
                ).trim()
                    ? String(
                          dogName
                      ).trim()
                    : "Anonymous",

            contact:
                cleanContact,

            symptoms:
                cleanedSymptoms,

            ateUnusualFood:
                ateUnusualFood === true,

            recentDietChange:
                recentDietChange === true,

            timestamp:
                Date.now(),

        };


        reports.push(
            newReport
        );


        res.status(201).json({

            success:
                true,

            message:
                "Report submitted successfully 🐾",

            report:
                newReport,

        });

    }
);


/* =========================================================
   API — DELETE REPORT
========================================================= */

app.delete(
    "/api/reports/:id",
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const index =
            reports.findIndex(
                (report) =>
                    report.id === id
            );


        if (
            index === -1
        ) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "Report not found",

            });

        }


        reports.splice(
            index,
            1
        );


        res.json({

            success:
                true,

            message:
                "Report deleted successfully",

        });

    }
);


/* =========================================================
   FRONTEND
========================================================= */

app.get(
    "*",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
    (error, req, res, next) => {

        console.error(
            error
        );


        res.status(
            500
        ).json({

            success:
                false,

            message:
                "Internal server error",

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            "\n========================================"
        );

        console.log(
            "🐾 SENTINEL PAWS"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Server: http://localhost:${PORT}`
        );

        console.log(
            `Dashboard: http://localhost:${PORT}`
        );

        console.log(
            `API: http://localhost:${PORT}/api/dashboard`
        );

        console.log(
            "========================================\n"
        );

    }
);