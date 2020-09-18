const express = require("express");
const app = express();

function queryCreator(motif) {
    const fs = require("fs");
    const motifsMap = {
        'A': '1.000000 0.000000 0.000000 0.000000',
        'T': '0.000000 0.000000 0.000000 1.000000',
        'G': '0.000000 0.000000 1.000000 0.000000',
        'C': '0.000000 1.000000 0.000000 0.000000',
        'W': '0.500000 0.000000 0.000000 0.500000',
        'R': '0.500000 0.000000 0.500000 0.000000',
        'K': '0.000000 0.000000 0.500000 0.500000',
        'D': '0.333333 0.000000 0.333333 0.333333',
        'M': '0.500000 0.500000 0.000000 0.000000',
        'Y': '0.000000 0.500000 0.000000 0.500000',
        'H': '0.333333 0.333333 0.000000 0.333333',
        'S': '0.000000 0.500000 0.500000 0.000000',
        'V': '0.333333 0.333333 0.333333 0.000000',
        'B': '0.000000 0.333333 0.333333 0.333333',
        'N': '0.250000 0.250000 0.250000 0.250000'
    };
    const heder = "MEME version 4\n\nALPHABET= ACGT\n\nstrands: + -\n\nBackground letter frequencies (from unknown source):\nA 0.250 C 0.250 G 0.250 T 0.250\n\nMOTIF 1 " + motif.toUpperCase() + "\n\nletter-probability matrix: alength= 4 w= 8 nsites= 1 E= 0e+0";
    let matrix = "";

    for (let i = 0; i < motif.length; i++) {
        matrix += "\n" + motifsMap[motif[i]];
    }

    fs.writeFileSync("query_motifs.txt", heder + matrix);
}

function requestInTomtom() {
    const { exec } = require("child_process");

    exec("./src/tomtom -no-ssc -oc testing123 -verbosity 1 -min-overlap 5 -mi 1 -dist pearson -evalue -thresh 10.0 -time 300 query_motifs db/JASPAR_2020.meme", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
    });
}

function tsvJSON(inputTsv) {
    if (!inputTsv) {
        console.log("error: not found tomtom.tsv");
        return;
    }

    let tsv = inputTsv.slice(0, inputTsv.indexOf("#") - 2);
    let lines = tsv.split('\n');
    let headers = lines.shift().split('\t');

    return lines.map(line => {
        let data = line.split('\t');

        return headers.reduce((obj, nextKey, index) => {
            obj[nextKey] = data[index];

            return obj;
        }, {});
    });
}

function parseTomtom() {
    const fs = require("fs");
    let fileContent = fs.readFileSync("tomtom.tsv", "utf8");

    return tsvJSON(fileContent);
}

app.use("/", function (request, response) {
    let motif = request.query.motif;

    queryCreator(motif); //создали query_motifs.txt
    requestInTomtom(); //отправили запрос, получили tomtom.tsv

    let tomtom = parseTomtom(); //получили JSON из tomtom.tsv
    response.send(tomtom); //отправляем JSON на фронт
});

app.listen(3000);