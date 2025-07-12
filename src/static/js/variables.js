const converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    simplifiedAutoLink: true
});
let handlersConfigs = JSON.parse(localStorage.getItem('handlersConfigs' || '{}'))
let availableHandlers = {}
