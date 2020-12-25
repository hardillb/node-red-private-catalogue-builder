# node-red-private-catalogue-builder

A minimal web app to host a `catalogue.json` file for a private repository of
Node-RED nodes.

Intended to be run in it's own container as part of either 
[multi-tenant-node-red]() or [multi-tenant-node-red-k8s]()

## Configure

The container takes the following Environment variables:

 - PORT - Which port to listen on (defaults to `3000`)
 - HOST - Which local IP Address to bind to (defaults to `0.0.0.0`)
 - REGISTRY - A host and optional port number to connect to the NPM registry (defaults to `registry:4873`)

 It presents 2 HTTP endpoints

  - /update - a POST to this endpoint will trigger a rebuild of the catalogue
  - /catalogue.json - a GET request returns the current catalogue

The `/update` endpoint is intended to be used with the verdaccio private registry configured to send notifications
when packages are uploaded/updated. e.g.

```
notify:
  method: POST
  headers: [{'Content-Type': 'application/json'}]
  endpoint: http://catalogue/update
  content: '{"name": "{{name}}", "versions": "{{versions}}", "dist-tags": "{{dist-tags}}"}'
```

## Build

Build and push the container to the private container repository.

```
$ docker build . -t catalogue
$ docker tag catalogue private.example.com/catalogue
$ docker push private.example.com/catalogue
```

## Deploy

### Docker-compose

```
  catalogue:
    image: catalogue
    networks:
      - internal
     environment:
      - "REGISTRY=registry:4873"
    depends_on:
      - registry
    expose:
      - "3000"
```

### Kubernetes

```
      - name: catalogue
        image: private.example.com/catalogue
        ports:
        - containerPort: 3000
        env:
        - name: REGISTRY
          value: 'registry:4873'
```