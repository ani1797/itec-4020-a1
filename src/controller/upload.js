const { getArticleId } = require('../vendor/pubmed');
const XMLWriter = require('xml-writer');
const xmlReader = require('xml-reader');
const fs = require('fs');
const fileLocation = require('path');

 async function handler(req, res) {
    try {
        console.log("Recieved a request to process a file.");
        if (!req.files) {
            console.log("No files uploaded");
            res.json({
                message: 'No files uploaded'
            });
        } else {
            console.log("Starting to process the uploaded file!");
            // File was recieved
            const file = req.files.file;
            const titles = await extractArticleTitles(file.data.toString());
            const promises = titles.map(getArticleId);
            const results = await Promise.all(promises);
            const xmlresults = writeXml(results);
            console.log(xmlresults);
            res.send("Done Processing: " + JSON.stringify(results));
            fs.writeFile('group_unknown_result.xml',xmlresults, function(err){
                if (err) return console.log(err);
                else return console.log('File written successfully!');
            })
        }
    } catch(error) {
        console.log(error);
        res.json({
            message: 'There was an issue processing the request.'
        });
    }
};

async function extractArticleTitles(xml) {
    const reader = xmlReader.create({stream: true});
    return new Promise((resolve, reject) => {
        const arr = [];
        reader.on('tag:Article', article => {
            const title = article.children.find(child => child.name === 'ArticleTitle');
            const issue = ifPresent(article.children.find(child => child.name === 'Journal'), c => c.children.find(child => child.name === 'JournalIssue'));
            const art = {
                title: title.children[0].value,
                volume: ifPresent(issue.children.find(child => child.name === 'Volume'), c => c.children.length >= 1 ? c.children[0].value: null),
                issue: ifPresent(issue.children.find(child => child.name === 'Issue'), c => c.children.length >= 1 ? c.children[0].value: null)
            };
            arr.push(art);
        });
        reader.on('done', (data) => {
            console.log('Done reading the entire XML');
            resolve(arr);
        });
        reader.parse(xml);
    });
}

function writeXml(array) {
    var body = array.map(item => `\n <PubmedArticle>\n      <PMID>${item.id}</PMID>\n      <ArticleTitle>${item.title}</ArticleTitle>\n </PubmedArticle>`).join('');
    return `<PubmedArticleSet>${body}\n</PubmedArticleSet>`
  }

function ifPresent(v, callback) {
    return v !== null && v!== undefined ? callback(v) : null;
}

module.exports = handler;