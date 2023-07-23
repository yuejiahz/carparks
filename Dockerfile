# syntax=docker/dockerfile:1
   
FROM node:14-alpine
WORKDIR /app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn install --production
COPY . .
RUN yarn build

EXPOSE 3000
CMD ["npm", "start"]