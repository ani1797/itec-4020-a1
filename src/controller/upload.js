const { getArticleId } = require('../vendor/pubmed');
const XMLWriter = require('xml-writer');
const XMLReader = require('xml-reader');

 async function handler(req, res) {
    try {
        console.log("Recieved a request to process a file");
        if (!req.files) {
            console.log("No files uploaded");
            res.json( {message: 'No files uploaded'} );
        } else {
            console.log("Starting to process the uploaded file!");
            const file = req.files.file;
            const titles = await extractArticleTitles(file.data.toString());
            const promises = titles.map(getArticleId);
            const results = await Promise.all(promises);
            res.send("Done Processing: " + JSON.stringify(results));
        }
    } catch(error) {
        console.log(error);
        res.json({
            message: 'There was an issue processing the request.'
        });
    }
};

async function extractArticleTitles(xml) 
{
    const reader = XMLReader.create({stream: true});
    return new Promise((resolve,reject) => {
        const arr = [];
        reader.on('tag:ArticleTitle', title =>{ 
            arr.push(title.children[0].value) });
        reader.on('Done reading the entire XML File.', (data) => {
            console.log('Done reading the entire XML File');
            resolve(arr);});
        reader.parse(xml);});
}

module.exports = handler;