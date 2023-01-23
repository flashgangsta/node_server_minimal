const HTTP = require("http");
const URL = require("url");
const PATH = require("path");
const FS = require("fs").promises;

const HOST = "0.0.0.0";
const PORT = 3300;
const routes = {
	"/": "index",
}
const filesContentTypeMap = {
	".ico": "image/x-icon",
	".html": "text/html",
	".js": "text/javascript",
	".json": "application/json",
	".css": "text/css",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ttf": "application/octet-stream"
};

let server;

function requestListener(request, response) {
	const requestURL = request.url;
	console.log(requestURL);

	if (request.method === "POST") {
		let body = "";
		request.on("data", data => body += data);
		request.on("end", () => {
			switch (requestURL) {
				case "/api/set_data/":
					response.writeHead(200, {"Content-Type": "text/html"});
					response.end("Success");
					break;
				default:
					response.writeHead(404, {"Content-Type": "text/html"});
					response.end("Method not found");

			}
		});
	} else if(request.method === "GET") {
		const parsedUrl = URL.parse(request.url);
		let pathname = `${parsedUrl.pathname}`;
		const parsedPath = PATH.parse(pathname);
		const ext = parsedPath.ext;
		let route = routes[`${parsedPath.dir}${parsedPath.name}`];

		if(route) {
			//page request

			switch (requestURL) {
				case "/":
					response.setHeader("Content-Type", "text/html");
					response.writeHead(200);
					response.end("Hi");
					break;
				default:
					//404
					response.setHeader("Content-Type", "text/html");
					response.writeHead(302, {'Location': '/404/'});
					response.end();

			}
		} else if(ext) {
			//static file request
			FS.readFile(__dirname + pathname)
				.then((data) => {
					response.setHeader("Content-type", filesContentTypeMap[ext] || "text/plain");
					response.end(data);
				})
				.catch(err => {
					console.error(`Could not read ${pathname} file: ${err}`);
					process.exit(1);
				});
		} else {
			//method request
			switch (requestURL) {
				case "/api/get_data/":
					response.setHeader("Content-Type", "application/json");
					response.writeHead(200);
					response.end({data: "data"}.toString());
					break;
			}
		}
	}
}

function startServer() {
	server = HTTP.createServer(requestListener);
	server.listen(PORT, HOST, () => {
		console.log(`Server is running on http://${HOST}:${PORT}`);
	});
}

startServer();