module.exports = { getRules: function(){
    return [
        { domain: 'test.local', path:'/', name: 'ensure',   value: 1, field: 'api-version' },
        { domain: 'test.local', path:'/', name: 'template', value: 'index.nunjucks.html' },
        { domain: 'test.local', path:'/', name: 'path',     value: '/null' },

        { domain: 'test.local', path:'/api/', name: 'ensure',   value: 1, field: 'api-version' },
        { domain: 'test.local', path:'/api/', name: 'template', value: 'index.api.nunjucks.html' },
    ];
    }
};