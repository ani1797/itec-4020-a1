const { getArticleId } = require('../vendor/pubmed');
const xmlReader = require('xml-reader');
const fs = require('fs');

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
            const articles = await extractArticleTitles(file.data.toString());
            res.send(articles.map(art => art.title));
            const results = [];
            console.time("Batch Processing")
            const batchSize = 20;
            const btchs =  batches(articles.map(getArticleId), batchSize);
            for (var i = 0; i< btchs.length; i++) {
                console.time(`==== ${i+1} of ${btchs.length} ====`);
                const rr = (await Promise.all(btchs[i])).filter(r => r != null);
                console.log(`---- Batch ${i+1}: ${rr.length} of ${batchSize} ------------\n\n`);
                console.timeEnd(`==== ${i+1} of ${btchs.length} ====`);
                results.push(...rr.map(item => `\n\t<PubmedArticle>\n\t\t<PMID>${item.id}</PMID>\n\t\t<ArticleTitle>${item.title}</ArticleTitle>\n\t</PubmedArticle>`));
            }
            console.timeEnd("Batch Processing");
            fs.writeFile('group_7_result.xml', `<PubmedArticleSet>${results.join('\n')}</PubmedArticleSet>`, function(err){
                if (err) return console.log(err);
                else console.log('File written successfully!');
            });
        }
    } catch (error) {
        console.log(error);
        res.json({
            message: 'There was an issue processing the request.'
        });
    }
};

async function extractArticleTitles(xml) {
    const reader = xmlReader.create({ stream: true });
    return new Promise((resolve, reject) => {
        const arr = [];
        reader.on('tag:Article', article => {
            var title;
            try {
                title = article.children.find(child => child.name === 'ArticleTitle');
                const issue = ifPresent(article.children.find(child => child.name === 'Journal'), c => c.children.find(child => child.name === 'JournalIssue'));
                const authorList = article.children.find(child => child.name === 'AuthorList');
                const issn = ifPresent(article.children.find(child => child.name === 'Journal'), c => c.children.find(child => child.name === 'ISSN'));
                const firstAuthorName = authorList != undefined ? authorList.children[0] : { children: [] };
                const art = {
                    title: title.children[0].value,
                    volume: ifPresent(issue.children.find(child => child.name === 'Volume'), c => c.children.length >= 1 ? c.children[0].value : null),
                    issue: ifPresent(issue.children.find(child => child.name === 'Issue'), c => c.children.length >= 1 ? c.children[0].value : null),
                    lastName: ifPresent(firstAuthorName.children.find(child => child.name === 'LastName'), c => c.children.length >= 1 ? c.children[0].value : null),
                    initial: ifPresent(firstAuthorName.children.find(child => child.name === 'Initials'), c => c.children.length >= 1 ? c.children[0].value : null),
                    issn: issn.children[0].value
                };
                arr.push(art);
            } catch (e) {
                console.log(title.children[0].value);
                throw e;
            }
        });
        reader.on('done', (data) => {
            console.log('Done reading the entire XML');
            resolve(arr);
        });
        reader.parse(xml);
    });
}

function batches(array, count) {
    return array.reduce((groups, d) => {
        if (groups[groups.length - 1].length < count) {
            groups[groups.length - 1].push(d);
        } else {
            groups.push([d]);
        }
        return groups;
    }, [[]])
}

function ifPresent(v, callback) {
    return v !== null && v !== undefined ? callback(v) : null;
}

module.exports = handler;
