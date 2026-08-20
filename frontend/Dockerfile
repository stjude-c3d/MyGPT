FROM node:20.20.2-alpine3.22
RUN apk add --no-cache \
	openssl=3.5.7-r0 \
	libssl3=3.5.7-r0 \
	libcrypto3=3.5.7-r0
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install --silent
COPY . /app
EXPOSE 3000
CMD ["npm", "start"]
