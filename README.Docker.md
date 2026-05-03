### Building and running your application

When you're ready, build the image from the `Dockerfile`:

`docker build -t portofolio .`

Then start a container from it, mapping port 8888 on your host to port 8888 in the container:

`docker run --rm -p 8888:8888 -e NODE_ENV=production --name portofolio portofolio`

Your application will be available at http://localhost:8888.

To stop the container, press `Ctrl+C` (or run `docker stop portofolio` from another terminal). To run it detached in the background, add the `-d` flag:

`docker run -d -p 8888:8888 -e NODE_ENV=production --name portofolio portofolio`

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)