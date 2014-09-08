var http 	= require("http"),
		fs		= require("fs")

var configFileContent = fs.readFileSync("config.json","utf-8")

var echoJSConfig = eval(configFileContent)

var int = 0;
for(var key in echoJSConfig) {
	var proxyConfig = echoJSConfig[key]

	proxyConfig.name = key;
	var proxyPort	= proxyConfig.port;
	var endpoint 	= proxyConfig.endpoint;
	var echoPort	= proxyConfig.echoPort;

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
	    var fileName = getProxyFileName(proxyConfig,req);
			try {
				var discoveredResponseType = discoverType(proxyConfig,fileName);
				if(discoveredResponseType != null)
					res.setHeader("Content-Type", discoveredResponseType);

				fs.readFile(fileName,function(err,response) {
					if(err == null) {
						var myresponse = response.toString().replace(/\s*?\/\/.*?\n/g,"")
						
						res.end(myresponse);
					}
					else
						res.end("could not deliver echo because of: "+err);
				});
			}
	    catch (exception) {
				res.end("could not deliver echo because of: "+exception);
			}
	  });
    echoServer.listen(echoPort);
		console.log("Echo Server for \""+key+"\" listining on port: "+echoPort);
	}

}

function discoverType(config,fileName) {
	if(config.returnTypes != null) {
		for(var typeConfig in config.returnTypes) {
			if(fileName.match(config.returnTypes[typeConfig].regEx) != null)
				return config.returnTypes[typeConfig].type;

		}
	}
	if(config.defaultReturnType != null)
		return config.defaultReturnType;

	return null;
}

function getProxyFileName(config, req) {
	var directory = config.directory+"/"+config.name;
	if(!fs.existsSync(directory))
		fs.mkdirSync(directory)

	return directory+"/"+req.url.replace(/\//g,"@@")+"_"+req.method
}
