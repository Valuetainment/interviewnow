FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create a .env file if it doesn't exist
RUN touch .env

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"] 