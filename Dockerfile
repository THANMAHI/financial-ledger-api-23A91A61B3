# Use the official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Your app binds to port 3000
EXPOSE 3000

# Start the application
CMD [ "node", "cmd/api/server.js" ]