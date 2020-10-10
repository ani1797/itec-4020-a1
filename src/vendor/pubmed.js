const xmlReader = require('xml-reader');
const Bottleneck = require('bottleneck');
const axios = require("axios").default;

const limiter = new Bottleneck({
    minTime: 100,
    maxConcurrent: 2
})

async function getArticleId({title, volume, issue, initial, lastName, issn}) {
    
    return getArticleByTitle(title)
        .catch(err => getArticleByJournal(title, volume, issue))
        .catch(err => getArticleByAuthor(title, lastName, initial))
        .catch(err => getArticleByISSN(title,issn))
        .catch(err => getArticleByVolueISSNandIssue(title, volume, issue, issn))
        .catch(err => getArticleByAll(title, volume, issue,lastName, initial))
        .then(res => ({  title, ...res}))
        .catch(error => {
            console.log(error);
            console.log(`!!!! ${title} !!!!!`);
        });
}

function getArticleByTitle(title) {
    return callAPI(title).catch(err => {
        const charas = ['[', ']', '(', ')', '\"', "\\", "\/"]
        if (hasSpecialCharacters(title, charas)) {
            charas.forEach(chr => {
                title = title.replace(chr, '');
            })
            console.log("Removed escaped characters " + title);
            return callAPI(title);
        }
        throw err;
    });
}


function hasSpecialCharacters(title, charas) {
    return charas.find(chr => title.indexOf(chr) !== -1);
}

function getArticleByVolueISSNandIssue(title, vol, issue, issn) {
    return callAPI( `${title} ${str(vol, 'Volume')} ${str(issue, 'Issue')} ${str(issn, 'Issn')}`);
}

function getArticleByJournal(title, vol, issue) {
    return callAPI(`${title} ${str(vol, 'Volume')} ${str(issue, 'Issue')}`).catch(err => {
        if (issue.contains('Pt')) return callAPI(`${title} ${str(vol, 'Volume')} ${str(issue.split()[0], 'Issue')}`);
        throw err;
    });
}

function getArticleByAuthor(title, lastName, initial) {
    return callAPI(`${title} ${str( [lastName, initial].filter(n => n != null).join(' ') , 'Author')}`);
}

function getArticleByAll(title, vol, issue,  lastName, initial) {
    return callAPI(`${title} ${str(vol, 'Volume')} ${str(issue, 'Issue')} ${str( [lastName, initial].filter(n => n != null).join(' ') , 'Author')}`);
}

function getArticleByISSN(title, issn) {
    return callAPI(`${title} ${str(issn, 'ISSN')}`);
}

function str(v, tag) {
    return v != null ? `${v} [${tag}]` : '';
}


const callAPI = term => {
    console.log("Calling API with query: ", term);
    const endpoint = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`;
    return axios.get(endpoint, {
        params:  {
            db: 'pubmed',
            api_key: '2befe853f3d36c4bf25bf568d42a31db9609',
            tool: 'ITEC_4010_ASSIGNMENT',
            retmode: 'json',
            field: 'Title',
            term
        }
    }).then(res => {
        const esearch = res.data['esearchresult'];
        const count = esearch['count'];
        if (count != 1) {
            throw new Error(`Too many or no results: ${count}`);
        }
        return {count: count, id: esearch['idlist'].join('')};
    });
};

module.exports = {
    getArticleId:  limiter.wrap(getArticleId)
};