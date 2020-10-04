const xmlReader = require('xml-reader');
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
    minTime: 100,
    maxConcurrent: 3
})

async function getArticleId(articleName) {
    const endpoint = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`;
    return require("axios").default.get(endpoint, {
        params: {
            db: 'pubmed', 
            term: articleName,
            api_key: '2befe853f3d36c4bf25bf568d42a31db9609',
            tool: 'ITEC_4010_ASSIGNMENT',
            field: 'Title'
        }
    })
    .then(res => readXmlResponse(res.data))
    .then(res => createNewArticle(res, articleName))
    .catch(error => {
        console.error("There was an issue making an request", error);
    });
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
    const count = res.length != 0 ? res.map(r => r['children'][0].value).length : 0;
    const ids = res.length != 0 ? res.map(r => r['children'][0].value).join(",") : null;
    if (count != 1) console.log(`Title: '${title}', Has resulted in ${count} PMID's, List: ${ids}`);
    return {
        title, id: res.length != 0 ? res.map(r => r['children'][0].value).join(",") : null
    };
}

module.exports = {
    getArticleId: limiter.wrap(getArticleId)
};