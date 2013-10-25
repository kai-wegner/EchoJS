var http 	= require("http"),
	fs		= require("fs")

var configFileContent = fs.readFileSync("config.json","utf-8")

var echoJSConfig = eval(configFileContent)

var int = 0;
for(var key in echoJSConfig) {
	var proxyConfig = echoJSConfig[key]
	
	var proxyPort	= proxyConfig.port
	var endpoint 	= proxyConfig.endpoint
	var echoPort	= proxyConfig.echoPort

	if(proxyPort != null) {
		var proxyServer = http.createServer(function(req,res) {
			var fileName = getProxyFileName(key,req)

		    var req_options = {
		        host: endpoint.host,
		        port: endpoint.port,
		        path: req.url,
		        method: req.method
		    }
		    if(fs.existsSync(fileName))
		    	fs.writeFileSync(fileName,"")

		    var proxy_req = http.request(req_options, function(proxy_response) {
		        proxy_response.pipe(res)
		        var responseCache = ''
		        proxy_response.on('data', function (chunk) {
		        	fs.appendFileSync(fileName,chunk)
		        })
		        res.writeHead(proxy_response.statusCode, proxy_response.headers)
		    })
		    req.pipe(proxy_req)
		});
		proxyServer.listen(proxyPort)
	}
	if(echoPort != null) {
		var echoServer = http.createServer(function(req,res) {
			var fileName = getProxyFileName(key,req)
			res.end(fs.readFileSync(fileName))
		})
		echoServer.listen(echoPort)
	}

}

function getProxyFileName(folder, req) {
	if(!fs.existsSync(folder))
		fs.mkdirSync(folder)

	return folder+"/"+req.url.replace(/\//g,"@@")+"_"+req.method
}
