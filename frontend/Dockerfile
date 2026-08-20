FROM node:20.20.2-alpine3.22
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install --silent
COPY . /app
EXPOSE 3000
CMD ["npm", "start"]
