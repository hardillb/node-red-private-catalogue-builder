FROM node:12-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --no-fund --no-update-notifier
COPY . .

EXPOSE 80

CMD [ "node", "index.js" ]