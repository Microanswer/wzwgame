let StaticServer = require("static-server");
let server = new StaticServer({
    rootPath: './src/',           // required, the root of the server file tree
    port: 3000,                    // required, the port to listen
    name: 'microanswer-test-server',   // optional, will set "X-Powered-by" HTTP header
    host: undefined,               // optional, defaults to any interface
    cors: '*',                     // optional, defaults to undefined
    followSymlink: true,           // optional, defaults to a 404 error
    templates: {
        index: 'index.html',      // optional, defaults to 'index.html'
    }
});

server.on('request', (req, res) => {
    res.setHeader("author", "Microanswer");
});

server.start(() => {
    console.log("服务已开启：http://127.0.0.1:3000/");
});