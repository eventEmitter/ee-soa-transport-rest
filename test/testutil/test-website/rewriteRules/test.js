module.exports = { getRules: function(){
    return [
        { domain: 'test.local', path: null, name: 'template', value: 'error404.nunjucks.html', field: 404 },
        { domain: 'test.local', path: null, name: 'template', value: 'errorDefault.nunjucks.html' },

        { domain: 'test.local', path:'/', name: 'ensure',   value: 1, field: 'api-version' },
        { domain: 'test.local', path:'/', name: 'template', value: 'index.nunjucks.html' },
        { domain: 'test.local', path:'/', name: 'path',     value: '/null' },

        { domain: 'test.local', path:'/api/', name: 'ensure',   value: 1, field: 'api-version' },
        { domain: 'test.local', path:'/api/', name: 'template', value: 'index.api.nunjucks.html' },
    ];
    }
};