#https://therahulsarkar.medium.com/containerize-your-next-js-14-application-with-docker-a-step-by-step-guide-93a6133fe073

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]