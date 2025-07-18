FROM node:20.19.4-slim
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN npm install --silent
RUN npm install react-scripts@4.0.3 -g --silent
COPY . /app
COPY env_example /app/.env
EXPOSE 3000
CMD ["npm", "start"]