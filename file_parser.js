queryCreator("TACGWTAC");

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