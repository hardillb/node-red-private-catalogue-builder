const fs = require('fs')
const cors = require('cors')
const path = require('path')
const http = require('http')
const morgan = require('morgan')
const express = require('express')
const bodyParser = require('body-parser')
const superagent = require('superagent')
const nodeRedModule = require('node-red-module-parser')


const port = (process.env.PORT || 80)
const listenHost = (process.env.HOST || '0.0.0.0')
const registryHost = (process.env.REGISTRY || 'http://registry:4873') 
const keyword = (process.env.KEYWORD || "node-red")

// const url = registryHost +  "/-/all"
const url = registryHost + "/-/v1/search"

const catalogue = {
  "name":"Ben's custom catalogue",
  "updated_at": new Date().toISOString(),
  "modules": [
    // {
    //   "id": "@ben/ben-node-random",
    //   "version": "1.0.0",
    //   "description": "A node-red node that generates random numbers",
    //   "keywords": [
    //     "node-red",
    //     "random"
    //   ],
    //   "updated_at": "2020-09-21T18:37:50.673Z",
    //   "url": "http://flows.hardill.me.uk/node/ben-red-random"
    // }
  ]
}

function update() {

	//reset list
	catalogue.modules = [];

	superagent.get(url)
	.end(async (err, res) => {
		if (!err) {
			const nodes = res.body.objects;
			var nodeNames = Object.keys(nodes);

			for (const node in nodeNames) {
				// var n = nodes[nodeNames[node]];
				if (node === undefined) {
					continue;
				}
				var n = nodes[node].package;
				if (n.keywords) {
					if (n.keywords.indexOf(keyword) != -1) {
						try {
						  let details = await superagent
						  	.get(registryHost + "/" + n.name)
						  	.set('accept', 'json')
						  let latest = details.body['dist-tags'].latest
						  let version = details.body.versions[latest]
						  let tar = version.dist.tarball
						  let tarDir = path.join("temp", nodeNames[node])
						  fs.mkdirSync(tarDir,{recursive: true})
						  let tarPath = path.join(tarDir, nodeNames[node].split('/').slice(-1) + ".tgz")
						  let tarRes = await superagent.get(tar).responseType('blob')
						  fs.writeFileSync(tarPath, tarRes.body)
						  let moduleDetails = nodeRedModule.examinTar(tarPath, tarDir)
						  fs.rmSync(tarDir, {force: true, recursive: true})

						  var entry = {
								id: n.name,
								version: n["dist-tags"].latest,
								description: n.description,
								keywords: n.keywords,
								updated_at: n.time.modified,
								url: registryHost + "/-/web/detail/" + n.name
							}

							if (moduleDetails.types.length) {
								entry.types = moduleDetails.types
							}
							if (moduleDetails["node-red"]) {
								catalogue.modules.push(entry)
							}
						} catch (e) {
							console.log("err",e)
						}
					}
				}
			}

			console.log(JSON.stringify(catalogue, null, 2));
		} else {
			console.log(err);
		}
	});

}

const app = express()
app.use(morgan("combined"))
app.use(bodyParser.json())

app.post('/update', (req, res, next) => {
	const updateRequest = req.body
	console.log(JSON.stringify(updateRequest,null, 2))

	update()
	res.status(200).send();
})

app.get('/catalogue.json', cors(), (req, res, next) => {
	res.send(catalogue)
})

// app.head('/catalogue.json', (req,res,next) => {
	
// })

update()

const server = http.Server(app);
server.listen(port, listenHost, function(){
	console.log('App listening on  %s:%d!', listenHost, port);
});
