const HTTP = require("http");
const URL = require("url");
const PATH = require("path");
const FS = require("fs").promises;

const HOST = "0.0.0.0";
const PORT = 3300;
const SRC_DIR = "src/";
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

const pages = {
	index: null
}

let server;
let currentDir;

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
			let page = pages[route];
			currentDir = "/" + route;

			if(page) {
				response.setHeader("Content-Type", "text/html");
				response.writeHead(200);
				response.end(page);
			} else {
				//404
				response.setHeader("Content-Type", "text/html");
				response.writeHead(302, {'Location': '/404/'});
				response.end();
			}
		} else if(ext) {
			//static file request

			if (parsedPath.dir.startsWith(currentDir)) {
				pathname = `${parsedPath.dir.replace(currentDir, SRC_DIR)}/${parsedPath.base}`;
			}

			FS.readFile(`${__dirname}/${SRC_DIR}${pathname}`)
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

function init() {
	readPages().then(() => startServer());
}

async function readPages() {
	const pageNames = Object.keys(pages);
	for(let pageName of pageNames) {
		pages[pageName] = await getHtml(`${SRC_DIR}${pageName}.html`);
	}
}

async function getHtml(path) {
	return await FS.readFile(__dirname + `/${path}`, "utf8")
		.then((contents) => {
			return contents;
		})
		.catch(err => {
			console.error(`Could not read ${path} file: ${err}`);
			process.exit(1);
		});
}

init();