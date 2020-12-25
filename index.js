const http = require('http')
const morgan = require('morgan')
const express = require('express')
const bodyParser = require('body-parser')
const superagent = require('superagent')


const port = (process.env.PORT || 3000)
const listenHost = (process.env.HOST || '0.0.0.0')
const registryHost = (process.env.REGISTRY || 'registry:4873') 
const keyword = "node-red"

const url = "http://" + registryHost +  "/-/all"

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
	.end((err, res) => {
		if (!err) {
			const nodes = res.body;
			var nodeNames = Object.keys(nodes);
			const index = nodeNames.indexOf("_updated");
			if (index > -1) {
			  nodeNames.splice(index, 1);
			}

			for (const node in nodeNames) {
				var n = nodes[nodeNames[node]];
				if (n.keywords.indexOf(keyword) != -1) {
					var entry = {
						id: n.name,
						version: n["dist-tags"].latest,
						description: n.description,
						keywords: n.keywords,
						updated_at: n.time.modified,
						url: "http://" + registryHost + "/-/web/details/" + n.name
					}
					catalogue.modules.push(entry)
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
	const update = req.body

	update()
	res.status(200).send();
})

app.get('/catalogue.json', (req, res, next) => {
	res.send(catalogue)
})

// app.head('/catalogue.json', (req,res,next) => {
	
// })

update()

const server = http.Server(app);
server.listen(port, listenHost, function(){
	console.log('App listening on  %s:%d!', listenHost, port);
});
