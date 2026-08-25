FROM node:22.23.2-alpine3.24
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install --silent
COPY . /app
EXPOSE 3000
CMD ["npm", "start"]
