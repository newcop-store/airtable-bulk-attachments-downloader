import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as https from 'https';
import { randomBytes } from 'crypto';

type RowType = {
    'Name': string,
    Class: string,
    initialBuyInvoice: string
};

const fileName: string = "urls.csv";
const downloadsFolder: string = 'downloaded';
const folderDist: keyof RowType = 'Class';
const attachmentsColumnNumber: keyof RowType = "initialBuyInvoice";
const urlRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/;

// Generate a random alphanumeric string for file name
const generateRandomString = () => randomBytes(8).toString('hex');

const namingFn = (record: RowType, ext: string, index: number) => `${record.Class}-${generateRandomString()}.${ext}`;

const results: Array<RowType> = [];
fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (data: RowType) => results.push(data))
    .on('end', () => {
        runExtraction(results);
    });

async function runExtraction(results: Array<RowType>) {
    const urls = results.map(row => {
        return row[attachmentsColumnNumber].split(',')
            .filter(url => url?.match(urlRegex)?.length > 0)
            .map(url => url.match(urlRegex)[0]);
    });

    if (!fs.existsSync(downloadsFolder))
        fs.mkdirSync(downloadsFolder);

    for (let index = 0; index < results.length; index++) {
        const row = results[index];

        for (let listIndex = 0; listIndex < urls[index].length; listIndex++) {
            const url = urls[index][listIndex];
            const fileExtension = getUrlExt(url) || 'unknown';

            const fileName = namingFn(row, fileExtension, listIndex);

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
