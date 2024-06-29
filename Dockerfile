FROM node:18

COPY ./ ./

RUN npm install

CMD ["node", "main.js"]