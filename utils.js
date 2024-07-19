async function loadFakeCsvData() {
    return [
        ["id", "full_name", "email", "is_subscriber", "score"],
        ["1", "Ambur Wynrehame", "awynrehame0@yelp.com", "false", "4.064"],
        ["2", "Donnamarie Khomin", "dkhomin1@paginegialle.it", "false", "3.351"],
        ["3", "Almeria Upchurch", "aupchurch2@usgs.gov", "true", "4.854"],
        ["4", "Josie Kibel", "jkibel3@newyorker.com", "false", "0.04"],
        ["5", "Raymond Veeler", "rveeler4@uiuc.edu", "false", "1.464"],
        ["6", "Agneta Castaneda", "acastaneda5@spiegel.de", "true", "2.885"],
        ["7", "Rodrick Jedrys", "rjedrys6@europa.eu", "false", "2.343"],
        ["8", "Cy Simounet", "csimounet7@dailymail.co.uk", "true", "2.021"],
        ["9", "Justino Devo", "jdevo8@alexa.com", "false", "2.616"],
        ["10", "Shaylah Teall", "steall9@theglobeandmail.com", "false", "0.078"],
        ["11", "Nomi Kretschmer", "nkretschmera@hugedomains.com", "false", "1.396"],
        ["12", "Revkah Trethowan", "rtrethowanb@sphinn.com", "false", "0.457"],
        ["13", "Gerald Burris", "gburrisc@prlog.org", "true", "1.523"],
        ["14", "Haskell Dionis", "hdionisd@google.cn", "true", "0.425"],
        ["15", "Annamaria Gawith", "agawithe@ifeng.com", "false", "0.303"],
        ["16", "Romeo Brundill", "rbrundillf@go.com", "false", "4.534"],
        ["17", "Sherilyn Gunthorpe", "sgunthorpeg@ftc.gov", "true", "4.162"],
        ["18", "Lambert Spiteri", "lspiterih@nasa.gov", "false", "2.077"],
        ["19", "Herold Jannequin", "hjannequini@ycombinator.com", "true", "1.348"],
        ["20", "Haleigh Moncreif", "hmoncreifj@opensource.org", "true", "2.398"],
        ["21", "Margaretta Ruppertz", "mruppertzk@imageshack.us", "false", "3.437"],
        ["22", "Keefe Wanjek", "kwanjekl@stumbleupon.com", "false", "3.686"],
        ["23", "Lynea Jacobowicz", "ljacobowiczm@who.int", "false", "0.92"],
        ["24", "Yettie Frankcombe", "yfrankcomben@java.com", "true", "0.172"],
        ["25", "Bathsheba Cleobury", "bcleoburyo@technorati.com", "true", "0.423"],
        ["26", "Ginnifer Holttom", "gholttomp@aol.com", "true", "4.386"],
        ["27", "Ellynn Whetnell", "ewhetnellq@huffingtonpost.com", "true", "4.062"],
        ["28", "Jordon Pauleau", "jpauleaur@epa.gov", "false", "0.804"],
        ["29", "Marianne Attwood", "mattwoods@histats.com", "false", "2.495"],
        ["30", "Adolf Torvey", "atorveyt@umn.edu", "false", "2.331"],
        ["31", "Mame Figures", "mfiguresu@indiegogo.com", "false", "0.228"],
        ["32", "Laurie Longea", "llongeav@walmart.com", "false", "4.503"],
        ["33", "Francklyn Brasier", "fbrasierw@edublogs.org", "true", "2.147"],
        ["34", "Ardis Bate", "abatex@ezinearticles.com", "false", "2.713"],
        ["35", "Cora Rydeard", "crydeardy@themeforest.net", "true", "4.266"],
        ["36", "Stephana Swaine", "sswainez@exblog.jp", "false", "2.716"],
        ["37", "Tallie Skunes", "tskunes10@craigslist.org", "true", "3.955"],
        ["38", "Jareb Jansik", "jjansik11@epa.gov", "false", "4.407"],
        ["39", "Caril Hambribe", "chambribe12@soundcloud.com", "false", "0.719"],
        ["40", "Merlina Cornfoot", "mcornfoot13@reuters.com", "true", "1.854"],
        ["41", "Priscilla Verdy", "pverdy14@gmpg.org", "true", "0.67"],
        ["42", "Chryste Gehring", "cgehring15@goodreads.com", "false", "4.621"],
        ["43", "Tessi Bedford", "tbedford16@themeforest.net", "false", "2.185"],
        ["44", "Nate Langstone", "nlangstone17@hc360.com", "false", "1.444"],
        ["45", "Veronica Desson", "vdesson18@home.pl", "true", "4.207"],
        ["46", "Sherie Rubel", "srubel19@un.org", "false", "3.962"],
        ["47", "Ellissa Adlard", "eadlard1a@nytimes.com", "false", "0.42"],
        ["48", "Aeriel Monery", "amonery1b@go.com", "true", "0.877"],
        ["49", "Danell Pettengell", "dpettengell1c@purevolume.com", "true", "4.139"],
        ["50", "Fayette Eaklee", "feaklee1d@chron.com", "true", "0.462"]
    ];
}

const generateNextColumnName = (colNum) => {
    if (!colNum || colNum <= 0) {
        return ""
    }

    let response = ""
    do {
        colNum -= 1
        const base = Math.floor(colNum / 26);
        const remainder = colNum % 26;
        const suffix = String.fromCharCode(65 + remainder)
        response = suffix + response
        colNum = base;
    } while(colNum != 0);

    return response;
}

const generateNextColumnNameRecursive = (colNum) => {
    if (colNum === 0) {
        return ""
    }

    colNum -= 1

    const base = Math.floor(colNum / 26);
    const remainder = colNum % 26;
    const suffix = String.fromCharCode(65 + remainder)
    const prefix = generateNextColumnName(base);

    return `${prefix}${suffix}`
}

const getCellPositionFromId = (id) => {
    const [rowNum, colNum] = id.split("-").map(s => parseInt(s))

    return [
        rowNum,
        generateNextColumnName(colNum)
    ]
}

function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
