const xmlReader = require('xml-reader');
const Bottleneck = require('bottleneck');
const axios = require("axios").default;

const limiter = new Bottleneck({
    minTime: 100,
    maxConcurrent: 2
})

async function getArticleId(article) {
    return getArticleByTitle(article.title)
        .catch(err => getArticleByJournal(article.title, article.volume, article.issue))
        .catch(err => getArticleByAuthor(article.title, article.lastName, article.initials))
        .catch(err => getArticleByAll(article.title, article.volume, article.issue, article.lastName, article.initial))
        .then(res => ({ title: article.title, ...res}));
}

function getArticleByTitle(title) {
    return callAPI({ term: title, field: 'Title' });
}

function getArticleByJournal(title, vol, issue) {
    if (vol == null || issue == null) return Promise.reject("No volume or issue to search by!");
    return callAPI({
        term: `${title} ${str(vol, 'Volume')} ${str(issue, 'Issue')}`,
        field: 'Title'
    });
}

function getArticleByAuthor(title, lastName, initial) {
    if (lastName == null || initial == null) return Promise.reject("No author to search by");
    return callAPI({
        term: `${title} ${str( [lastName, initial].filter(n => n != null).join(' ') , 'Author')}`,
        field: 'Title'
    });
}

function getArticleByAll(title, vol, issue,  lastName, initial) {
    return callAPI({
        term: `${title} ${str(vol, 'Volume')} ${str(issue, 'Issue')} ${str( [lastName, initial].filter(n => n != null).join(' ') , 'Author')}`,
        field: 'Title'
    });
}

function str(v, tag) {
    return v != null ? `${v} [${tag}]` : '';
}

function callAPI(params) {
    const query = {
        db: 'pubmed',
        api_key: '2befe853f3d36c4bf25bf568d42a31db9609',
        tool: 'ITEC_4010_ASSIGNMENT',
        retmode: 'json',
        ...params 
    };
    console.log("Calling API with query: ", params);
    const endpoint = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`;
    return axios.get(endpoint, {
        params: query
    }).then(res => {
        const esearch = res.data['esearchresult'];
        const count = esearch['count'];
        if (count != 1) throw new Error(`Too many or no results: ${count}`);
        return {count: count, id: esearch['idlist'].join('')};
    });
}

module.exports = {
    getArticleId: limiter.wrap(getArticleId)
};