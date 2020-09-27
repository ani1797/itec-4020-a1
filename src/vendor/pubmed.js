const xmlReader = require('xml-reader');
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
    minTime: 333,
    maxConcurrent: 1
})

async function getArticleId(articleName) {
    console.log("Calling the third party service!");
    const endpoint = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`;
    return require("axios").default.get(endpoint, {
        params: {
            db: 'pubmed', term: articleName
        }
    })
    .then(res => readXmlResponse(res.data))
    .then(res => createNewArticle(res, articleName))
    .catch(console.log);
}

function readXmlResponse(xml) {
    const reader = xmlReader.create({stream: true});
    return new Promise((resolve, reject) => {
        const arr = [];
        reader.on('tag:IdList', (title) => {
            arr.push(...title.children)
        });
        reader.on('done', (data) => {
            resolve(arr);
        });
        reader.parse(xml);
    });
}

function  createNewArticle(res, title) {
    console.log(res.length != 0 ? res.map(r => r['children'][0].value).join(",") : null, title);
    return {
        title, id: res.length != 0 ? res.map(r => r['children'][0].value).join(",") : null
    };
}


module.exports = {
    getArticleId: limiter.wrap(getArticleId)
};