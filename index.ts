//@ts-nocheck
import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as https from 'https';

type RowType = {
    'Name': string,
    Class: string,
    buyInvoice: string,
    Order: string
};

const fileName: string = "urls.csv";
const downloadsFolder: string = 'franceToSpainAugust2024';
const folderDist: keyof RowType = 'Class';
const attachmentsColumnNumber: keyof RowType = "buyInvoice";
const urlRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/;

// Modify the naming function to use the 'Order' column without the index
const namingFn = (record: RowType, ext: string) => {
    const orderValue = record['Order'];
    if (!orderValue) {
        console.error(`Order is undefined for record:`, record);
        return `undefined.${ext}`;
    }
    return `${orderValue.trim()}.${ext}`;
};

const results: Array<RowType> = [];
fs.createReadStream(fileName)
    .pipe(csv({
        mapHeaders: ({ header }) => header.trim() // Trimming headers to ensure correct mapping
    }))
    .on('data', (data: RowType) => results.push(data))
    .on('end', () => {
        runExtraction(results);
    });

async function runExtraction(results: Array<RowType>) {
    const urls = results.map(row => {
        return row[attachmentsColumnNumber]?.split(',')
            .filter(url => url?.match(urlRegex)?.length > 0)
            .map(url => url.match(urlRegex)[0]);
    });

    if (!fs.existsSync(downloadsFolder))
        fs.mkdirSync(downloadsFolder);

    for (let index = 0; index < results.length; index++) {
        const row = results[index];

        for (let url of urls[index] || []) {
            const fileExtension = getUrlExt(url) || 'unknown';

            const fileName = namingFn(row, fileExtension);

            if (!fs.existsSync(`./${downloadsFolder}/${row[folderDist]}`))
                fs.mkdirSync(`./${downloadsFolder}/${row[folderDist]}`);

            const filePath = `./${downloadsFolder}/${row[folderDist]}/${fileName}`;
            const file = fs.createWriteStream(filePath);
            await requestAndSave(url, file);

            console.info(`✅ Downloaded to ${filePath}`);
        }
    }
}

function getUrlExt(url: string): string | null {
    return 'pdf';
}

function requestAndSave(url: string, file: fs.WriteStream): Promise<void> {
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', err => {
                reject(err);
            });
        }).on('error', err => {
            reject(err);
        });
    });
}
