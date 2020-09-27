const express = require("express");
const app = express();

function queryCreator(motif) {
    const fs = require("fs");
    motif = motif.toUpperCase();

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
    const heder = "MEME version 4\n\nALPHABET= ACGT\n\nstrands: + -\n\nBackground letter frequencies (from unknown source):\nA 0.250 C 0.250 G 0.250 T 0.250\n\nMOTIF 1 " + motif + "\n\nletter-probability matrix: alength= 4 w= 8 nsites= 1 E= 0e+0";
    let dir = `./${motif}`;
    let matrix = "";

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    for (let i = 0; i < motif.length; i++) {
        matrix += "\n" + motifsMap[motif[i]];
    }

    fs.writeFileSync(`${dir}/query_motifs.txt`, heder + matrix);
}

function requestInTomtom(motif) {
    const { exec } = require("child_process");

    exec(`./src/tomtom -no-ssc -oc testing123 -verbosity 1 -min-overlap 5 -mi 1 -dist pearson -evalue -thresh 10.0 -time 300 ${motif.toUpperCase()}/query_motifs db/JASPAR_2020.meme`, (error, stdout, stderr) => {
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

function xmlJSON(inputXml) {
    if (!inputXml) {
        console.log("error: not found tomtom.xml");
        return;
    }

    const xml2js = require('xml2js');
    let json;

    xml2js.parseString(inputXml, (err, result) => {
        if (err) {
            throw err;
        }

        json = JSON.stringify(result, null, 4);
    });

    return json;
}

function parseTomtom(motif) {
    const fs = require("fs");
    motif = motif.toUpperCase();
    let fileTsv = tsvJSON(fs.readFileSync(`${motif}/tomtom.tsv`, "utf8"));
    let fileXml = xmlJSON(fs.readFileSync(`${motif}/tomtom.xml`, "utf8"));

    return "{tsv: " + JSON.stringify(fileTsv, null, 4) + ", xml: " + fileXml + "}";
}

function deleteDir(path) {
    const fs = require("fs");

    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            let curPath = path + "/" + file;

            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(path);
    }
};

app.use("/data", function (request, response) {
    const fs = require('fs');
    let motif = request.query.motif;
    let tsv = false;
    let xml = false;

    queryCreator(motif); //создали query_motifs.txt
    requestInTomtom(motif); //отправили запрос, получили tomtom.tsv, tomtom.xml

    let watcher = fs.watch(`${motif}`, function (event, filename) {
        if (filename === 'tomtom.tsv') {
            tsv = true;
        }
        if (filename === 'tomtom.xml') {
            xml = true;
        }
        if (xml && tsv) {
            console.log('kjhbjhgbjbkj')
            watcher.close();
            let tomtom = parseTomtom(motif); //получили JSON из tomtom.tsv
            response.send(tomtom); //отправляем JSON на фронт
            deleteDir(motif.toUpperCase()); //удаляем папку после отправки ответа
        }
    });
});

app.listen(3000);