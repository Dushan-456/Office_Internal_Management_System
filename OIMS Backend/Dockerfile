# Use official Node.js 20 image as base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 5001

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.mjs"]
